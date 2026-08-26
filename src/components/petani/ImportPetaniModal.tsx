import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Petani } from '../../types';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Copy, 
  Check, 
  Trash2, 
  HelpCircle, 
  Info,
  Layers,
  RefreshCw,
  FileText,
  UserCheck,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { formatKg } from '../../lib/utils';
import { downloadPetaniExcelTemplate, readUploadedSpreadsheet } from '../../lib/excelHelper';

interface ImportPetaniModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  idTemp: string;
  nama: string;
  nik: string;
  noHp: string;
  blokLahan: string;
  luasHa: number;
  jmlPokok: number;
  bank: string;
  noRekening: string;
  statusAktif: boolean;
  tanggalGabung: string;
  isValid: boolean;
  errors: string[];
  selected: boolean;
}

const TEMPLATE_CSV_CONTENT = `\uFEFFNama Lengkap,NIK,No HP/WhatsApp,Blok Lahan,Luas Ha,Jumlah Pokok,Bank,No Rekening,Status,Tanggal Gabung
H. Syamsudin Siregar,1401021508750001,081268492011,Blok A (Utara),2.5,340,BRI,1234-01-004589-53-2,Aktif,2024-01-15
M. Yusuf Hasibuan,1401021903800002,085271904423,Blok B (Timur),3.0,410,Bank Mandiri,108-00-1492048-1,Aktif,2024-01-15
Siti Rohana Harahap,1401024511820003,082194002931,Blok C (Selatan),1.8,245,BSI,7145892011,Aktif,2024-02-01
Ahmad Ridwan Dalimunthe,1401020304780004,081372849102,Blok D (Barat),4.0,550,BRI,5421-01-009182-50-3,Aktif,2024-02-10
H. Buyung Sulaeman,1401020807720005,081275893012,Blok A (Utara),2.0,270,BSI,7129481023,Aktif,2024-03-01`;

