import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper: resolve M-Pesa config from env vars first, fallback to database backup
let _dbSettingsCache: Record<string, string> | null = null;
let _dbSettingsCacheTime = 0;
const DB_CACHE_TTL = 60_000; // 1 minute

async function getMpesaConfig(): Promise<Record<string, string>> {
  const envConfig: Record<string, string> = {
    consumer_key: (process.env.MPESA_CONSUMER_KEY || '').trim(),
    consumer_secret: (process.env.MPESA_CONSUMER_SECRET || '').trim(),
    shortcode: (process.env.MPESA_SHORTCODE || '').trim(),
    passkey: (process.env.MPESA_PASSKEY || '').trim(),
    callback_url: (process.env.MPESA_CALLBACK_URL || '').trim(),
    env: (process.env.MPESA_ENV || 'sandbox').trim(),
  };

  // If all essential env vars are set, use them directly
  if (envConfig.consumer_key && envConfig.consumer_secret && envConfig.shortcode) {
    return envConfig;
  }

  // Fallback: load missing values from database backup
  try {
    const now = Date.now();
    if (!_dbSettingsCache || now - _dbSettingsCacheTime > DB_CACHE_TTL) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data } = await supabase.from('mpesa_settings').select('setting_key, setting_value');
        if (data) {
          _dbSettingsCache = {};
          for (const row of data) {
            _dbSettingsCache[row.setting_key] = row.setting_value;
          }
          _dbSettingsCacheTime = now;
        }
      }
    }

    if (_dbSettingsCache) {
      const dbMap: Record<string, string> = {
        consumer_key: _dbSettingsCache.mpesa_consumer_key || '',
        consumer_secret: _dbSettingsCache.mpesa_consumer_secret || '',
        shortcode: _dbSettingsCache.mpesa_shortcode || '',
        passkey: _dbSettingsCache.mpesa_passkey || '',
        callback_url: _dbSettingsCache.mpesa_callback_url || '',
        env: _dbSettingsCache.mpesa_env || 'sandbox',
      };

      // Merge: env vars take precedence, DB fills gaps
      for (const key of Object.keys(envConfig)) {
        if (!envConfig[key] && dbMap[key]) {
          envConfig[key] = dbMap[key];
        }
      }
    }
  } catch {
    // DB fallback failed, continue with env vars only
  }

  return envConfig;
}

// M-Pesa Daraja API URL helpers
function getAuthUrl(env: string) {
  return env === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
}

function getStkUrl(env: string) {
  return env === 'production'
    ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
}

function getQueryUrl(env: string) {
  return env === 'production'
    ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
    : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';
}

// Safely parse JSON from a fetch response, handling empty or non-JSON bodies
async function safeJsonParse(response: Response): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const status = response.status;
  const text = await response.text();

  if (!text || text.trim().length === 0) {
    return {
      ok: response.ok,
      status,
      data: { error: `Empty response from API (HTTP ${status})` },
    };
  }

  try {
    const data = JSON.parse(text);
    return { ok: response.ok, status, data };
  } catch {
    return {
      ok: false,
      status,
      data: { error: `Invalid JSON response from API (HTTP ${status}): ${text.substring(0, 200)}` },
    };
  }
}

