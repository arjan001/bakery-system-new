'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, X, Smartphone, Share, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// ─── PWA Install Context ──────────────────────────────────────────────────────
// Shared state so that both the floating prompt and the sidebar button
// can trigger the same native install prompt.

interface PwaInstallContextValue {
  canInstall: boolean;
  isInstalled: boolean;
  triggerInstall: () => void;
  showInstructions: () => void;
}

const PwaInstallContext = createContext<PwaInstallContextValue>({
  canInstall: false,
  isInstalled: false,
  triggerInstall: () => {},
  showInstructions: () => {},
});

export const usePwaInstall = () => useContext(PwaInstallContext);

// ─── Detect browser for install instructions ──────────────────────────────────

function getBrowserInfo(): { name: string; isMobile: boolean } {
  if (typeof window === 'undefined') return { name: 'unknown', isMobile: false };
  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  if (/CriOS|Chrome/i.test(ua) && !/Edg/i.test(ua)) return { name: 'chrome', isMobile };
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return { name: 'safari', isMobile };
  if (/Edg/i.test(ua)) return { name: 'edge', isMobile };
  if (/Firefox/i.test(ua)) return { name: 'firefox', isMobile };
  return { name: 'other', isMobile };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PwaInstallPrompt({ children }: { children?: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);

  // Check if the app is already installed (standalone mode)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Check if user previously dismissed
    try {
      const dismissedUntil = localStorage.getItem('pwa_dismissed_until');
      if (dismissedUntil) {
        const until = parseInt(dismissedUntil, 10);
        if (Date.now() < until) {
          setDismissed(true);
        } else {
          localStorage.removeItem('pwa_dismissed_until');
        }
      }
    } catch { /* ignore */ }

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Register service worker — do this on page load, not only when logged in,
  // so the browser can detect PWA installability from the start.
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(() => { setSwRegistered(true); })
      .catch((err) => {
        console.error('Service worker registration failed:', err);
      });
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // No native prompt available — show manual instructions
      setShowInstructionsModal(true);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    // Re-show after 24 hours
    try {
      localStorage.setItem('pwa_dismissed_until', String(Date.now() + 24 * 60 * 60 * 1000));
    } catch { /* ignore */ }
  }, []);

  const canInstall = !isInstalled && (!!deferredPrompt || swRegistered);

  const browserInfo = getBrowserInfo();

  // ── Install Instructions Modal ──
  const instructionsModal = showInstructionsModal && (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowInstructionsModal(false)}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone size={20} className="text-orange-600" />
            <h3 className="text-lg font-bold text-gray-900">Install Snackoh App</h3>
          </div>
          <button onClick={() => setShowInstructionsModal(false)} className="p-1 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Install this app on your device for quick access, offline support, and a native app experience.
        </p>

        {browserInfo.name === 'safari' ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Tap the Share button</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  <Share size={12} className="inline mr-1" />
                  Located in the browser toolbar {browserInfo.isMobile ? '(bottom center)' : '(top toolbar)'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Select &quot;Add to Home Screen&quot;</p>
                <p className="text-xs text-gray-500 mt-0.5">Scroll down in the share menu to find it</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Tap &quot;Add&quot;</p>
                <p className="text-xs text-gray-500 mt-0.5">The app will appear on your home screen</p>
              </div>
            </div>
          </div>
        ) : browserInfo.name === 'chrome' || browserInfo.name === 'edge' ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {browserInfo.isMobile ? 'Tap the menu' : 'Click the install icon'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {browserInfo.isMobile ? (
                    <><MoreVertical size={12} className="inline mr-1" />Three dots menu at the top right</>
                  ) : (
                    <><Download size={12} className="inline mr-1" />Look for the install icon in the address bar (right side)</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {browserInfo.isMobile ? 'Select "Install app" or "Add to Home screen"' : 'Click "Install"'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Follow the on-screen prompts to complete installation</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Open in Chrome or Edge</p>
                <p className="text-xs text-gray-500 mt-0.5">For the best install experience, use Chrome or Edge browser</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Look for the install icon</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  <Download size={12} className="inline mr-1" />
                  In the address bar or browser menu
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowInstructionsModal(false)}
          className="mt-5 w-full py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );

  // ── Floating Install Banner ──
  const showFloatingBanner = isLoggedIn && canInstall && !dismissed;

  return (
    <PwaInstallContext.Provider value={{ canInstall, isInstalled, triggerInstall: handleInstallClick, showInstructions: () => setShowInstructionsModal(true) }}>
      {children}
      {showFloatingBanner && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 bg-orange-600 text-white pl-4 pr-2 py-2.5 rounded-full shadow-lg hover:bg-orange-700 transition-colors">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 font-medium text-sm cursor-pointer"
            >
              <Download size={16} strokeWidth={2.5} />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="ml-1 p-1 rounded-full hover:bg-orange-500 transition-colors cursor-pointer"
              aria-label="Dismiss install prompt"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
      {instructionsModal}
    </PwaInstallContext.Provider>
  );
}