export const ImportPetaniModal: React.FC<ImportPetaniModalProps> = ({ isOpen, onClose }) => {
  const { importPetaniList, petaniList } = useApp();

  const [inputTab, setInputTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download template functions
  const handleDownloadExcel = () => {
    downloadPetaniExcelTemplate();
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([TEMPLATE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Data_Petani_Kelompok_Tani.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy template text to clipboard
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(TEMPLATE_CSV_CONTENT);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Convert raw json object array (from SheetJS or JSON) to ParsedRow[]
  const processRawObjects = (rawObjects: Record<string, unknown>[], sourceName?: string) => {
    if (sourceName) setFileName(sourceName);

    const rows: ParsedRow[] = rawObjects.map((obj, idx) => {
      const errors: string[] = [];
      
      // Find name key
      const namaKey = Object.keys(obj).find(k => 
        k.toLowerCase().includes('nama') || k.toLowerCase().includes('anggota') || k.toLowerCase().includes('petani')
      );
      const namaVal = namaKey ? String(obj[namaKey] ?? '').trim() : '';
      if (!namaVal) {
        errors.push('Nama petani kosong');
      }

      // NIK
      const nikKey = Object.keys(obj).find(k => k.toLowerCase().includes('nik') || k.toLowerCase().includes('ktp'));
      const nikVal = nikKey && obj[nikKey] ? String(obj[nikKey]).trim() : `140101${Date.now().toString().slice(-10)}`;

      // No HP
      const hpKey = Object.keys(obj).find(k => 
        k.toLowerCase().includes('hp') || k.toLowerCase().includes('wa') || k.toLowerCase().includes('telepon') || k.toLowerCase().includes('kontak')
      );
      const hpVal = hpKey && obj[hpKey] ? String(obj[hpKey]).trim() : '081234567890';

      // Blok
      const blokKey = Object.keys(obj).find(k => k.toLowerCase().includes('blok') || k.toLowerCase().includes('lokasi') || k.toLowerCase().includes('lahan'));
      const blokVal = blokKey && obj[blokKey] ? String(obj[blokKey]).trim() : 'Blok A (Utara)';

      // Luas Ha
      const luasKey = Object.keys(obj).find(k => k.toLowerCase().includes('luas') || k.toLowerCase().includes('ha') || k.toLowerCase().includes('hektar'));
      let luasHa = 2.0;
      if (luasKey && obj[luasKey] !== undefined) {
        const rawStr = String(obj[luasKey]).replace(',', '.').replace(/[^0-9.]/g, '');
        const p = parseFloat(rawStr);
        if (!isNaN(p) && p > 0) luasHa = Number(p.toFixed(2));
      }

      // Pokok
      const pokokKey = Object.keys(obj).find(k => k.toLowerCase().includes('pokok') || k.toLowerCase().includes('batang') || k.toLowerCase().includes('tanaman'));
      let jmlPokok = Math.round(luasHa * 136);
      if (pokokKey && obj[pokokKey] !== undefined) {
        const p = parseInt(String(obj[pokokKey]).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(p) && p > 0) jmlPokok = p;
      }

      // Bank
      const bankKey = Object.keys(obj).find(k => k.toLowerCase().includes('bank'));
      const bankVal = bankKey && obj[bankKey] ? String(obj[bankKey]).trim() : 'BRI';

      // Rekening
      const rekKey = Object.keys(obj).find(k => k.toLowerCase().includes('rekening') || k.toLowerCase().includes('rek') || k.toLowerCase().includes('norek'));
      const rekVal = rekKey && obj[rekKey] ? String(obj[rekKey]).trim() : '-';

      // Status
      const statusKey = Object.keys(obj).find(k => k.toLowerCase().includes('status'));
      let statusAktif = true;
      if (statusKey && obj[statusKey] !== undefined) {
        const s = String(obj[statusKey]).toLowerCase();
        if (s.includes('non') || s.includes('pasif') || s.includes('false') || s.includes('tidak')) {
          statusAktif = false;
        }
      }

      // Tanggal Gabung
      const tglKey = Object.keys(obj).find(k => k.toLowerCase().includes('tanggal') || k.toLowerCase().includes('gabung') || k.toLowerCase().includes('tgl'));
      let tanggalGabung = new Date().toISOString().split('T')[0];
      if (tglKey && obj[tglKey]) {
        tanggalGabung = String(obj[tglKey]).trim();
      }

      return {
        idTemp: `row-${idx}-${Date.now()}`,
        nama: namaVal || `Anggota ${idx + 1}`,
        nik: nikVal,
        noHp: hpVal,
        blokLahan: blokVal,
        luasHa,
        jmlPokok,
        bank: bankVal,
        noRekening: rekVal,
        statusAktif,
        tanggalGabung,
        isValid: errors.length === 0,
        errors,
        selected: true,
      };
    });

    setParsedRows(rows);
  };

  // Parse text content (pasted or CSV)
  const parseRawContent = (content: string, sourceName?: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      setParsedRows([]);
      return;
    }

    if (sourceName) setFileName(sourceName);

    // CSV / TSV parsing
    const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    // Detect delimiter
    const firstLine = lines[0];
    let delimiter = ',';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;

    if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
    else if (semiCount > commaCount) delimiter = ';';

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let insideQuote = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === delimiter && !insideQuote) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headerCols = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    let colMap = {
      nama: -1,
      nik: -1,
      noHp: -1,
      blok: -1,
      luas: -1,
      pokok: -1,
      bank: -1,
      rekening: -1,
      status: -1,
      tanggal: -1,
    };

    headerCols.forEach((col, idx) => {
      if (col.includes('nama') || col.includes('anggota') || col.includes('petani')) colMap.nama = idx;
      else if (col.includes('nik') || col.includes('ktp')) colMap.nik = idx;
      else if (col.includes('hp') || col.includes('wa') || col.includes('telepon') || col.includes('kontak') || col.includes('phone')) colMap.noHp = idx;
      else if (col.includes('blok') || col.includes('lokasi') || col.includes('lahan')) colMap.blok = idx;
      else if (col.includes('luas') || col.includes('ha') || col.includes('hektar')) colMap.luas = idx;
      else if (col.includes('pokok') || col.includes('batang') || col.includes('populasi') || col.includes('tanaman')) colMap.pokok = idx;
      else if (col.includes('bank')) colMap.bank = idx;
      else if (col.includes('rekening') || col.includes('rek') || col.includes('norek')) colMap.rekening = idx;
      else if (col.includes('status')) colMap.status = idx;
      else if (col.includes('tanggal') || col.includes('gabung') || col.includes('tgl')) colMap.tanggal = idx;
    });

    const hasHeader = colMap.nama !== -1 || headerCols.some(c => ['nama', 'nik', 'blok', 'luas', 'pokok', 'bank'].some(k => c.includes(k)));
    const startIndex = hasHeader ? 1 : 0;

    if (colMap.nama === -1) colMap.nama = 0;
    if (colMap.nik === -1) colMap.nik = 1;
    if (colMap.noHp === -1) colMap.noHp = 2;
    if (colMap.blok === -1) colMap.blok = 3;
    if (colMap.luas === -1) colMap.luas = 4;
    if (colMap.pokok === -1) colMap.pokok = 5;
    if (colMap.bank === -1) colMap.bank = 6;
    if (colMap.rekening === -1) colMap.rekening = 7;
    if (colMap.status === -1) colMap.status = 8;
    if (colMap.tanggal === -1) colMap.tanggal = 9;

    const rows: ParsedRow[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length === 0 || cols.every(c => !c)) continue;

      const errors: string[] = [];
      const rawNama = cols[colMap.nama] || '';
      const nama = rawNama.trim();

      if (!nama) {
        errors.push('Nama petani kosong');
      }

      const rawNik = cols[colMap.nik] || `140101${Date.now().toString().slice(-10)}`;
      const rawHp = cols[colMap.noHp] || '081234567890';
      const rawBlok = cols[colMap.blok] || 'Blok A (Utara)';
      
      const rawLuasStr = (cols[colMap.luas] || '2.0').replace(',', '.').replace(/[^0-9.]/g, '');
      const parsedLuas = parseFloat(rawLuasStr);
      const luasHa = isNaN(parsedLuas) || parsedLuas <= 0 ? 2.0 : Number(parsedLuas.toFixed(2));

      const rawPokokStr = (cols[colMap.pokok] || '').replace(/[^0-9]/g, '');
      let jmlPokok = parseInt(rawPokokStr, 10);
      if (isNaN(jmlPokok) || jmlPokok <= 0) {
        jmlPokok = Math.round(luasHa * 136);
      }

      const rawBank = cols[colMap.bank] || 'BRI';
      const rawRek = cols[colMap.rekening] || '-';
      const rawStatus = (cols[colMap.status] || 'Aktif').toLowerCase();
      const statusAktif = !rawStatus.includes('non') && !rawStatus.includes('pasif') && !rawStatus.includes('false') && !rawStatus.includes('tidak');
      
      const rawTanggal = cols[colMap.tanggal] || new Date().toISOString().split('T')[0];

      rows.push({
        idTemp: `row-${i}-${Date.now()}`,
        nama: nama || `Anggota ${i}`,
        nik: rawNik.trim(),
        noHp: rawHp.trim(),
        blokLahan: rawBlok.trim(),
        luasHa,
        jmlPokok,
        bank: rawBank.trim(),
        noRekening: rawRek.trim(),
        statusAktif,
        tanggalGabung: rawTanggal.trim(),
        isValid: errors.length === 0,
        errors,
        selected: true,
      });
    }

    setParsedRows(rows);
  };

  // Handle file drop & upload (Excel or CSV)
  const handleProcessFile = async (file: File) => {
    setIsLoadingFile(true);
    setFileName(file.name);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls') {
        const rawObjects = await readUploadedSpreadsheet(file);
        processRawObjects(rawObjects, file.name);
      } else {
        const content = await file.text();
        parseRawContent(content, file.name);
      }
    } catch (err) {
      console.error('Error reading spreadsheet:', err);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleProcessFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const toggleSelectRow = (idTemp: string) => {
    setParsedRows(prev => prev.map(r => r.idTemp === idTemp ? { ...r, selected: !r.selected } : r));
  };

  const toggleSelectAll = () => {
    const allSelected = parsedRows.every(r => r.selected);
    setParsedRows(prev => prev.map(r => ({ ...r, selected: !allSelected })));
  };

  const removeRow = (idTemp: string) => {
    setParsedRows(prev => prev.filter(r => r.idTemp !== idTemp));
  };

  const selectedRows = parsedRows.filter(r => r.selected && r.isValid);
  const totalSelectedHa = selectedRows.reduce((s, r) => s + r.luasHa, 0);
  const totalSelectedPokok = selectedRows.reduce((s, r) => s + r.jmlPokok, 0);

  // Execute import
  const handleExecuteImport = () => {
    if (selectedRows.length === 0) return;

    const payload: Omit<Petani, 'id'>[] = selectedRows.map(r => ({
      nama: r.nama,
      nik: r.nik,
      noHp: r.noHp,
      blokLahan: r.blokLahan,
      luasHa: r.luasHa,
      jmlPokok: r.jmlPokok,
      bank: r.bank,
      noRekening: r.noRekening,
      statusAktif: r.statusAktif,
      tanggalGabung: r.tanggalGabung,
    }));

    const count = importPetaniList(payload, importMode);
    setSuccessCount(count);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setParsedRows([]);
      setPastedText('');
      setFileName(null);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Impor & Template Data Anggota Petani</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 font-semibold border border-green-500/20">
                  Excel (.xlsx) & CSV
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unduh template resmi Microsoft Excel yang rapi atau unggah data massal anggota ke sistem.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Step 1: Featured Excel Template Box */}
          <div className="bg-gradient-to-br from-green-50/80 via-slate-50 to-emerald-50/40 dark:from-green-950/20 dark:via-slate-900 dark:to-emerald-950/20 rounded-xl p-4 sm:p-5 border border-green-200/80 dark:border-green-800/50 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-green-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    Format Resmi
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span>Template Excel (.xlsx) Multi-Sheet Rapi & Siap Pakai</span>
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Buku kerja Excel terstruktur lengkap dengan <strong>Sheet 1: Template Data Petani</strong> (contoh data & lebar kolom teratur), <strong>Sheet 2: Petunjuk Pengisian</strong>, serta <strong>Sheet 3: Master Referensi Blok & Bank</strong>.
                </p>
              </div>

              {/* Action Buttons for Template */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-green-600/30 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Template Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-slate-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Unduh format ringan .CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Format .CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Salin baris template ke clipboard"
                >
                  {copiedTemplate ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTemplate ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>
              </div>
            </div>

            {/* Template Column Structure Preview */}
            <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Susunan Kolom Standar:
                </span>
                <span className="text-[10px] text-slate-400">
                  * = Kolom penting/wajib
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
                <div className="p-1.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-mono">Kolom A</span>
                  <strong className="text-green-600 dark:text-green-400">Nama Petani*</strong>
                </div>
                <div className="p-1.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-mono">Kolom B</span>
                  <strong className="text-slate-700 dark:text-slate-300">NIK (KTP)</strong>
                </div>
                <div className="p-1.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-mono">Kolom C</span>
                  <strong className="text-green-600 dark:text-green-400">No HP / WA*</strong>
                </div>
                <div className="p-1.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-mono">Kolom D</span>
                  <strong className="text-slate-700 dark:text-slate-300">Blok Lahan</strong>
                </div>
                <div className="p-1.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-mono">Kolom E</span>
                  <strong className="text-green-600 dark:text-green-400">Luas Ha*</strong>
                </div>
                <div className="p-1.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-mono">Kolom F</span>
                  <strong className="text-green-600 dark:text-green-400">Jumlah Pokok*</strong>
                </div>
                <div className="p-1.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-mono">Kolom G</span>
                  <strong className="text-slate-700 dark:text-slate-300">Bank Penyalur</strong>
                </div>
                <div className="p-1.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-mono">Kolom H</span>
                  <strong className="text-slate-700 dark:text-slate-300">No Rekening</strong>
                </div>
                <div className="p-1.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-mono">Kolom I</span>
                  <strong className="text-slate-700 dark:text-slate-300">Status Anggota</strong>
                </div>
                <div className="p-1.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-mono">Kolom J</span>
                  <strong className="text-slate-700 dark:text-slate-300">Tgl Bergabung</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Tab Switcher (Upload vs Paste) */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setInputTab('upload')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                inputTab === 'upload'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Berkas Excel / CSV (.xlsx, .xls, .csv)</span>
            </button>
            <button
              type="button"
              onClick={() => setInputTab('paste')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                inputTab === 'paste'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tempel Teks (Salin Langsung dari Tabel Spreadsheet)</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {inputTab === 'upload' ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-green-500 bg-green-500/5 dark:bg-green-500/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-green-500/60 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt,.tsv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-3 border border-green-500/20">
                {isLoadingFile ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {fileName ? `Berkas terpilih: ${fileName}` : 'Tarik & Letakkan berkas Excel (.xlsx) atau CSV di sini'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Mendukung langsung berkas Microsoft Excel (.xlsx / .xls), CSV, TSV, maupun JSON
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  parseRawContent(e.target.value);
                }}
                rows={5}
                placeholder={`Tempel baris tabel yang disalin dari Microsoft Excel atau Google Sheets di sini...\nContoh:\nNama Lengkap\tNIK\tNo HP\tBlok Lahan\tLuas Ha\tJumlah Pokok\tBank\tNo Rekening\nPak Syamsudin\t1401021508750001\t081268492011\tBlok A (Utara)\t2.5\t340\tBRI\t1234-01-004589-53-2`}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-green-500 outline-none resize-y"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Mendukung pemisah Tab (Excel) maupun Koma / Titik Koma (CSV).</span>
                {pastedText && (
                  <button
                    type="button"
                    onClick={() => {
                      setPastedText('');
                      setParsedRows([]);
                    }}
                    className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Bersihkan</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Parsed Preview & Validation Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Pratinjau Hasil Baca:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold">
                      {selectedRows.length} dari {parsedRows.length} Terpilih
                    </span>
                  </div>
                  <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>|</span>
                    <span>Total Luas: <strong>{totalSelectedHa.toFixed(1)} Ha</strong></span>
                    <span>|</span>
                    <span>Total Pokok: <strong>{totalSelectedPokok} Batang</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold text-green-600 dark:text-green-400 hover:underline cursor-pointer"
                  >
                    {parsedRows.every(r => r.selected) ? 'Batalkan Semua' : 'Pilih Semua'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setPastedText('');
                      setFileName(null);
                    }}
                    className="text-xs text-rose-500 hover:underline cursor-pointer ml-2"
                  >
                    Hapus Pratinjau
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/80 rounded-xl max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={parsedRows.length > 0 && parsedRows.every(r => r.selected)}
                          onChange={toggleSelectAll}
                          className="rounded text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300">Nama Petani</th>
                      <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300">Blok Lahan</th>
                      <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 text-right">Luas (Ha)</th>
                      <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 text-right">Pokok</th>
                      <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300">No. WhatsApp</th>
                      <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300">Bank & Rekening</th>
                      <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 text-center">Status</th>
                      <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 text-center w-10">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 font-normal">
                    {parsedRows.map((row) => (
                      <tr 
                        key={row.idTemp}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          !row.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            disabled={!row.isValid}
                            onChange={() => toggleSelectRow(row.idTemp)}
                            className="rounded text-green-600 focus:ring-green-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{row.nama}</span>
                            {!row.isValid && (
                              <span className="text-rose-500" title={row.errors.join(', ')}>
                                <AlertTriangle className="w-3.5 h-3.5 inline" />
                              </span>
                            )}
                          </div>
                          {row.nik && <span className="text-[10px] text-slate-400 font-mono block">NIK: {row.nik}</span>}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">
                          {row.blokLahan}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-green-600 dark:text-green-400">
                          {row.luasHa} Ha
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                          {row.jmlPokok} Btg
                        </td>
                        <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                          {row.noHp}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px]">
                          <strong>{row.bank}</strong> - <span className="font-mono">{row.noRekening}</span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.statusAktif 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {row.statusAktif ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(row.idTemp)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Step 4: Import Destination Mode Selection */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Mode Penggabungan Data:
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Pilih apakah data baru digabungkan atau menggantikan seluruh {petaniList.length} anggota saat ini.
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Tambahkan (Append)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      Ganti Semua (Replace)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {parsedRows.length > 0 ? (
              <span>Siap menyimpan <strong>{selectedRows.length}</strong> data anggota petani baru.</span>
            ) : (
              <span>Silakan unduh template Excel di atas atau pilih berkas untuk mulai impor.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={selectedRows.length === 0 || isSuccess}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{successCount} Petani Berhasil Diimpor!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terapkan Impor ({selectedRows.length} Petani)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
