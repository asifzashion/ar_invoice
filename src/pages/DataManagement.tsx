import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { parseExcelFile } from '../lib/excelParser';

export function DataManagement() {
  const { excelData, setExcelData, invoices } = useStore();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ count: number; error?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setResult({ count: 0, error: 'Please upload an .xlsx or .xls file' });
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const data = await parseExcelFile(file);
      setExcelData(data);
      setResult({ count: Object.keys(data).length });
    } catch (err) {
      setResult({ count: 0, error: String(err) });
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const excelCount = Object.keys(excelData).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Data Management</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload the master Excel file to populate invoice project details (Columns A–H)
        </p>
      </div>

      {/* Info */}
      <Card>
        <CardBody className="py-3">
          <div className="flex items-start gap-2.5">
            <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-800 mb-1">Expected Excel Format</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-slate-500">
                {[
                  ['Column A', 'Invoice Number'],
                  ['Column B', 'Customer ID'],
                  ['Column C', 'Customer Name'],
                  ['Column D', 'Transaction Date'],
                  ['Column E', 'Purchase Order'],
                  ['Column F', 'Project ID'],
                  ['Column G', 'Project Description'],
                  ['Column H', 'PM Name'],
                ].map(([col, label]) => (
                  <div key={col} className="flex gap-2">
                    <span className="font-mono text-blue-600 font-medium">{col}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Columns I onward are ignored — all tracking is managed within the app.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Upload zone */}
      <Card>
        <CardBody>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
              dragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleChange}
            />
            <FileSpreadsheet
              size={40}
              className={`mx-auto mb-3 ${dragging ? 'text-blue-500' : 'text-slate-400'}`}
            />
            <p className="font-semibold text-slate-700 mb-1">
              {dragging ? 'Drop to upload' : 'Drag & drop your Excel file here'}
            </p>
            <p className="text-sm text-slate-400 mb-4">or click to browse</p>
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
              <Upload size={14} /> Choose File
            </Button>
            <p className="text-xs text-slate-400 mt-3">Supports .xlsx and .xls files</p>
          </div>

          {uploading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Parsing Excel file...
            </div>
          )}

          {result && (
            <div
              className={`mt-4 flex items-start gap-2 p-3 rounded-lg ${
                result.error
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-emerald-50 border border-emerald-200'
              }`}
            >
              {result.error ? (
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${result.error ? 'text-red-700' : 'text-emerald-700'}`}>
                {result.error ||
                  `Successfully loaded ${result.count} invoice records from Excel. Master data has been updated.`}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Current data status */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900">Current Data Status</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active Invoices</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-700">{excelCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Excel Records</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-700">
                {excelCount > 0 ? '✓' : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Data Source</p>
            </div>
          </div>

          {excelCount > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Loaded Invoice Numbers</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExcelData({})}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={13} /> Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {Object.keys(excelData).map((num) => (
                  <span
                    key={num}
                    className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
