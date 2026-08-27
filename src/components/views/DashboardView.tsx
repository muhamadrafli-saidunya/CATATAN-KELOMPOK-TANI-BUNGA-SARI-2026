import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KPICard } from '../common/KPICard';
import { Badge } from '../common/Badge';
import { ArmadaView } from './ArmadaView';
import { 
  TrendingUp, 
  Scale, 
  Truck,
  GitCompare, 
  Wallet, 
  Users, 
  ArrowUpRight, 
  CheckCircle2, 
  Printer, 
  PlusCircle, 
  FileSpreadsheet, 
  Calendar,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  TreePine,
  Building2,
  Layers,
  LayoutDashboard,
  Save,
  DollarSign,
  Tag,
  SlidersHorizontal,
  Edit3
} from 'lucide-react';
import { 
  formatRupiah, 
  formatKg, 
  formatTon, 
  formatTanggalPendek, 
  formatNumber 
} from '../../lib/utils';

interface DashboardViewProps {
  onOpenAddPanen: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenAddPanen }) => {
  const { 
    panenList, 
    petaniList, 
    kasList, 
    pengaturan, 
    updatePengaturan,
    setActiveTab, 
    setSelectedPanenForSlip, 
    userRole,
    activePetaniId 
  } = useApp();

  const [dashboardSubTab, setDashboardSubTab] = useState<'ringkasan' | 'armada'>('ringkasan');

  // Local state for Quick Edit Harga TBS & Tanggal Hari Panen (Dasar Input Panen Baru)
  const [inputHargaTbs, setInputHargaTbs] = useState<number>(pengaturan.hargaTbsDefault || 2780);
  const [inputTanggalPanen, setInputTanggalPanen] = useState<string>(
    pengaturan.tanggalPanenDefault || new Date().toISOString().split('T')[0]
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync state with context if updated elsewhere
  React.useEffect(() => {
    setInputHargaTbs(pengaturan.hargaTbsDefault || 2780);
  }, [pengaturan.hargaTbsDefault]);

  React.useEffect(() => {
    if (pengaturan.tanggalPanenDefault) {
      setInputTanggalPanen(pengaturan.tanggalPanenDefault);
    }
  }, [pengaturan.tanggalPanenDefault]);

  // Handler to save active price & harvest date as default for new harvest entries
  const handleSaveAcuan = (customHarga?: number, customTanggal?: string) => {
    const finalHarga = customHarga !== undefined ? customHarga : Number(inputHargaTbs);
    const finalTanggal = customTanggal !== undefined ? customTanggal : inputTanggalPanen;

    if (finalHarga <= 0) {
      return;
    }

    updatePengaturan({
      hargaTbsDefault: finalHarga,
      tanggalPanenDefault: finalTanggal,
    });

    setSaveSuccessMsg(
      `Dasar input panen berhasil disimpan: ${formatRupiah(finalHarga)}/kg • Tanggal ${formatTanggalPendek(finalTanggal)}`
    );

    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4500);
  };

  const handleApplyPresetDelta = (delta: number) => {
    const newPrice = Math.max(100, (inputHargaTbs || 2780) + delta);
    setInputHargaTbs(newPrice);
    handleSaveAcuan(newPrice, inputTanggalPanen);
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setInputTanggalPanen(today);
    handleSaveAcuan(inputHargaTbs, today);
  };

  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];
    setInputTanggalPanen(yesterday);
    handleSaveAcuan(inputHargaTbs, yesterday);
  };

  const handleStartPanenWithAcuan = () => {
    updatePengaturan({
      hargaTbsDefault: Number(inputHargaTbs) || 2780,
      tanggalPanenDefault: inputTanggalPanen,
    });
    onOpenAddPanen();
  };

  // Filter if user role is petani
  const displayedPanen = userRole === 'petani' && activePetaniId
    ? panenList.filter(p => p.petaniId === activePetaniId)
    : panenList;

  // Key KPI Calculations
  const totalTonasePks = displayedPanen.reduce((sum, item) => sum + item.timbanganPksKg, 0);
  const totalTonaseRam = displayedPanen.reduce((sum, item) => sum + item.timbanganRamKg, 0);
  const totalSelisihKg = displayedPanen.reduce((sum, item) => sum + item.selisihKg, 0);
  const avgSusutPersen = totalTonaseRam > 0 ? ((totalSelisihKg / totalTonaseRam) * 100).toFixed(2) : '0';

  const hargaTbsPeriode = pengaturan.hargaTbsDefault || 2780;

  const totalOmzetBruto = displayedPanen.reduce((sum, item) => sum + item.totalBruto, 0);
  const totalNettoPetani = displayedPanen.reduce((sum, item) => sum + item.totalNetto, 0);
  const totalPotongan = displayedPanen.reduce((sum, item) => sum + item.totalPotongan, 0);
  const totalIuranKas = displayedPanen.reduce((sum, item) => sum + item.potonganIuranKasRupiah, 0);

  const saldoKasKelompok = kasList.length > 0 ? kasList[kasList.length - 1].saldoSetelah : 0;
  const pendingPaymentCount = displayedPanen.filter(p => p.statusPembayaran !== 'Lunas').length;

  // Top 5 farmers by tonnage
  const petaniTonnageMap: { [petaniId: string]: { nama: string; totalKg: number; totalNetto: number; blok: string } } = {};
  panenList.forEach(p => {
    if (!petaniTonnageMap[p.petaniId]) {
      petaniTonnageMap[p.petaniId] = {
        nama: p.petaniNama,
        totalKg: 0,
        totalNetto: 0,
        blok: p.blokLahan,
      };
    }
    petaniTonnageMap[p.petaniId].totalKg += p.timbanganPksKg;
    petaniTonnageMap[p.petaniId].totalNetto += p.totalNetto;
  });

  const topPetani = Object.values(petaniTonnageMap)
    .sort((a, b) => b.totalKg - a.totalKg)
    .slice(0, 5);

  const maxPetaniKg = topPetani.length > 0 ? topPetani[0].totalKg : 1;

  // Chart data: 8 latest harvest transactions
  const recentHarvests = [...displayedPanen].slice(0, 8);
  const maxBarKg = Math.max(...recentHarvests.map(h => Math.max(h.timbanganRamKg, h.timbanganPksKg)), 8000);

  // Group trucks for quick overview
  const armadaSummary = useMemo(() => {
    const map: { [key: string]: { plat: string; sopir: string; pks: string; tgl: string; totalMuat: number; totalPks: number; count: number } } = {};
    displayedPanen.forEach(p => {
      const key = `${p.platTruk || 'BM 8412 TA'}_${p.tanggal}`;
      if (!map[key]) {
        map[key] = {
          plat: p.platTruk || 'BM 8412 TA',
          sopir: p.namaSopir || 'Sopir Truk',
          pks: p.namaPks || 'PKS Pabrik',
          tgl: p.tanggal,
          totalMuat: 0,
          totalPks: 0,
          count: 0
        };
      }
      map[key].totalMuat += (p.timbanganRamKg > 0 ? p.timbanganRamKg : p.timbanganPksKg);
      map[key].totalPks += (p.timbanganPksKg > 0 ? p.timbanganPksKg : p.timbanganRamKg);
      map[key].count += 1;
    });
    return Object.values(map);
  }, [displayedPanen]);

  const totalArmadaRitCount = armadaSummary.length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Sub-Menu Switcher: Ringkasan vs Menu Armada */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setDashboardSubTab('ringkasan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              dashboardSubTab === 'ringkasan'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>Ringkasan Panen & Keuangan</span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardSubTab('armada')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              dashboardSubTab === 'armada'
                ? 'bg-green-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Menu Armada & Muatan Petani</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              dashboardSubTab === 'armada'
                ? 'bg-white/20 text-white'
                : 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
            }`}>
              {totalArmadaRitCount} Rit
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenAddPanen}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950/70 border border-green-200 dark:border-green-800/60 transition-colors cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span>Input SPB / Muatan Baru</span>
        </button>
      </div>

      {/* When Menu Armada is selected */}
      {dashboardSubTab === 'armada' ? (
        <ArmadaView onOpenAddPanen={onOpenAddPanen} isEmbeddedInDashboard />
      ) : (
        <>
          {/* Panel Parameter Acuan Panen Hari Ini (Dasar Input Panen Baru) */}
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-white rounded-2xl p-5 sm:p-6 border border-emerald-800/80 shadow-md relative overflow-hidden">
            {/* Ambient Lighting FX */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-1/4 bottom-0 w-64 h-64 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Header Title & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-emerald-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                        Parameter Acuan Panen TBS Hari Ini
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Dasar Input SPB Baru
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200/80 mt-0.5">
                      Ubah harga TBS dan tanggal hari manen untuk otomatis dijadikan nilai dasar pada setiap formulir input panen baru.
                    </p>
                  </div>
                </div>

                {/* Status Pill */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="text-[11px] text-emerald-300/80 font-medium hidden md:inline">Acuan Aktif:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-900/90 border border-emerald-700/80 text-emerald-200 text-xs font-mono font-bold">
                    {formatRupiah(pengaturan.hargaTbsDefault)}/kg
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-900/90 border border-emerald-700/80 text-emerald-200 text-xs font-mono font-bold">
                    {formatTanggalPendek(pengaturan.tanggalPanenDefault || new Date().toISOString().split('T')[0])}
                  </span>
                </div>
              </div>

              {/* Success Notification Alert */}
              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center gap-2.5 text-xs text-emerald-100 font-semibold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Admin Interactive Form */}
              {userRole === 'admin' ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-1">
                  
                  {/* 1. Field Harga TBS Acuan (5 Cols) */}
                  <div className="md:col-span-5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Harga TBS Acuan (Rp / Kg) *</span>
                      </label>
                      <span className="text-[11px] font-mono text-emerald-300 font-bold">
                        {formatRupiah(inputHargaTbs)}/kg
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 font-mono">
                        Rp
                      </span>
                      <input
                        type="number"
                        value={inputHargaTbs || ''}
                        onChange={(e) => setInputHargaTbs(Number(e.target.value))}
                        placeholder="Contoh: 2780"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-emerald-700/70 rounded-xl text-sm font-bold text-white font-mono placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none"
                      />
                    </div>

                    {/* Quick adjustment buttons */}
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                      <span className="text-[10px] text-emerald-300/70 shrink-0">Ubah cepat:</span>
                      {[-50, -20, +20, +50, +100].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          onClick={() => handleApplyPresetDelta(delta)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-900/60 hover:bg-emerald-800 active:bg-emerald-700 text-emerald-200 border border-emerald-700/50 transition-colors cursor-pointer shrink-0"
                          title={`Ubah harga ${delta > 0 ? `+${delta}` : delta} rupiah per kg`}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Field Tanggal Hari Panen (4 Cols) */}
                  <div className="md:col-span-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tanggal Hari Manen *</span>
                      </label>
                      <span className="text-[11px] font-mono text-emerald-300">
                        {formatTanggalPendek(inputTanggalPanen)}
                      </span>
                    </div>

                    <input
                      type="date"
                      value={inputTanggalPanen}
                      onChange={(e) => setInputTanggalPanen(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-emerald-700/70 rounded-xl text-sm font-bold text-white font-mono focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none"
                    />

                    {/* Quick date presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-emerald-300/70">Pintasan:</span>
                      <button
                        type="button"
                        onClick={handleSetToday}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/60 hover:bg-emerald-800 active:bg-emerald-700 text-emerald-200 border border-emerald-700/50 transition-colors cursor-pointer"
                      >
                        Hari Ini
                      </button>
                      <button
                        type="button"
                        onClick={handleSetYesterday}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/60 hover:bg-emerald-800 active:bg-emerald-700 text-emerald-200 border border-emerald-700/50 transition-colors cursor-pointer"
                      >
                        Kemarin
                      </button>
                    </div>
                  </div>

                  {/* 3. Action Buttons (3 Cols) */}
                  <div className="md:col-span-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveAcuan()}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 transition-all shadow-md cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Dasar Acuan</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartPanenWithAcuan}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      <span>Input Panen dengan Acuan Ini</span>
                    </button>
                  </div>

                </div>
              ) : (
                <div className="p-3.5 bg-emerald-950/60 rounded-xl border border-emerald-800/60 flex items-center justify-between text-xs text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <span>
                      Harga TBS acuan resmi hari ini: <strong className="text-white font-mono">{formatRupiah(pengaturan.hargaTbsDefault)}/kg</strong> (Tanggal Manen: <strong className="text-white font-mono">{formatTanggalPendek(pengaturan.tanggalPanenDefault || new Date().toISOString().split('T')[0])}</strong>)
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-900/80 px-2.5 py-1 rounded-md border border-emerald-700/60">
                    Ditetapkan Pengurus
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Top 4 Bento KPI Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Metric 1: Tonase Bersih TBS */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tonase TBS</span>
                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatTon(totalTonasePks || totalTonaseRam)}</div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Kebun: {formatKg(totalTonaseRam)} • PKS: {formatKg(totalTonasePks)}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Total Rit Transaksi:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{displayedPanen.length} SPB</span>
              </div>
            </div>

            {/* Metric 2: Total Bruto Nilai Panen TBS */}
            <div className="bg-slate-950 text-white rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 -mt-2 -mr-2 w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Total Bruto Panen
                  </span>
                  <span className="text-[10px] text-slate-400">Sebelum Seluruh Potongan</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 relative z-10">
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  {formatRupiah(totalOmzetBruto)}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  <span>
                    Rata-rata Harga: <strong className="text-white font-mono">{formatRupiah(hargaTbsPeriode)}/kg</strong>
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 relative z-10">
                <span>Total Potongan: <strong className="text-rose-400 font-mono">-{formatRupiah(totalPotongan)}</strong></span>
              </div>
            </div>

            {/* Metric 3: Netto Diterima Petani */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Netto Petani</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                  {formatRupiah(totalNettoPetani)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">
                    {pendingPaymentCount > 0 ? `${pendingPaymentCount} SPB Menunggu Transfer` : 'Semua SPB Lunas'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Rata-rata/Rit:</span>
                <strong className="text-slate-900 dark:text-white font-mono">
                  {displayedPanen.length > 0 ? formatRupiah(Math.round(totalNettoPetani / displayedPanen.length)) : '0'}
                </strong>
              </div>
            </div>

            {/* Metric 4: Saldo Kas & Iuran */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Kas & Iuran</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatRupiah(saldoKasKelompok)}</div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>Iuran Panen: <strong className="text-slate-800 dark:text-slate-200 font-mono">+{formatRupiah(totalIuranKas)}</strong></span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Iuran Kas Terkumpul:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">+{formatRupiah(totalIuranKas)}</strong>
              </div>
            </div>

          </div>

          {/* Quick Bento Card: Ringkasan Armada & Logistik PKS */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Monitoring Armada & Logistik Pengangkutan
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                    {totalArmadaRitCount} Rit Pengantaran
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rincian armada truk, muatan dari setiap petani, total timbangan kebun, dan hasil timbangan pabrik/PKS.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDashboardSubTab('armada')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <span>Buka Menu Armada</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Middle Bento Row: Interactive Charts & Top Farmers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bento Card: Distribusi Tonase TBS Terkini (Span 2) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Scale className="w-4 h-4 text-green-600 dark:text-green-500" />
                      <span>Grafik Tonase Panen TBS Terkini</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visualisasi 8 transaksi pengiriman SPB panen sawit anggota.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-green-600 dark:bg-green-500" />
                      <span className="text-slate-900 dark:text-white font-semibold">Tonase Bersih (Kg)</span>
                    </div>
                  </div>
                </div>

                {/* Custom Bar Chart */}
                <div className="space-y-4 pt-2">
                  {recentHarvests.map((item) => {
                    const bobot = item.timbanganPksKg || item.timbanganRamKg;
                    const percent = (bobot / maxBarKg) * 100;

                    return (
                      <div key={item.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {item.noSpb.split('/').slice(-2).join('/')}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px] sm:max-w-[220px]">
                              {item.petaniNama}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-right">
                            <span className="font-mono font-bold text-green-600 dark:text-green-400">
                              {formatKg(bobot)}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {formatRupiah(item.totalNetto)}
                            </span>
                          </div>
                        </div>

                        {/* Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-600 dark:bg-green-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Menampilkan 8 rit panen terkini</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('panen')}
                  className="text-green-600 dark:text-green-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Lihat Seluruh Catatan Panen
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bento Card: Top 5 Anggota Petani */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-500" />
                    <span>Top 5 Anggota Panen</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">Periode Ini</span>
                </div>

                <div className="space-y-4">
                  {topPetani.map((pet, idx) => {
                    const percent = (pet.totalKg / maxPetaniKg) * 100;
                    return (
                      <div key={pet.nama} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {pet.nama}
                            </span>
                          </div>
                          <span className="font-bold text-green-600 dark:text-green-400 shrink-0 font-mono">
                            {formatKg(pet.totalKg)}
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-600 dark:bg-green-500 h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{pet.blok}</span>
                          <span>Netto: {formatRupiah(pet.totalNetto)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('petani')}
                  className="w-full py-2 px-3 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Lihat 20 Anggota Kelompok Tani</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Bento Card: Data Transaksi Panen Terkini */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-500" />
                  <span>Daftar Transaksi Panen & Penimbangan SPB Terbaru</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rekapitulasi penimbangan buah kelapa sawit yang tercatat di sistem.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('panen')}
                className="text-xs font-bold text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Buka Semua Catatan ({panenList.length})
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-6">No. SPB / Tanggal</th>
                    <th className="p-3.5">Nama Petani & Blok</th>
                    <th className="p-3.5">Armada & Tujuan</th>
                    <th className="p-3.5 text-right">Timbangan Dimuat</th>
                    <th className="p-3.5 text-right">Timbangan PKS</th>
                    <th className="p-3.5 text-right">Hasil Netto</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 pr-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {recentHarvests.slice(0, 6).map((record) => {
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 pl-6 font-medium">
                          <p className="font-bold text-slate-900 dark:text-white font-mono">{record.noSpb}</p>
                          <p className="text-[11px] text-slate-400">{formatTanggalPendek(record.tanggal)}</p>
                        </td>

                        <td className="p-3.5">
                          <p className="font-bold text-slate-900 dark:text-white">{record.petaniNama}</p>
                          <p className="text-[11px] text-slate-400">{record.blokLahan}</p>
                        </td>

                        <td className="p-3.5">
                          <p className="font-bold text-slate-900 dark:text-white font-mono">{record.platTruk || 'BM 8412 TA'}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{record.namaPks}</p>
                        </td>

                        <td className="p-3.5 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {formatKg(record.timbanganRamKg || record.timbanganPksKg)}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-green-600 dark:text-green-400">
                          {formatKg(record.timbanganPksKg)}
                          {record.selisihKg > 0 && (
                            <span className="block text-[10px] font-normal text-slate-400 font-sans">
                              Susut: -{record.selisihKg} kg
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(record.totalNetto)}
                          <span className="block text-[10px] text-slate-400 font-sans font-normal">
                            Bruto: {formatRupiah(record.totalBruto)}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <Badge
                            variant={
                              record.statusPembayaran === 'Lunas' ? 'success' :
                              record.statusPembayaran === 'Siap Bayar' ? 'warning' : 'neutral'
                            }
                            size="sm"
                            dot
                          >
                            {record.statusPembayaran}
                          </Badge>
                        </td>

                        <td className="p-3.5 pr-6 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedPanenForSlip(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Cetak Slip Pembayaran"
                          >
                            <Printer className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
