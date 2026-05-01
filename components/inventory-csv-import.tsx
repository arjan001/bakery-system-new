'use client';

import { useState, useCallback, useRef } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';
import { logAudit, type AuditAction } from '@/lib/audit-logger';
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Loader2, Download, Trash2 } from 'lucide-react';

interface Distributor {
  id: string;
  name: string;
}

interface InventoryRow {
  name: string;
  type: 'Consumable' | 'Non-Consumable';
  category: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  reorder_level: number;
  reorder_qty: number;
  auto_reorder: boolean;
  supplier: string;
  distributor: string;
  last_restocked: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; name: string; error: string }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  distributors: Distributor[];
}

const TEMPLATE_HEADER = 'Item Name,Type,Category,Quantity,Unit,Unit Cost,Reorder Level,Reorder Qty,Auto Reorder,Supplier,Distributor,Last Restocked';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseNumber(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseBool(val: string): boolean {
  if (!val) return false;
  const v = val.trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === 'y' || v === '1' || v === 'on';
}

function normalizeType(val: string): 'Consumable' | 'Non-Consumable' {
  if (!val) return 'Consumable';
  const v = val.trim().toLowerCase();
  if (v.includes('non')) return 'Non-Consumable';
  return 'Consumable';
}

function parseDate(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return '';
}

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function generateTemplate(): string {
  const sample1 = 'All Purpose Flour,Consumable,Baking,50,kg,120,10,25,yes,Unga Ltd,,2026-04-15';
  const sample2 = 'Cling Film Roll,Non-Consumable,Packaging,12,rolls,450,2,5,no,Packaging Plus,,';
  return [TEMPLATE_HEADER, sample1, sample2].join('\n');
}

function parseInventoryCSV(content: string): { rows: InventoryRow[]; errors: string[] } {
  const cleaned = content.replace(/^﻿/, '');
  const lines = cleaned.split(/\r?\n/).filter(l => l.trim());
  const errors: string[] = [];
  const rows: InventoryRow[] = [];

  if (lines.length < 2) {
    errors.push('CSV must have a header row and at least one data row.');
    return { rows, errors };
  }

  let headerIdx = -1;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('item name') || (lower.includes('name') && lower.includes('quantity'))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    errors.push('Could not find header row. Expected: Item Name, Type, Category, Quantity, Unit, ...');
    return { rows, errors };
  }

  const headers = parseCSVLine(lines[headerIdx]);
  const colMap: Record<string, number> = {};
  const keywords: Record<string, string[]> = {
    name: ['item name', 'name'],
    type: ['type'],
    category: ['category'],
    quantity: ['quantity', 'qty'],
    unit: ['unit'],
    unit_cost: ['unit cost', 'cost'],
    reorder_level: ['reorder level', 'reorder lvl'],
    reorder_qty: ['reorder qty', 'reorder quantity'],
    auto_reorder: ['auto reorder', 'auto-reorder'],
    supplier: ['supplier'],
    distributor: ['distributor'],
    last_restocked: ['last restocked', 'restocked'],
  };

  for (const [key, kws] of Object.entries(keywords)) {
    const idx = headers.findIndex(h => kws.some(kw => h.toLowerCase() === kw));
    if (idx !== -1) { colMap[key] = idx; continue; }
    const partial = headers.findIndex(h => kws.some(kw => h.toLowerCase().includes(kw)));
    if (partial !== -1) colMap[key] = partial;
  }

  if (colMap.name === undefined) {
    errors.push('Missing required column: Item Name');
    return { rows, errors };
  }

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const name = (cols[colMap.name] || '').trim();
    if (!name || name.toLowerCase() === 'item name') continue;
    rows.push({
      name,
      type: normalizeType(cols[colMap.type] || ''),
      category: (cols[colMap.category] || '').trim(),
      quantity: parseNumber(cols[colMap.quantity] || '0'),
      unit: (cols[colMap.unit] || 'pcs').trim() || 'pcs',
      unit_cost: parseNumber(cols[colMap.unit_cost] || '0'),
      reorder_level: parseNumber(cols[colMap.reorder_level] || '0'),
      reorder_qty: parseNumber(cols[colMap.reorder_qty] || '0'),
      auto_reorder: parseBool(cols[colMap.auto_reorder] || ''),
      supplier: (cols[colMap.supplier] || '').trim(),
      distributor: (cols[colMap.distributor] || '').trim(),
      last_restocked: parseDate(cols[colMap.last_restocked] || ''),
    });
  }

  return { rows, errors };
}

export function buildInventoryCSV(items: Array<Record<string, unknown>>, distributors: Distributor[]): string {
  const distMap = new Map(distributors.map(d => [d.id, d.name]));
  const lines = items.map(r => {
    const distId = (r.distributor_id || '') as string;
    return [
      csvEscape(r.name),
      csvEscape(r.type || 'Consumable'),
      csvEscape(r.category || ''),
      csvEscape(r.quantity ?? 0),
      csvEscape(r.unit || ''),
      csvEscape(r.unit_cost ?? 0),
      csvEscape(r.reorder_level ?? 0),
      csvEscape(r.reorder_qty ?? 0),
      csvEscape(r.auto_reorder ? 'yes' : 'no'),
      csvEscape(r.supplier || ''),
      csvEscape(distId ? (distMap.get(distId) || '') : ''),
      csvEscape(r.last_restocked || ''),
    ].join(',');
  });
  return [TEMPLATE_HEADER, ...lines].join('\n');
}