async function getAccessToken(config: Record<string, string>): Promise<string> {
  if (!config.consumer_key || !config.consumer_secret) {
    throw new Error('M-Pesa consumer key and secret are not configured. Please set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in your environment variables or admin settings.');
  }

  const auth = Buffer.from(
    `${config.consumer_key}:${config.consumer_secret}`
  ).toString('base64');

  const response = await fetch(getAuthUrl(config.env), {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  });

  const result = await safeJsonParse(response);

  if (!result.ok || !result.data.access_token) {
    const errMsg = result.data.error || result.data.errorMessage || result.data.error_description || `Authentication failed (HTTP ${result.status})`;
    throw new Error(`M-Pesa auth failed: ${errMsg}`);
  }

  return result.data.access_token as string;
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function formatPhone(phone: string): string {
  let formatted = phone.replace(/\s/g, '');
  if (formatted.startsWith('+')) formatted = formatted.substring(1);
  if (formatted.startsWith('0')) formatted = '254' + formatted.substring(1);
  if (!formatted.startsWith('254')) formatted = '254' + formatted;
  return formatted;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle STK query
    if (body.action === 'query') {
      return handleStkQuery(body.checkoutRequestId);
    }

    // Match latest completed payment by amount (no STK)
    if (body.action === 'match') {
      return handleMpesaMatch(body.amount, body.phone);
    }

    // Handle STK push
    const { phone, amount, accountReference, description } = body;

    if (!phone || !amount) {
      return NextResponse.json(
        { success: false, message: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    const config = await getMpesaConfig();

    if (!config.consumer_key || !config.consumer_secret) {
      return NextResponse.json(
        { success: false, message: 'M-Pesa API credentials are not configured. Please set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in your environment variables or configure them in Admin Settings > M-Pesa API.' },
        { status: 500 }
      );
    }

    const formattedPhone = formatPhone(phone);
    const accessToken = await getAccessToken(config);
    const timestamp = generateTimestamp();
    const shortcode = config.shortcode || '174379';
    const passkey = config.passkey || '';
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const callbackUrl = config.callback_url || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bakery-system-new.netlify.app'}/api/mpesa/callback`;

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference || 'SNACKOH',
      TransactionDesc: description || 'POS Payment',
    };

    const response = await fetch(getStkUrl(config.env), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const result = await safeJsonParse(response);
    const data = result.data;

    if (!result.ok && data.error) {
      return NextResponse.json(
        { success: false, message: `M-Pesa API error: ${data.error}` },
        { status: 502 }
      );
    }

    if (data.ResponseCode === '0') {
      // Store the transaction in Supabase for tracking
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase.from('mpesa_transactions').insert({
            checkout_request_id: data.CheckoutRequestID,
            merchant_request_id: data.MerchantRequestID,
            phone: formattedPhone,
            amount: Math.ceil(amount),
            account_reference: accountReference || 'SNACKOH',
            status: 'pending',
          });
        }
      } catch (e) {
        console.error('Failed to store mpesa transaction:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'STK Push sent successfully. Check your phone.',
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
      });
    } else {
      return NextResponse.json(
        { success: false, message: (data.errorMessage || data.CustomerMessage || 'STK Push failed') as string, data },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, message: `M-Pesa error: ${message}` },
      { status: 500 }
    );
  }
}

async function handleMpesaMatch(amount: number, phone?: string) {
  if (!amount) {
    return NextResponse.json(
      { success: false, status: 'invalid', message: 'Amount is required' },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { success: false, status: 'unavailable', message: 'Payment verification not available' },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const amountRounded = Math.ceil(amount);
  const windowMinutes = Number(process.env.MPESA_MATCH_WINDOW_MINUTES || 10);
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  let query = supabase
    .from('mpesa_transactions')
    .select('*')
    .in('status', ['completed', 'Completed', 'COMPLETED'])
    .eq('amount', amountRounded)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1);

  if (phone) {
    query = query.eq('phone', formatPhone(phone));
  }

  const { data } = await query;
  const txn = Array.isArray(data) ? data[0] : null;

  if (txn) {
    return NextResponse.json({
      success: true,
      status: 'matched',
      amount: txn.amount,
      phone: txn.phone,
      checkoutRequestId: txn.checkout_request_id,
      mpesaRef: txn.mpesa_receipt_number || txn.mpesa_receipt || txn.mpesaRef || null,
    });
  }

  return NextResponse.json({
    success: false,
    status: 'not_found',
    message: 'No matching payment found',
  });
}

async function handleStkQuery(checkoutRequestId: string) {
  try {
    // First check our database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: txn } = await supabase
        .from('mpesa_transactions')
        .select('*')
        .eq('checkout_request_id', checkoutRequestId)
        .single();

      if (txn && txn.status === 'completed') {
        return NextResponse.json({
          success: true,
          status: 'completed',
          mpesaRef: txn.mpesa_receipt_number,
          amount: txn.amount,
        });
      }

      if (txn && txn.status === 'failed') {
        return NextResponse.json({
          success: false,
          status: 'failed',
          message: txn.result_desc || 'Payment failed or cancelled',
        });
      }
    }

    // Fall back to querying M-Pesa API directly
    const config = await getMpesaConfig();
    const accessToken = await getAccessToken(config);
    const timestamp = generateTimestamp();
    const shortcode = config.shortcode || '174379';
    const passkey = config.passkey || '';
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const response = await fetch(getQueryUrl(config.env), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });

    const result = await safeJsonParse(response);
    const data = result.data;

    if (!result.ok && data.error) {
      return NextResponse.json({
        success: false,
        status: 'pending',
        message: `Unable to verify payment: ${data.error}`,
      });
    }

    if (data.ResultCode === '0' || data.ResultCode === 0) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        message: data.ResultDesc,
      });
    } else {
      return NextResponse.json({
        success: false,
        status: data.ResultCode === '1032' ? 'cancelled' : 'pending',
        message: (data.ResultDesc || 'Payment pending') as string,
      });
    }
  } catch (error) {
    console.error('STK query error:', error);
    return NextResponse.json({
      success: false,
      status: 'pending',
      message: 'Unable to verify payment status',
    });
  }
}
