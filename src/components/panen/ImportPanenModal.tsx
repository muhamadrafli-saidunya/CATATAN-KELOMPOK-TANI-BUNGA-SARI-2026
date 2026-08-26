import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
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
  Scale,
  RefreshCw,
  FileText,
  Truck,
  Sparkles
} from 'lucide-react';
import { formatRupiah, formatKg } from '../../lib/utils';
import { downloadPanenExcelTemplate, readUploadedSpreadsheet } from '../../lib/excelHelper';
import { PanenRecord } from '../../types';

interface ImportPanenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedPanenRow {
  idTemp: string;
  noSpb: string;
  tanggal: string;
  petaniNama: string;
  petaniId: string;
  blokLahan: string;
  timbanganRamKg: number;
  timbanganPksKg: number;
  hargaTbsPerKg: number;
  potonganPedaranKg: number;
  potonganIuranKasRupiah: number;
  upahPemanenRupiah: number;
  kasbonPupukRupiah: number;
  namaPks: string;
  platTruk: string;
  namaSopir: string;
  namaPemanen: string;
  statusPembayaran: 'Siap Bayar' | 'Lunas' | 'Draft';
  catatan: string;
  isValid: boolean;
  errors: string[];
  selected: boolean;
}

const TEMPLATE_PANEN_CSV = `\uFEFFNo SPB,Tanggal Panen,Nama Petani,Blok Lahan,Timbangan Kebun (Kg),Timbangan Pabrik (Kg),Harga TBS (Rp/Kg),Potongan Pedaran (Kg),Iuran Kas (Rp),Upah Panen (Rp),Kasbon Pupuk (Rp),PKS Tujuan,Plat Truk,Nama Sopir,Nama Pemanen,Status Bayar,Catatan
SPB-2026-001,2026-08-25,H. Syamsudin Siregar,Blok A (Utara),5420,5360,2780,0,0,0,0,PT. Sawit Sejahtera Tapung,BM 8412 TA,Pak Eko,Regu A (3 Orang),Siap Bayar,Buah matang grade A
SPB-2026-002,2026-08-25,M. Yusuf Hasibuan,Blok B (Timur),6180,6090,2780,0,0,0,0,PT. Sawit Sejahtera Tapung,BM 8412 TA,Pak Eko,Regu B,Siap Bayar,
SPB-2026-003,2026-08-25,Ahmad Ridwan Dalimunthe,Blok D (Barat),7850,7720,2780,0,0,0,0,PT. Agro Mandiri Sawit,BM 9120 ZB,Bang Anto,Regu C (4 Orang),Siap Bayar,TBS rotasi 12 hari
SPB-2026-004,2026-08-25,Siti Rohana Harahap,Blok C (Selatan),4200,4140,2780,0,0,0,0,PT. Sawit Sejahtera Tapung,BM 8412 TA,Pak Eko,Regu A,Siap Bayar,`;