export function InventoryCsvImport({ isOpen, onClose, onImported, distributors }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<InventoryRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const reset = () => {
    setFile(null);
    setParsedRows([]);
    setParseErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setImportResult(null);
    setParseErrors([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setParseErrors(['Failed to read file content']);
        return;
      }
      const { rows, errors } = parseInventoryCSV(content);
      setParsedRows(rows);
      setParseErrors(errors);
      if (rows.length > 0) showToast(`Parsed ${rows.length} items`, 'success');
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith('.csv') || dropped.type === 'text/csv')) {
      handleFileSelect(dropped);
    } else {
      showToast('Please upload a CSV file', 'error');
    }
  }, [handleFileSelect]);

  const downloadTemplate = () => {
    const csv = generateTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    const result: ImportResult = { total: parsedRows.length, success: 0, failed: 0, errors: [] };

    const distByName = new Map(distributors.map(d => [d.name.trim().toLowerCase(), d.id]));

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      try {
        if (!row.name) throw new Error('Item name is required');
        const distributorId = row.distributor
          ? (distByName.get(row.distributor.toLowerCase()) || null)
          : null;

        const dbRow = {
          name: row.name,
          type: row.type,
          category: row.category || null,
          quantity: row.quantity,
          unit: row.unit || 'pcs',
          unit_cost: row.unit_cost,
          reorder_level: row.reorder_level,
          reorder_qty: row.reorder_qty,
          auto_reorder: row.auto_reorder,
          supplier: row.supplier || null,
          distributor_id: distributorId,
          last_restocked: row.last_restocked || null,
        };

        const { data: existing } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('name', row.name)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase.from('inventory_items').update(dbRow).eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('inventory_items').insert(dbRow);
          if (error) throw error;
        }
        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          name: row.name,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    logAudit({
      action: 'BULK_IMPORT' as AuditAction,
      module: 'Inventory',
      record_id: 'inventory-csv',
      details: { total: result.total, success: result.success, failed: result.failed, filename: file?.name },
      trackChangelog: true,
      changelogTitle: `Bulk Inventory Import — ${result.success} Items`,
      changelogDescription: `Imported ${result.success} of ${result.total} items from CSV "${file?.name || 'inventory'}"${result.failed > 0 ? ` (${result.failed} failed)` : ''}.`,
      changelogCategory: 'feature',
    });

    setImportResult(result);
    setImporting(false);

    if (result.failed === 0) {
      showToast(`Successfully imported ${result.success} items`, 'success');
    } else {
      showToast(`Imported ${result.success}/${result.total}. ${result.failed} failed.`, 'error');
    }
    onImported();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Inventory from CSV" size="3xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-[70] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="space-y-4 p-6 max-h-[75vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Bulk-seed inventory items. Existing items (matched by name) are updated.
          </p>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            <Download size={14} />
            Download Template
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            file ? 'border-green-400 bg-green-50/50' : 'border-border hover:border-primary/40 hover:bg-secondary/30'
          }`}
        >
          {!file ? (
            <div className="space-y-3">
              <Upload size={36} className="mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Drop your CSV here</p>
                <p className="text-xs text-muted-foreground mt-1">or click below to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={22} className="text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB &bull; {parsedRows.length} items parsed
                  </p>
                </div>
              </div>
              <button type="button" onClick={reset} className="text-muted-foreground hover:text-red-600" aria-label="Remove file">
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {parseErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={16} className="text-red-600" />
              <span className="font-medium text-red-800 text-sm">Parse Errors</span>
            </div>
            <ul className="text-xs text-red-700 space-y-1">
              {parseErrors.map((err, i) => <li key={i}>&bull; {err}</li>)}
            </ul>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-blue-600" />
            <span className="font-medium text-blue-800">Expected Columns</span>
          </div>
          {TEMPLATE_HEADER}
          <p className="mt-1 text-blue-600">
            Type accepts &quot;Consumable&quot; or &quot;Non-Consumable&quot;. Auto Reorder accepts yes/no/true/false. Last Restocked uses YYYY-MM-DD.
          </p>
        </div>

        {parsedRows.length > 0 && !importResult && (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/50 px-3 py-2 text-sm font-medium">Preview ({parsedRows.length} items)</div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-xs">
                <thead className="bg-secondary/30 border-b border-border">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Category</th>
                    <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Qty</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Unit</th>
                    <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Cost</th>
                    <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Reorder</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Distributor</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-2 py-1.5 font-medium max-w-[160px] truncate">{r.name}</td>
                      <td className="px-2 py-1.5">{r.type}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{r.category || '—'}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{r.quantity}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{r.unit}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{r.unit_cost}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{r.reorder_level}</td>
                      <td className="px-2 py-1.5 text-muted-foreground max-w-[120px] truncate">{r.distributor || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {importResult && (
          <div className={`border rounded-lg p-3 ${importResult.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {importResult.failed === 0 ? (
                <CheckCircle2 size={18} className="text-green-600" />
              ) : (
                <AlertTriangle size={18} className="text-amber-600" />
              )}
              <span className="font-medium text-sm">Import Complete: {importResult.success}/{importResult.total} succeeded</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center mb-2">
              <div className="bg-white rounded p-2 border"><p className="text-lg font-bold">{importResult.total}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
              <div className="bg-white rounded p-2 border"><p className="text-lg font-bold text-green-600">{importResult.success}</p><p className="text-[10px] text-muted-foreground">Success</p></div>
              <div className="bg-white rounded p-2 border"><p className="text-lg font-bold text-red-600">{importResult.failed}</p><p className="text-[10px] text-muted-foreground">Failed</p></div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="max-h-32 overflow-auto text-xs space-y-0.5">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-red-600">Row {err.row}: {err.name} — {err.error}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary"
          >
            Close
          </button>
          {parsedRows.length > 0 && !importResult && (
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {importing ? `Importing... (${parsedRows.length})` : `Import ${parsedRows.length} Items`}
            </button>
          )}
          {importResult && (
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary"
            >
              Upload Another
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
