import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  Upload,
  Check, 
  ShieldCheck, 
  Building, 
  AlertTriangle,
  Database,
  FileJson,
  CheckCircle2,
  HardDrive,
  Users,
  Truck,
  Layers,
  Coins,
  CreditCard,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { DatabaseBackupData } from '../../types';
import { formatRupiah, formatNumber } from '../../lib/utils';

export const PengaturanView: React.FC = () => {
  const { 
    pengaturan, 
    updatePengaturan, 
    resetToDefault, 
    restoreDatabase,
    panenList, 
    petaniList, 
    armadaList,
    kasList, 
    pinjamanList 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'tarif' | 'database'>('tarif');
  const [formData, setFormData] = useState(pengaturan);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Restore State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [parsedBackup, setParsedBackup] = useState<DatabaseBackupData | null>(null);
  const [backupFileName, setBackupFileName] = useState<string>('');
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [restoreConfirmModal, setRestoreConfirmModal] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{
    type: 'success' | 'error';
    message: string;
    counts?: { petani: number; armada: number; panen: number; kas: number; pinjaman: number };
  } | null>(null);

  const handleChange = (field: keyof typeof pengaturan, value: any) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      if (field === 'alamatLengkap') {
        updated.alamat = value;
      } else if (field === 'alamat') {
        updated.alamatLengkap = value;
      } else if (field === 'legalitasNo') {
        updated.badanHukum = value;
      } else if (field === 'badanHukum') {
        updated.legalitasNo = value;
      } else if (field === 'namaKetua') {
        updated.ketua = value;
      } else if (field === 'ketua') {
        updated.namaKetua = value;
      } else if (field === 'namaBendahara') {
        updated.bendahara = value;
      } else if (field === 'bendahara') {
        updated.namaBendahara = value;
      } else if (field === 'kontakPengurus') {
        updated.noKontak = value;
      } else if (field === 'noKontak') {
        updated.kontakPengurus = value;
      }
      return updated;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePengaturan(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportBackup = () => {
    const backupData: DatabaseBackupData = {
      app: 'Laporan Kelompok Tani Bunga Sari',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      pengaturan: formData,
      petaniList,
      armadaList,
      panenList,
      kasList,
      pinjamanList
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Backup_KelompokTani_BungaSari_${new Date().toISOString().split('T')[0]}_${new Date().getTime().toString().slice(-4)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupFileName(file.name);
    setRestoreStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as DatabaseBackupData;
        
        // Basic validation
        if (
          !parsed.petaniList && 
          !parsed.panenList && 
          !parsed.kasList && 
          !parsed.pengaturan &&
          !parsed.armadaList
        ) {
          throw new Error('Format berkas tidak sesuai. Berkas JSON tidak berisi struktur database Kelompok Tani yang valid.');
        }

        setParsedBackup(parsed);
      } catch (err: any) {
        setParsedBackup(null);
        setRestoreStatus({
          type: 'error',
          message: err.message || 'Gagal membaca berkas JSON cadangan.'
        });
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!parsedBackup) return;
    const result = restoreDatabase(parsedBackup, restoreMode);
    setRestoreConfirmModal(false);
    if (result.success) {
      if (parsedBackup.pengaturan) {
        setFormData(prev => ({ ...prev, ...parsedBackup.pengaturan }));
      }
      setRestoreStatus({
        type: 'success',
        message: 'Database berhasil dipulihkan ke sistem secara instan.',
        counts: result.counts
      });
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setParsedBackup(null);
    } else {
      setRestoreStatus({
        type: 'error',
        message: result.message
      });
    }
  };

  // Storage usage estimation
  const totalDatabaseRecords = petaniList.length + armadaList.length + panenList.length + kasList.length + pinjamanList.length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-600 dark:text-green-500" />
            <span>Pengaturan & Pemulihan Database</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi identitas legalitas, parameter tarif panen, serta pusat pencadangan dan pemulihan database sistem.
          </p>
        </div>

        {saveSuccess && (
          <div className="px-3.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold flex items-center gap-1.5 border border-green-500/20">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>Pengaturan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('tarif')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeSubTab === 'tarif'
              ? 'border-green-600 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Parameter & Tarif Kelompok</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('database')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeSubTab === 'database'
              ? 'border-green-600 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Pemulihan & Cadangan Database</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500 text-white rounded-full font-mono">
            {totalDatabaseRecords} Data
          </span>
        </button>
      </div>

      {/* TAB 1: PARAMETER & TARIF KELOMPOK */}
      {activeSubTab === 'tarif' && (
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Identitas Kelompok Tani */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Building className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Identitas & Legalitas Kelompok Tani</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kelompok Tani *
                </label>
                <input
                  type="text"
                  value={formData.namaKelompok}
                  onChange={(e) => handleChange('namaKelompok', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Legalitas / SK Kemenkumham
                </label>
                <input
                  type="text"
                  value={formData.legalitasNo}
                  onChange={(e) => handleChange('legalitasNo', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-mono outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap Kelompok Tani (Ditampilkan pada Lembar Cetak Petani) *
                </label>
                <textarea
                  rows={2}
                  value={formData.alamatLengkap || formData.alamat || ''}
                  onChange={(e) => handleChange('alamatLengkap', e.target.value)}
                  placeholder="Contoh: Jl. Poros Kebun Sawit Utama Jalur 4, Desa Suka Makmur, Kec. Tapung Hilir, Kab. Kampar, Prov. Riau (Kode Pos: 28464)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Alamat lengkap ini akan otomatis tercetak pada kop surat resmi kwitansi, slip pembayaran TBS petani, dan dokumen laporan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Ketua Kelompok *
                </label>
                <input
                  type="text"
                  value={formData.namaKetua}
                  onChange={(e) => handleChange('namaKetua', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Bendahara *
                </label>
                <input
                  type="text"
                  value={formData.namaBendahara}
                  onChange={(e) => handleChange('namaBendahara', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kontak WhatsApp Pengurus
                </label>
                <input
                  type="text"
                  value={formData.kontakPengurus}
                  onChange={(e) => handleChange('kontakPengurus', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PKS Mitra Default
                </label>
                <input
                  type="text"
                  value={formData.namaPksDefault}
                  onChange={(e) => handleChange('namaPksDefault', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Parameter Dasar Transaksi Panen */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Parameter Default Input Panen & Tarif</h3>
              </div>
              <span className="text-[11px] text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/50 px-2 py-0.5 rounded">
                Bisa Diubah di Dasbor
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Harga TBS Default (Rp / Kg) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={formData.hargaTbsDefault}
                    onChange={(e) => handleChange('hargaTbsDefault', Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Hari Manen Default *
                </label>
                <input
                  type="date"
                  value={formData.tanggalPanenDefault || '2026-08-25'}
                  onChange={(e) => handleChange('tanggalPanenDefault', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white font-mono outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tarif Iuran Kas (Rp / Kg)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={formData.tarifIuranKasPerKg}
                    onChange={(e) => handleChange('tarifIuranKasPerKg', Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tarif Upah Panen (Rp / Kg)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={formData.tarifUpahPanenPerKg}
                    onChange={(e) => handleChange('tarifUpahPanenPerKg', Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Save Button */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Pengaturan</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: PEMULIHAN & PENCADANGAN DATABASE */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">

          {/* Banner Status Pemulihan */}
          {restoreStatus && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              restoreStatus.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-800 dark:text-rose-300'
            }`}>
              {restoreStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm">{restoreStatus.message}</p>
                {restoreStatus.counts && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-emerald-500/20">
                    <span className="bg-emerald-500/10 px-2 py-1 rounded font-mono font-semibold">
                      👤 {restoreStatus.counts.petani} Petani
                    </span>
                    <span className="bg-emerald-500/10 px-2 py-1 rounded font-mono font-semibold">
                      🚛 {restoreStatus.counts.armada} Armada
                    </span>
                    <span className="bg-emerald-500/10 px-2 py-1 rounded font-mono font-semibold">
                      🌾 {restoreStatus.counts.panen} Panen
                    </span>
                    <span className="bg-emerald-500/10 px-2 py-1 rounded font-mono font-semibold">
                      💰 {restoreStatus.counts.kas} Kas
                    </span>
                    <span className="bg-emerald-500/10 px-2 py-1 rounded font-mono font-semibold">
                      💳 {restoreStatus.counts.pinjaman} Pinjaman
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setRestoreStatus(null)}
                className="text-xs opacity-60 hover:opacity-100 font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Database Health & Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Anggota Petani</span>
                <Users className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {petaniList.length}
              </p>
              <span className="text-[10px] text-slate-400">Tercatat aktif</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Armada Truk</span>
                <Truck className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {armadaList.length}
              </p>
              <span className="text-[10px] text-slate-400">Unit pengangkutan</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Transaksi Panen</span>
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {panenList.length}
              </p>
              <span className="text-[10px] text-slate-400">SPB terdata</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Mutasi Kas</span>
                <Coins className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {kasList.length}
              </p>
              <span className="text-[10px] text-slate-400">Buku kas tercatat</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pinjaman Kasbon</span>
                <CreditCard className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {pinjamanList.length}
              </p>
              <span className="text-[10px] text-slate-400">Rekord pinjaman</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Database</span>
                <HardDrive className="w-3.5 h-3.5 text-green-500" />
              </div>
              <p className="text-xl font-bold font-mono text-green-600 dark:text-green-400 mt-1">
                {totalDatabaseRecords}
              </p>
              <span className="text-[10px] text-slate-400">Total data aktif</span>
            </div>
          </div>

          {/* Panel Utama Pemulihan Database (Restore) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pemulihan Database dari Berkas Cadangan</h3>
                  <p className="text-[11px] text-slate-400">Unggah berkas cadangan JSON (*.json) untuk mengembalikan atau memindahkan data ke sistem ini.</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Ekstensi .JSON Didukung
              </span>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/30">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
                id="restore-file-input"
              />
              <label htmlFor="restore-file-input" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center shadow-xs">
                  <FileJson className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Klik untuk Memilih Berkas Cadangan Database (.JSON)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mendukung berkas backup yang sebelumnya diekspor dari aplikasi Laporan Sawit Bunga Sari
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold shadow-2xs hover:bg-slate-50">
                  Pilih Berkas JSON
                </span>
              </label>
            </div>

            {/* Pratinjau Berkas Cadangan yang Dipilih */}
            {parsedBackup && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-green-500/30 space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
                        {backupFileName}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Dibuat: {parsedBackup.exportedAt ? new Date(parsedBackup.exportedAt).toLocaleString('id-ID') : 'Tidak tertera'} • {parsedBackup.app || 'Backup Kelompok Tani'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 self-start sm:self-auto">
                    Berkas Valid & Siap Dipulihkan
                  </span>
                </div>

                {/* Breakdown Isi Cadangan */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Petani</span>
                    <p className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                      {parsedBackup.petaniList?.length || 0} Anggota
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Armada Truk</span>
                    <p className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                      {parsedBackup.armadaList?.length || 0} Unit
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Catatan Panen</span>
                    <p className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                      {parsedBackup.panenList?.length || 0} SPB
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Buku Kas</span>
                    <p className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                      {parsedBackup.kasList?.length || 0} Mutasi
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pinjaman</span>
                    <p className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                      {parsedBackup.pinjamanList?.length || 0} Kasbon
                    </p>
                  </div>
                </div>

                {/* Mode Pemulihan Selector */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Pilih Metode Pemulihan:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label 
                      onClick={() => setRestoreMode('replace')}
                      className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-all ${
                        restoreMode === 'replace' 
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30' 
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="restoreMode" 
                        checked={restoreMode === 'replace'} 
                        onChange={() => setRestoreMode('replace')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          1. Timpa Total (Replace Database)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Menghapus data saat ini dan menggantinya persis dengan data dari berkas cadangan.
                        </span>
                      </div>
                    </label>

                    <label 
                      onClick={() => setRestoreMode('merge')}
                      className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-all ${
                        restoreMode === 'merge' 
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30' 
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="restoreMode" 
                        checked={restoreMode === 'merge'} 
                        onChange={() => setRestoreMode('merge')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          2. Gabungkan Data (Merge & Append)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Menambahkan data baru dari berkas cadangan tanpa menghapus data lokal yang telah ada.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Tombol Eksekusi Pemulihan */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedBackup(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreConfirmModal(true)}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Jalankan Pemulihan Database</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel Pencadangan Data (Export Backup) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pencadangan Database Sistem (Export JSON)</h3>
                <p className="text-[11px] text-slate-400">Unduh salinan lengkap database dalam format JSON untuk arsip aman atau migrasi perangkat.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p>• Berkas mencakup: <strong>{petaniList.length} Petani</strong>, <strong>{armadaList.length} Armada</strong>, <strong>{panenList.length} Transaksi Panen</strong>, <strong>{kasList.length} Buku Kas</strong>, dan <strong>{pinjamanList.length} Pinjaman</strong>.</p>
                <p>• Data dienkapsulasi dengan aman dan dapat langsung dipulihkan kembali kapan saja.</p>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan Database (.JSON)</span>
              </button>
            </div>
          </div>

          {/* Panel Reset ke Standar Data Awal */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pemulihan ke Data Master Bawaan (Reset)</h3>
                <p className="text-[11px] text-slate-400">Kembalikan seluruh database ke set data awal standar Kelompok Tani Bunga Sari.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                Opsi ini berguna jika Anda ingin mengatur ulang database aplikasi ke kondisi awal pabrikasi dengan data simulasi 20 petani dan transaksi panen Agustus 2026.
              </p>

              <button
                type="button"
                onClick={() => setResetConfirm(true)}
                className="px-4 py-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-rose-500/20 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset ke Data Awal Bunga Sari</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Modal Konfirmasi Eksekusi Pemulihan Database */}
      {restoreConfirmModal && parsedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Pemulihan Database
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {restoreMode === 'replace' ? (
                  <>Anda akan <strong>menimpa seluruh database aktif</strong> dengan isi berkas <strong>{backupFileName}</strong>. Data lama akan digantikan sepenuhnya.</>
                ) : (
                  <>Anda akan <strong>menggabungkan data baru</strong> dari berkas <strong>{backupFileName}</strong> ke dalam database sistem.</>
                )}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-lg text-xs space-y-1 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Mode Pemulihan:</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase">{restoreMode === 'replace' ? 'Timpa Bersih' : 'Gabungkan'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Transaksi Panen:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{parsedBackup.panenList?.length || 0} SPB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Anggota Petani:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{parsedBackup.petaniList?.length || 0} Anggota</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"
              >
                Ya, Pulihkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset Semua Data ke Standar?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Semua data panen, armada, buku kas, dan pinjaman akan dikembalikan ke data awal Bunga Sari.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDefault();
                  setResetConfirm(false);
                }}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                Ya, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