export const ImportPanenModal: React.FC<ImportPanenModalProps> = ({ isOpen, onClose }) => {
  const { importPanenList, petaniList, armadaList, pengaturan } = useApp();

  const [inputTab, setInputTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedPanenRow[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download template handlers
  const handleDownloadExcel = () => {
    downloadPanenExcelTemplate(petaniList, armadaList, pengaturan);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([TEMPLATE_PANEN_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Input_Panen_Kelompok_Tani.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(TEMPLATE_PANEN_CSV);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Convert raw records into ParsedPanenRow[]
  const processRawObjects = (rawObjects: Record<string, unknown>[], sourceName?: string) => {
    if (sourceName) setFileName(sourceName);

    const rows: ParsedPanenRow[] = rawObjects.map((obj, index) => {
      const keys = Object.keys(obj);
      const getVal = (possibleKeys: string[]): string => {
        for (const pk of possibleKeys) {
          const foundKey = keys.find(k => k.trim().toLowerCase() === pk.toLowerCase());
          if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) {
            return String(obj[foundKey]).trim();
          }
        }
        return '';
      };

      const noSpb = getVal(['no spb', 'nospb', 'spb', 'nomor spb']);
      const rawTanggal = getVal(['tanggal panen', 'tanggal', 'tgl panen', 'tgl']);
      const rawNama = getVal(['nama petani', 'nama lengkap petani', 'nama', 'petani', 'nama lengkap']);
      const rawBlok = getVal(['blok lahan', 'blok', 'lokasi lahan', 'lokasi']);
      const rawTimbanganKebun = getVal(['timbangan kebun (kg)', 'timbangan kebun', 'timbangan ram (kg)', 'timbangan ram', 'kebun kg', 'ram kg', 'kg kebun', 'kg ram', 'berat kg', 'tonase']);
      const rawTimbanganPks = getVal(['timbangan pabrik (kg)', 'timbangan pabrik', 'timbangan pks (kg)', 'timbangan pks', 'pabrik kg', 'pks kg', 'kg pabrik', 'kg pks', 'netto pks']);
      const rawHargaTbs = getVal(['harga tbs (rp/kg)', 'harga tbs', 'harga per kg', 'harga tbs per kg', 'harga']);
      const rawPedaran = getVal(['potongan pedaran (kg)', 'potongan pedaran', 'pedaran kg', 'pedaran']);
      const rawIuranKas = getVal(['iuran kas (rp)', 'iuran kas', 'iuran kas kelompok', 'iuran']);
      const rawUpahPanen = getVal(['upah panen (rp)', 'upah panen', 'upah pemanen', 'ongkos panen']);
      const rawKasbon = getVal(['kasbon pupuk (rp)', 'kasbon pupuk', 'kasbon', 'pinjaman pupuk']);
      const rawPks = getVal(['pks tujuan', 'nama pks', 'pks', 'pabrik']);
      const rawPlat = getVal(['plat truk', 'plat nomor', 'plat', 'no polisi']);
      const rawSopir = getVal(['nama sopir', 'sopir', 'driver', 'pengemudi']);
      const rawPemanen = getVal(['nama pemanen', 'pemanen', 'regu pemanen', 'tukang panen']);
      const rawStatus = getVal(['status bayar', 'status pembayaran', 'status']);
      const catatan = getVal(['catatan', 'keterangan', 'notes']);

      const errors: string[] = [];

      // Validate nama petani
      const matchedPetani = petaniList.find(p => p.nama.toLowerCase() === rawNama.toLowerCase());
      const petaniNama = matchedPetani ? matchedPetani.nama : rawNama;
      const petaniId = matchedPetani ? matchedPetani.id : `petani-custom-${index}`;
      const blokLahan = rawBlok || (matchedPetani ? matchedPetani.blokLahan : 'Blok Kebun');

      if (!rawNama) {
        errors.push('Nama Petani wajib diisi');
      }

      // Validate tonase
      const cleanNum = (str: string) => {
        if (!str) return 0;
        const cleaned = str.replace(/[^0-9.-]/g, '');
        return Number(cleaned) || 0;
      };

      const timbanganRamKg = cleanNum(rawTimbanganKebun);
      let timbanganPksKg = cleanNum(rawTimbanganPks);
      if (timbanganPksKg === 0 && timbanganRamKg > 0) {
        timbanganPksKg = timbanganRamKg;
      }

      if (timbanganRamKg <= 0 && timbanganPksKg <= 0) {
        errors.push('Timbangan kebun / pabrik wajib diisi angka > 0');
      }

      const hargaTbsPerKg = cleanNum(rawHargaTbs) || (pengaturan.hargaTbsDefault || 2780);
      const potonganPedaranKg = cleanNum(rawPedaran);
      const potonganIuranKasRupiah = cleanNum(rawIuranKas);
      const upahPemanenRupiah = cleanNum(rawUpahPanen);
      const kasbonPupukRupiah = cleanNum(rawKasbon);

      let tanggal = rawTanggal;
      if (!tanggal || !tanggal.includes('-')) {
        tanggal = new Date().toISOString().split('T')[0];
      }

      let statusPembayaran: 'Siap Bayar' | 'Lunas' | 'Draft' = 'Siap Bayar';
      const statusLower = rawStatus.toLowerCase();
      if (statusLower.includes('lunas')) statusPembayaran = 'Lunas';
      else if (statusLower.includes('draft')) statusPembayaran = 'Draft';

      return {
        idTemp: `temp-panen-${index}-${Date.now()}`,
        noSpb: noSpb || '',
        tanggal,
        petaniNama: petaniNama || 'Tanpa Nama',
        petaniId,
        blokLahan,
        timbanganRamKg,
        timbanganPksKg,
        hargaTbsPerKg,
        potonganPedaranKg,
        potonganIuranKasRupiah,
        upahPemanenRupiah,
        kasbonPupukRupiah,
        namaPks: rawPks || pengaturan.namaPksDefault || 'PT. Sawit Sejahtera Tapung',
        platTruk: rawPlat || 'BM 8412 TA',
        namaSopir: rawSopir || 'Pak Eko',
        namaPemanen: rawPemanen || 'Regu Panen',
        statusPembayaran,
        catatan,
        isValid: errors.length === 0,
        errors,
        selected: errors.length === 0,
      };
    });

    setParsedRows(rows);
  };

  const handleFileUpload = async (file: File) => {
    setIsLoadingFile(true);
    try {
      const records = await readUploadedSpreadsheet(file);
      if (!records || records.length === 0) {
        alert('Berkas kosong atau format tabel tidak terdeteksi.');
        setIsLoadingFile(false);
        return;
      }
      processRawObjects(records, file.name);
    } catch (err) {
      console.error('Failed reading spreadsheet:', err);
      alert('Gagal membaca berkas. Pastikan format file adalah .xlsx atau .csv standar.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleParsePasted = () => {
    if (!pastedText.trim()) return;
    const lines = pastedText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return;

    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    const records: Record<string, unknown>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
      const obj: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        obj[h] = parts[idx] || '';
      });
      records.push(obj);
    }

    processRawObjects(records, 'Teks Salinan (Pasted)');
  };

  const handleToggleRow = (idTemp: string) => {
    setParsedRows(prev => prev.map(r => r.idTemp === idTemp ? { ...r, selected: !r.selected } : r));
  };

  const handleSelectAll = (select: boolean) => {
    setParsedRows(prev => prev.map(r => r.isValid ? { ...r, selected: select } : r));
  };

  const handleExecuteImport = () => {
    const selectedRows = parsedRows.filter(r => r.selected && r.isValid);
    if (selectedRows.length === 0) {
      alert('Pilih minimal satu baris data yang valid untuk diimpor.');
      return;
    }

    const payload = selectedRows.map(r => ({
      noSpb: r.noSpb || undefined,
      tanggal: r.tanggal,
      petaniId: r.petaniId,
      petaniNama: r.petaniNama,
      blokLahan: r.blokLahan,
      timbanganRamKg: r.timbanganRamKg,
      timbanganPksKg: r.timbanganPksKg,
      hargaTbsPerKg: r.hargaTbsPerKg,
      potonganPedaranKg: r.potonganPedaranKg,
      potonganIuranKasRupiah: r.potonganIuranKasRupiah,
      upahPemanenRupiah: r.upahPemanenRupiah,
      kasbonPupukRupiah: r.kasbonPupukRupiah,
      namaPks: r.namaPks,
      platTruk: r.platTruk,
      namaSopir: r.namaSopir,
      namaPemanen: r.namaPemanen,
      statusPembayaran: r.statusPembayaran,
      catatan: r.catatan,
    }));

    const count = importPanenList(payload, importMode);
    setSuccessCount(count);
    setIsSuccess(true);
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;
  const selectedCount = parsedRows.filter(r => r.selected && r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-all my-auto">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center border border-green-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Impor Data Panen & SPB Excel</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800">
                  .xlsx / .csv
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Unggah berkas spreadsheet timbangan kebun untuk memasukkan transaksi panen secara massal.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300">
          
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto border-2 border-green-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                Impor Panen Berhasil!
              </h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Sebanyak <strong className="text-green-600 dark:text-green-400">{successCount} catatan transaksi panen</strong> berhasil dimasukkan dan tersinkronisasi ke rekap petani & kas kelompok.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  Selesai & Lihat Data
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Template Download Bento Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Belum Memiliki Format Berkas?
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Gunakan Template Excel multi-sheet resmi dengan validasi kolom timbangan, harga TBS, master petani, dan armada.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Template .xlsx</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Upload or Paste Tab Switcher */}
              <div className="space-y-3">
                <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
                  <button
                    type="button"
                    onClick={() => setInputTab('upload')}
                    className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                      inputTab === 'upload'
                        ? 'border-green-600 text-green-600 dark:text-green-400'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Berkas Excel / CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputTab('paste')}
                    className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                      inputTab === 'paste'
                        ? 'border-green-600 text-green-600 dark:text-green-400'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin-Tempel Teks (Paste)</span>
                  </button>
                </div>

                {inputTab === 'upload' ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 sm:p-8 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
                      dragActive
                        ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 hover:border-green-500'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.txt"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                    />

                    {isLoadingFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                        <span className="text-xs font-semibold text-slate-400">Membaca berkas spreadsheet...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {fileName ? `Berkas terpilih: ${fileName}` : 'Tarik berkas ke sini, atau klik untuk memilih'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Mendukung Microsoft Excel (.xlsx / .xls) dan CSV
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Tempel data CSV atau tabel salinan dari Excel di sini..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={handleCopyTemplate}
                        className="text-[11px] font-semibold text-slate-500 hover:text-green-600 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedTemplate ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedTemplate ? 'Tersalin!' : 'Salin Contoh Format CSV'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleParsePasted}
                        disabled={!pastedText.trim()}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        Proses Teks
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Parsed Rows Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Pratinjau Data ({parsedRows.length} Baris Terdeteksi)
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 font-semibold">
                          {validCount} Valid
                        </span>
                        {invalidCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-semibold">
                            {invalidCount} Galat
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAll(true)}
                        className="text-[11px] font-semibold text-green-600 dark:text-green-400 hover:underline cursor-pointer"
                      >
                        Pilih Semua Valid
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(false)}
                        className="text-[11px] font-semibold text-slate-400 hover:underline cursor-pointer"
                      >
                        Batal Pilih
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2.5 w-8 text-center">✓</th>
                          <th className="p-2.5">No SPB</th>
                          <th className="p-2.5">Tanggal</th>
                          <th className="p-2.5">Nama Petani</th>
                          <th className="p-2.5">Blok Lahan</th>
                          <th className="p-2.5 text-right">Kebun (Kg)</th>
                          <th className="p-2.5 text-right">Pabrik (Kg)</th>
                          <th className="p-2.5 text-right">Harga (Rp)</th>
                          <th className="p-2.5">PKS / Truk</th>
                          <th className="p-2.5">Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                        {parsedRows.map((row) => (
                          <tr
                            key={row.idTemp}
                            className={`transition-colors ${
                              !row.isValid 
                                ? 'bg-rose-50/40 dark:bg-rose-950/20' 
                                : row.selected 
                                ? 'bg-green-50/30 dark:bg-green-950/20' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                disabled={!row.isValid}
                                onChange={() => handleToggleRow(row.idTemp)}
                                className="rounded text-green-600 focus:ring-green-500"
                              />
                            </td>
                            <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                              {row.noSpb || <span className="text-slate-400 italic">Otomatis</span>}
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400">{row.tanggal}</td>
                            <td className="p-2.5 font-sans font-bold text-slate-900 dark:text-white">
                              {row.petaniNama}
                            </td>
                            <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400">{row.blokLahan}</td>
                            <td className="p-2.5 text-right font-bold text-slate-800 dark:text-slate-200">
                              {formatKg(row.timbanganRamKg)}
                            </td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                              {formatKg(row.timbanganPksKg)}
                            </td>
                            <td className="p-2.5 text-right text-slate-800 dark:text-slate-200">
                              {formatRupiah(row.hargaTbsPerKg)}
                            </td>
                            <td className="p-2.5 font-sans text-[10px] text-slate-500">
                              {row.namaPks} • {row.platTruk}
                            </td>
                            <td className="p-2.5">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-green-600 font-sans font-semibold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600 font-sans font-semibold text-[10px]" title={row.errors.join(', ')}>
                                  <AlertTriangle className="w-3 h-3" /> {row.errors[0]}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mode Impor Radio */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Metode Penggabungan Data:
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importModePanen"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span>Tambahkan ke Data Ada (Append)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importModePanen"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-amber-600 dark:text-amber-400">Ganti Semua (Replace)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer */}
        {!isSuccess && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleExecuteImport}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Impor {selectedCount} Transaksi Terpilih</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
