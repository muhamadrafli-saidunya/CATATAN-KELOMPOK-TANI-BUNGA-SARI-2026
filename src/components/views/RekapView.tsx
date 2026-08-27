import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Petani, PanenRecord } from '../../types';
import { Badge } from '../common/Badge';
import { 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Users, 
  Scale, 
  TrendingUp,
  Eye,
  Filter,
  Edit3,
  Copy,
  CalendarDays,
  Clock,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { 
  formatRupiah, 
  formatKg, 
  formatTanggalIndo, 
  formatNumber, 
  formatTanggalPendek,
  getDaftarPilihanBulan,
  formatBulanTahunIndo
} from '../../lib/utils';
import { exportPanenToExcel } from '../../lib/excelHelper';
import { SlipSemuaPetaniModal } from '../panen/SlipSemuaPetaniModal';
import { SlipRekapTanggalModal } from '../panen/SlipRekapTanggalModal';
import { FormPanenModal } from '../panen/FormPanenModal';
import confetti from 'canvas-confetti';

interface RekapViewProps {
  onOpenEditPanen?: (record: PanenRecord) => void;
}

export const RekapView: React.FC<RekapViewProps> = ({ onOpenEditPanen }) => {
  const { 
    panenList, 
    petaniList, 
    pengaturan, 
    setSelectedPanenForSlip, 
    batchUpdateStatusPanen,
    setActiveTab,
    userRole,
    activePetaniId
  } = useApp();

  // Mode Rekap: 'petani' (Bulanan / Per Anggota) atau 'tanggal' (Harian / Per Tanggal Panen)
  const [rekapMode, setRekapMode] = useState<'petani' | 'tanggal'>('petani');

  // Filter Periode Bulan (Rekap Petani)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [searchPetani, setSearchPetani] = useState('');
  const [expandedPetaniId, setExpandedPetaniId] = useState<string | null>(null);

  // Filter Rekap Tanggal Panen
  const [selectedTanggalPanen, setSelectedTanggalPanen] = useState<string>('2026-08-25');
  const [statusFilterTanggal, setStatusFilterTanggal] = useState<string>('all');
  const [searchTanggalQuery, setSearchTanggalQuery] = useState('');

  // Modals state
  const [selectedPetaniForSlipAll, setSelectedPetaniForSlipAll] = useState<{
    petani: Petani;
    harvests: PanenRecord[];
  } | null>(null);
  const [isPrintTanggalModalOpen, setIsPrintTanggalModalOpen] = useState(false);
  const [internalEditingRecord, setInternalEditingRecord] = useState<PanenRecord | null>(null);
  const [copiedWaTanggal, setCopiedWaTanggal] = useState(false);

  // Daftar 12 Bulan Lengkap dan Riwayat Bulan Panen Aktual
  const periodeBulanList = useMemo(() => {
    return getDaftarPilihanBulan(panenList.map(p => p.tanggal));
  }, [panenList]);

  // Daftar Pilihan Tanggal Panen Aktual (Diurutkan dari terbaru)
  const tanggalPanenOptions = useMemo(() => {
    const dateMap: Record<string, { count: number; totalPks: number; totalRam: number; totalNetto: number }> = {};
    panenList.forEach(p => {
      if (!dateMap[p.tanggal]) {
        dateMap[p.tanggal] = { count: 0, totalPks: 0, totalRam: 0, totalNetto: 0 };
      }
      dateMap[p.tanggal].count += 1;
      dateMap[p.tanggal].totalPks += p.timbanganPksKg || 0;
      dateMap[p.tanggal].totalRam += p.timbanganRamKg || 0;
      dateMap[p.tanggal].totalNetto += p.totalNetto || 0;
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(dateStr => ({
      date: dateStr,
      label: formatTanggalIndo(dateStr),
      count: dateMap[dateStr].count,
      totalPks: dateMap[dateStr].totalPks,
      totalNetto: dateMap[dateStr].totalNetto,
    }));
  }, [panenList]);

  // Handle Edit Panen SPB
  const handleTriggerEditPanen = (record: PanenRecord) => {
    if (onOpenEditPanen) {
      onOpenEditPanen(record);
    } else {
      setInternalEditingRecord(record);
    }
  };

  // Group harvest by Petani (Mode: Rekap Petani)
  const rekapDataPetani = useMemo(() => {
    return petaniList.map((petani) => {
      const farmerHarvests = panenList.filter(p => {
        const matchFarmer = p.petaniId === petani.id;
        const matchMonth = selectedMonth === 'all' || p.tanggal.startsWith(selectedMonth);
        return matchFarmer && matchMonth;
      });

      const totalRit = farmerHarvests.length;
      const totalRamKg = farmerHarvests.reduce((sum, p) => sum + p.timbanganRamKg, 0);
      const totalPksKg = farmerHarvests.reduce((sum, p) => sum + p.timbanganPksKg, 0);
      const totalSelisihKg = farmerHarvests.reduce((sum, p) => sum + p.selisihKg, 0);
      const avgSusutPersen = totalRamKg > 0 ? Number(((totalSelisihKg / totalRamKg) * 100).toFixed(2)) : 0;

      const totalBruto = farmerHarvests.reduce((sum, p) => sum + p.totalBruto, 0);
      const totalPedaranRupiah = farmerHarvests.reduce((sum, p) => sum + p.potonganPedaranRupiah, 0);
      const totalIuranKas = farmerHarvests.reduce((sum, p) => sum + p.potonganIuranKasRupiah, 0);
      const totalUpahPanen = farmerHarvests.reduce((sum, p) => sum + p.upahPemanenRupiah, 0);
      const totalKasbon = farmerHarvests.reduce((sum, p) => sum + p.kasbonPupukRupiah, 0);
      const totalPotongan = farmerHarvests.reduce((sum, p) => sum + p.totalPotongan, 0);
      const totalNetto = farmerHarvests.reduce((sum, p) => sum + p.totalNetto, 0);

      const allLunas = farmerHarvests.length > 0 && farmerHarvests.every(p => p.statusPembayaran === 'Lunas');
      const hasPending = farmerHarvests.some(p => p.statusPembayaran !== 'Lunas');

      return {
        petani,
        harvests: farmerHarvests,
        totalRit,
        totalRamKg,
        totalPksKg,
        totalSelisihKg,
        avgSusutPersen,
        totalBruto,
        totalPedaranRupiah,
        totalIuranKas,
        totalUpahPanen,
        totalKasbon,
        totalPotongan,
        totalNetto,
        statusPembayaran: totalRit === 0 ? 'Tidak Ada Panen' : allLunas ? 'Lunas' : 'Siap Bayar',
      };
    }).filter(item => {
      if (userRole === 'petani' && activePetaniId && item.petani.id !== activePetaniId) {
        return false;
      }
      return item.petani.nama.toLowerCase().includes(searchPetani.toLowerCase()) ||
             item.petani.blokLahan.toLowerCase().includes(searchPetani.toLowerCase());
    });
  }, [panenList, petaniList, selectedMonth, searchPetani, userRole, activePetaniId]);

  // Overall Totals Rekap Petani
  const grandTotalRamKg = rekapDataPetani.reduce((s, r) => s + r.totalRamKg, 0);
  const grandTotalPksKg = rekapDataPetani.reduce((s, r) => s + r.totalPksKg, 0);
  const grandTotalSelisihKg = rekapDataPetani.reduce((s, r) => s + r.totalSelisihKg, 0);
  const grandAvgSusut = grandTotalRamKg > 0 ? ((grandTotalSelisihKg / grandTotalRamKg) * 100).toFixed(2) : '0';
  const grandTotalBruto = rekapDataPetani.reduce((s, r) => s + r.totalBruto, 0);
  const grandTotalPotongan = rekapDataPetani.reduce((s, r) => s + r.totalPotongan, 0);
  const grandTotalNetto = rekapDataPetani.reduce((s, r) => s + r.totalNetto, 0);
  const grandTotalIuran = rekapDataPetani.reduce((s, r) => s + r.totalIuranKas, 0);

  // Filter Data untuk Mode: Rekap Per Tanggal Panen
  const rekapDataTanggal = useMemo(() => {
    return panenList.filter(p => {
      if (userRole === 'petani' && activePetaniId && p.petaniId !== activePetaniId) {
        return false;
      }
      const matchDate = selectedTanggalPanen === 'all' || p.tanggal === selectedTanggalPanen;
      const farmer = petaniList.find(pt => pt.id === p.petaniId);
      const farmerNama = farmer?.nama || p.petaniNama || '';
      const farmerBlok = farmer?.blokLahan || p.blokLahan || '';

      const matchSearch = searchTanggalQuery.trim() === '' ||
        farmerNama.toLowerCase().includes(searchTanggalQuery.toLowerCase()) ||
        p.noSpb.toLowerCase().includes(searchTanggalQuery.toLowerCase()) ||
        farmerBlok.toLowerCase().includes(searchTanggalQuery.toLowerCase()) ||
        p.platTruk.toLowerCase().includes(searchTanggalQuery.toLowerCase());
      const matchStatus = statusFilterTanggal === 'all' || p.statusPembayaran === statusFilterTanggal;

      return matchDate && matchSearch && matchStatus;
    });
  }, [panenList, petaniList, selectedTanggalPanen, searchTanggalQuery, statusFilterTanggal, userRole, activePetaniId]);

  // Totals untuk Tanggal Terpilih
  const totalTanggalRamKg = rekapDataTanggal.reduce((s, p) => s + (p.timbanganRamKg || p.timbanganPksKg || 0), 0);
  const totalTanggalPksKg = rekapDataTanggal.reduce((s, p) => s + (p.timbanganPksKg || p.timbanganRamKg || 0), 0);
  const totalTanggalSelisihKg = rekapDataTanggal.reduce((s, p) => s + p.selisihKg, 0);
  const avgTanggalSusut = totalTanggalRamKg > 0 ? ((totalTanggalSelisihKg / totalTanggalRamKg) * 100).toFixed(2) : '0';
  const totalTanggalBruto = rekapDataTanggal.reduce((s, p) => s + p.totalBruto, 0);
  const totalTanggalPotongan = rekapDataTanggal.reduce((s, p) => s + p.totalPotongan, 0);
  const totalTanggalNetto = rekapDataTanggal.reduce((s, p) => s + p.totalNetto, 0);
  const totalTanggalIuran = rekapDataTanggal.reduce((s, p) => s + p.potonganIuranKasRupiah, 0);
  const avgHargaTanggal = totalTanggalPksKg > 0 ? Math.round(totalTanggalBruto / totalTanggalPksKg) : (pengaturan.hargaTbsDefault || 2780);

  const toggleExpand = (petaniId: string) => {
    setExpandedPetaniId(prev => prev === petaniId ? null : petaniId);
  };

  const handleMarkFarmerAllPaid = (harvests: PanenRecord[]) => {
    const ids = harvests.filter(h => h.statusPembayaran !== 'Lunas').map(h => h.id);
    if (ids.length > 0) {
      batchUpdateStatusPanen(ids, 'Lunas');
    }
  };

  const handleMarkTanggalAllPaid = () => {
    const ids = rekapDataTanggal.filter(h => h.statusPembayaran !== 'Lunas').map(h => h.id);
    if (ids.length > 0) {
      batchUpdateStatusPanen(ids, 'Lunas');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    }
  };

  const handleExportExcelPetani = () => {
    const periodHarvests = panenList.filter(p => {
      const matchMonth = selectedMonth === 'all' || p.tanggal.startsWith(selectedMonth);
      if (userRole === 'petani' && activePetaniId) {
        return matchMonth && p.petaniId === activePetaniId;
      }
      return matchMonth;
    });

    const monthName = formatBulanTahunIndo(selectedMonth);

    exportPanenToExcel(periodHarvests, {
      namaKelompok: pengaturan.namaKelompok || 'Kelompok Tani Bunga Sari',
      periodeLabel: monthName,
    });
  };

  const handleExportExcelTanggal = () => {
    const tglLabel = selectedTanggalPanen === 'all' ? 'Semua Tanggal Panen' : `Tanggal ${formatTanggalIndo(selectedTanggalPanen)}`;
    exportPanenToExcel(rekapDataTanggal, {
      namaKelompok: pengaturan.namaKelompok || 'Kelompok Tani Bunga Sari',
      periodeLabel: tglLabel,
    });
  };

  const handleCopyWaTanggal = () => {
    let text = `*REKAPITULASI PANEN HARIAN*\n`;
    text += `*${pengaturan.namaKelompok.toUpperCase()}*\n`;
    text += `Tanggal: ${selectedTanggalPanen === 'all' ? 'Semua Tanggal Panen' : formatTanggalIndo(selectedTanggalPanen)}\n`;
    text += `Total Transaksi: ${rekapDataTanggal.length} SPB Petani\n`;
    text += `------------------------------------\n`;
    text += `*RINCIAN HASIL PANEN PETANI:*\n`;

    rekapDataTanggal.forEach((h, idx) => {
      const farmer = petaniList.find(pt => pt.id === h.petaniId);
      const farmerNama = farmer?.nama || h.petaniNama || 'Petani Sawit';
      const farmerBlok = farmer?.blokLahan || h.blokLahan || '-';

      text += `${idx + 1}. *${farmerNama}* (${farmerBlok})\n`;
      text += `   - Tonase PKS: ${formatKg(h.timbanganPksKg)} (Ram: ${formatKg(h.timbanganRamKg)})\n`;
      text += `   - Harga TBS : ${formatRupiah(h.hargaTbsPerKg)}/kg\n`;
      text += `   - Bruto     : ${formatRupiah(h.totalBruto)}\n`;
      text += `   - Potongan  : -${formatRupiah(h.totalPotongan)}\n`;
      text += `   - *NETTO*   : *${formatRupiah(h.totalNetto)}* [${h.statusPembayaran}]\n\n`;
    });

    text += `------------------------------------\n`;
    text += `*TOTAL KESELURUHAN TANGGAL INI:*\n`;
    text += `• Total Tonase Ram : ${formatKg(totalTanggalRamKg)}\n`;
    text += `• Total Tonase PKS : ${formatKg(totalTanggalPksKg)}\n`;
    text += `• Rata-rata Harga  : ${formatRupiah(avgHargaTanggal)}/kg\n`;
    text += `• Total Bruto      : ${formatRupiah(totalTanggalBruto)}\n`;
    text += `• Total Potongan   : -${formatRupiah(totalTanggalPotongan)}\n`;
    text += `• *TOTAL NETTO DIBAYAR:* *${formatRupiah(totalTanggalNetto)}*\n\n`;
    text += `_Dokumen Resmi ${pengaturan.namaKelompok}_`;

    navigator.clipboard.writeText(text);
    setCopiedWaTanggal(true);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => setCopiedWaTanggal(false), 2500);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-500" />
            <span>Hasil Rekapan & Slip Pembayaran Petani</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rekapitulasi resmi hasil tonase, harga TBS, potongan kasbon/iuran, dan total netto bersih yang diterima petani.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={rekapMode === 'petani' ? handleExportExcelPetani : handleExportExcelTanggal}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Unduh rekapitulasi data panen dalam format Excel (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cetak-laporan')}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Pusat Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* Segmented Switch & Filter Toolbar Bento Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
          
          {/* Segmented Mode Switcher: Rekap Per Petani vs Rekap Per Tanggal Panen */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 w-fit">
            <button
              type="button"
              onClick={() => setRekapMode('petani')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rekapMode === 'petani'
                  ? 'bg-white dark:bg-slate-900 text-green-700 dark:text-green-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Rekap Per Petani</span>
            </button>

            <button
              type="button"
              onClick={() => setRekapMode('tanggal')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                rekapMode === 'tanggal'
                  ? 'bg-white dark:bg-slate-900 text-green-700 dark:text-green-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Rekap Per Tanggal Panen</span>
            </button>
          </div>

          {/* Quick Info Text */}
          <div className="text-xs text-slate-400">
            {rekapMode === 'petani' ? (
              <span>Menampilkan rekapitulasi bulanan per anggota petani & slip gabungan.</span>
            ) : (
              <span>Menampilkan rekapitulasi harian per tanggal panen dengan rincian tonase, harga, netto, edit, dan cetak.</span>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Sisi Kiri: Filter Periode / Tanggal */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {rekapMode === 'petani' ? (
              /* FILTER PERIODE BULAN */
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-500" />
                  <span>Periode Rekap:</span>
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
                >
                  <option value="all">Semua Periode (1 Tahun Penuh)</option>
                  {periodeBulanList.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* FILTER REKAP PER TANGGAL PANEN */
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  <CalendarDays className="w-4 h-4 text-green-600 dark:text-green-500" />
                  <span>Pilih Tanggal Panen:</span>
                </div>
                <select
                  value={selectedTanggalPanen}
                  onChange={(e) => setSelectedTanggalPanen(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
                >
                  <option value="all">Semua Tanggal Panen ({panenList.length} SPB)</option>
                  {tanggalPanenOptions.map((opt) => (
                    <option key={opt.date} value={opt.date}>
                      {opt.label} • {opt.count} Petani ({formatKg(opt.totalPks)})
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilterTanggal}
                  onChange={(e) => setStatusFilterTanggal(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                >
                  <option value="all">Semua Status Bayar</option>
                  <option value="Siap Bayar">Siap Bayar</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>
            )}
          </div>

          {/* Sisi Kanan: Search Bar */}
          <div className="w-full md:w-72">
            <input
              type="text"
              value={rekapMode === 'petani' ? searchPetani : searchTanggalQuery}
              onChange={(e) => rekapMode === 'petani' ? setSearchPetani(e.target.value) : setSearchTanggalQuery(e.target.value)}
              placeholder={rekapMode === 'petani' ? "Cari nama petani atau blok..." : "Cari petani, no SPB, atau truk..."}
              className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* MODE 1: REKAP PER PETANI (BULANAN) */}
      {/* ========================================================================================= */}
      {rekapMode === 'petani' && (
        <>
          {/* Grand Summary KPI Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Tonase PKS Netto</p>
              <p className="text-xl font-black text-green-600 dark:text-green-400 font-mono mt-1">{formatKg(grandTotalPksKg)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Ram Kebun: {formatKg(grandTotalRamKg)}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Bruto Panen</p>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{formatRupiah(grandTotalBruto)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Rata-rata Harga TBS</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Seluruh Potongan</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">-{formatRupiah(grandTotalPotongan)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Iuran, Upah, Kasbon</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Netto Dibayarkan</p>
              <p className="text-xl font-black text-green-600 dark:text-green-400 font-mono mt-1">{formatRupiah(grandTotalNetto)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Iuran Kas: +{formatRupiah(grandTotalIuran)}</p>
            </div>
          </div>

          {/* Rekapitulasi Table by Farmer Bento Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Rekapitulasi Pendapatan Per Petani ({rekapDataPetani.length} Anggota)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Klik baris petani untuk melihat rincian setiap pengiriman SPB & cetak slip per transaksi.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-6">Nama Petani & Blok Lahan</th>
                    <th className="p-3.5 text-center">Rit SPB</th>
                    <th className="p-3.5 text-right">Tonase Ram (Kg)</th>
                    <th className="p-3.5 text-right">Tonase PKS (Kg)</th>
                    <th className="p-3.5 text-right">Susut (%)</th>
                    <th className="p-3.5 text-right">Total Bruto</th>
                    <th className="p-3.5 text-right">Total Potongan</th>
                    <th className="p-3.5 text-right font-bold text-green-600 dark:text-green-400">Netto Petani</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 pr-6 text-center">Aksi Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {rekapDataPetani.map((row) => {
                    const isExpanded = expandedPetaniId === row.petani.id;
                    const hasPending = row.harvests.some(h => h.statusPembayaran !== 'Lunas');

                    return (
                      <React.Fragment key={row.petani.id}>
                        <tr 
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            isExpanded ? 'bg-slate-50/90 dark:bg-slate-800/60' : ''
                          }`}
                          onClick={() => toggleExpand(row.petani.id)}
                        >
                          <td className="p-3.5 pl-6">
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{row.petani.nama}</p>
                                <p className="text-[11px] text-slate-400">{row.petani.blokLahan} ({row.petani.luasHa} Ha)</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 text-center font-mono font-bold">
                            {row.totalRit} SPB
                          </td>

                          <td className="p-3.5 text-right font-mono">
                            {formatNumber(row.totalRamKg)} kg
                          </td>

                          <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatNumber(row.totalPksKg)} kg
                          </td>

                          <td className="p-3.5 text-right font-mono font-bold">
                            <span className={row.avgSusutPersen > 2.0 ? 'text-rose-600 dark:text-rose-400' : 'text-green-600 dark:text-green-400'}>
                              -{formatNumber(row.totalSelisihKg)} kg
                            </span>
                            <span className="block text-[10px] text-slate-400 font-sans">
                              {row.avgSusutPersen}%
                            </span>
                          </td>

                          <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatRupiah(row.totalBruto)}
                          </td>

                          <td className="p-3.5 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                            -{formatRupiah(row.totalPotongan)}
                            <span className="block text-[10px] text-slate-400 font-sans font-normal">
                              Kas: {formatRupiah(row.totalIuranKas)}
                            </span>
                          </td>

                          <td className="p-3.5 text-right font-mono font-black text-green-600 dark:text-green-400 text-sm">
                            {formatRupiah(row.totalNetto)}
                          </td>

                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <Badge
                              variant={row.statusPembayaran === 'Lunas' ? 'success' : row.statusPembayaran === 'Siap Bayar' ? 'warning' : 'neutral'}
                              size="sm"
                              dot
                            >
                              {row.statusPembayaran}
                            </Badge>
                          </td>

                          <td className="p-3.5 pr-6 text-center" onClick={(e) => e.stopPropagation()}>
                            {row.harvests.length > 0 ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPetaniForSlipAll({
                                    petani: row.petani,
                                    harvests: row.harvests,
                                  })}
                                  className="px-2.5 py-1.5 rounded-md text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Cetak Slip Semua SPB Petani"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Slip Semua</span>
                                </button>

                                {userRole === 'admin' && hasPending && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkFarmerAllPaid(row.harvests)}
                                    className="px-2.5 py-1.5 rounded-md text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Bayar Lunas Semua SPB Petani Ini"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Bayar</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>

                        {/* Sub-table: Expanded SPB Details */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 dark:bg-slate-950/50">
                            <td colSpan={10} className="p-4 pl-12">
                              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                  <h5 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                                    <Scale className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span>Rincian Pengiriman SPB - {row.petani.nama} ({row.harvests.length} Rit)</span>
                                  </h5>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    Rek: {row.petani.bank} ({row.petani.noRekening})
                                  </span>
                                </div>

                                {row.harvests.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic py-2">
                                    Belum ada transaksi panen untuk petani ini pada periode yang dipilih.
                                  </p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                        <tr>
                                          <th className="p-2">No. SPB</th>
                                          <th className="p-2">Tanggal</th>
                                          <th className="p-2">Truk / PKS</th>
                                          <th className="p-2 text-right">PKS (Kg)</th>
                                          <th className="p-2 text-right">Harga</th>
                                          <th className="p-2 text-right">Bruto</th>
                                          <th className="p-2 text-right">Potongan</th>
                                          <th className="p-2 text-right font-bold">Netto</th>
                                          <th className="p-2 text-center">Status</th>
                                          <th className="p-2 text-center">Aksi</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {row.harvests.map((h) => (
                                          <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="p-2 font-mono font-bold text-slate-900 dark:text-white">{h.noSpb}</td>
                                            <td className="p-2 text-slate-400">{formatTanggalPendek(h.tanggal)}</td>
                                            <td className="p-2 text-slate-400">{h.platTruk} - {h.namaPks}</td>
                                            <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">{formatNumber(h.timbanganPksKg)} kg</td>
                                            <td className="p-2 text-right font-mono text-slate-600 dark:text-slate-400">{formatRupiah(h.hargaTbsPerKg)}</td>
                                            <td className="p-2 text-right font-mono text-slate-900 dark:text-white">{formatRupiah(h.totalBruto)}</td>
                                            <td className="p-2 text-right font-mono text-rose-600 dark:text-rose-400">-{formatRupiah(h.totalPotongan)}</td>
                                            <td className="p-2 text-right font-mono font-bold text-green-600 dark:text-green-400">{formatRupiah(h.totalNetto)}</td>
                                            <td className="p-2 text-center">
                                              <Badge variant={h.statusPembayaran === 'Lunas' ? 'success' : 'warning'} size="sm">
                                                {h.statusPembayaran}
                                              </Badge>
                                            </td>
                                            <td className="p-2 text-center">
                                              <div className="flex items-center justify-center gap-1">
                                                {userRole === 'admin' && (
                                                  <button
                                                    type="button"
                                                    onClick={() => handleTriggerEditPanen(h)}
                                                    className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                    title="Edit SPB Panen Ini"
                                                  >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={() => setSelectedPanenForSlip(h)}
                                                  className="p-1 rounded-md text-green-600 dark:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                  title="Cetak Kwitansi SPB"
                                                >
                                                  <Printer className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================================= */}
      {/* MODE 2: REKAP PER TANGGAL PANEN (HARIAN) */}
      {/* ========================================================================================= */}
      {rekapMode === 'tanggal' && (
        <div className="space-y-6">
          
          {/* Summary KPI Cards untuk Tanggal Terpilih */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hasil Tonase Petani (PKS)</p>
              <p className="text-xl font-black text-green-600 dark:text-green-400 font-mono mt-1">{formatKg(totalTanggalPksKg)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Ram Kebun: {formatKg(totalTanggalRamKg)}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rata-rata Harga TBS</p>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{formatRupiah(avgHargaTanggal)}/kg</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Bruto: {formatRupiah(totalTanggalBruto)}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Seluruh Potongan</p>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">-{formatRupiah(totalTanggalPotongan)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Iuran Kas: +{formatRupiah(totalTanggalIuran)}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Netto Petani Dibayarkan</p>
              <p className="text-xl font-black text-green-600 dark:text-green-400 font-mono mt-1">{formatRupiah(totalTanggalNetto)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{rekapDataTanggal.length} SPB Panen Terdata</p>
            </div>
          </div>

          {/* Tabel Rekap Per Tanggal Panen */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-green-600 dark:text-green-500" />
                  <span>
                    Rekapitulasi Panen {selectedTanggalPanen === 'all' ? 'Semua Tanggal' : `Tanggal ${formatTanggalIndo(selectedTanggalPanen)}`}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Menampilkan {rekapDataTanggal.length} rincian hasil tonase petani, harga TBS, netto, dan tombol edit langsung.
                </p>
              </div>

              {rekapDataTanggal.some(p => p.statusPembayaran !== 'Lunas') && userRole === 'admin' && (
                <button
                  type="button"
                  onClick={handleMarkTanggalAllPaid}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bayar Lunas Semua SPB Tanggal Ini</span>
                </button>
              )}
            </div>

            {rekapDataTanggal.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CalendarDays className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-sm font-semibold">Tidak ada data transaksi panen pada tanggal atau filter yang dipilih.</p>
                <p className="text-xs text-slate-500 mt-1">Silakan pilih tanggal panen lain pada dropdown di atas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5 pl-6 w-12 text-center">No</th>
                      <th className="p-3.5">No. SPB</th>
                      <th className="p-3.5">Nama Petani & Blok</th>
                      <th className="p-3.5 text-right">Tonase Ram (Kg)</th>
                      <th className="p-3.5 text-right font-bold text-slate-900 dark:text-white">Tonase PKS (Kg)</th>
                      <th className="p-3.5 text-right">Harga TBS</th>
                      <th className="p-3.5 text-right">Total Bruto</th>
                      <th className="p-3.5 text-right">Potongan</th>
                      <th className="p-3.5 text-right font-bold text-green-600 dark:text-green-400">Netto Petani</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 pr-6 text-center">Aksi (Edit / Cetak)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {rekapDataTanggal.map((h, index) => {
                      const farmer = petaniList.find(pt => pt.id === h.petaniId);
                      const farmerNama = farmer?.nama || h.petaniNama || 'Petani Sawit';
                      const farmerBlok = farmer?.blokLahan || h.blokLahan || '-';
                      const potTooltip = `Pedaran: ${formatRupiah(h.potonganPedaranRupiah)} | Iuran: ${formatRupiah(h.potonganIuranKasRupiah)} | Upah: ${formatRupiah(h.upahPemanenRupiah)} | Kasbon: ${formatRupiah(h.kasbonPupukRupiah)}`;
                      return (
                        <tr 
                          key={h.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-3.5 pl-6 text-center font-mono text-slate-400">
                            {index + 1}
                          </td>

                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            {h.noSpb}
                            <span className="block text-[10px] text-slate-400 font-sans font-normal">
                              {h.platTruk} • {h.namaPks}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {farmerNama.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white leading-tight">{farmerNama}</p>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{farmerBlok}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 text-right font-mono">
                            {formatNumber(h.timbanganRamKg)} kg
                          </td>

                          <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatNumber(h.timbanganPksKg)} kg
                            <span className="block text-[10px] text-rose-600 dark:text-rose-400 font-sans font-normal">
                              -{h.selisihKg} kg ({h.persentaseSelisih}%)
                            </span>
                          </td>

                          <td className="p-3.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {formatRupiah(h.hargaTbsPerKg)}
                            <span className="block text-[10px] text-slate-400 font-sans font-normal">/kg</span>
                          </td>

                          <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatRupiah(h.totalBruto)}
                          </td>

                          <td className="p-3.5 text-right font-mono text-rose-600 dark:text-rose-400" title={potTooltip}>
                            -{formatRupiah(h.totalPotongan)}
                            <span className="block text-[10px] text-slate-400 font-sans font-normal">
                              Kas: {formatRupiah(h.potonganIuranKasRupiah)}
                            </span>
                          </td>

                          <td className="p-3.5 text-right font-mono font-black text-green-600 dark:text-green-400 text-sm">
                            {formatRupiah(h.totalNetto)}
                          </td>

                          <td className="p-3.5 text-center">
                            <Badge
                              variant={h.statusPembayaran === 'Lunas' ? 'success' : 'warning'}
                              size="sm"
                              dot
                            >
                              {h.statusPembayaran}
                            </Badge>
                          </td>

                          <td className="p-3.5 pr-6 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Tombol Edit */}
                              {userRole === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleTriggerEditPanen(h)}
                                  className="px-2 py-1 rounded-md text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Edit Rincian Tonase / Harga / Potongan SPB Ini"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                              )}

                              {/* Tombol Cetak Slip SPB */}
                              <button
                                type="button"
                                onClick={() => setSelectedPanenForSlip(h)}
                                className="px-2 py-1 rounded-md text-xs font-bold text-green-700 dark:text-green-300 bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Cetak Kwitansi SPB"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Foot Grand Total */}
                  <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <tr>
                      <td colSpan={3} className="p-3.5 pl-6 text-center uppercase tracking-wider text-xs">
                        TOTAL REKAPITULASI ({rekapDataTanggal.length} SPB)
                      </td>
                      <td className="p-3.5 text-right font-mono">{formatNumber(totalTanggalRamKg)} kg</td>
                      <td className="p-3.5 text-right font-mono font-bold text-green-600 dark:text-green-400">{formatNumber(totalTanggalPksKg)} kg</td>
                      <td className="p-3.5 text-right font-mono">{formatRupiah(avgHargaTanggal)}/kg</td>
                      <td className="p-3.5 text-right font-mono">{formatRupiah(totalTanggalBruto)}</td>
                      <td className="p-3.5 text-right font-mono text-rose-600 dark:text-rose-400">-{formatRupiah(totalTanggalPotongan)}</td>
                      <td className="p-3.5 text-right font-mono font-black text-green-600 dark:text-green-400 text-base">
                        {formatRupiah(totalTanggalNetto)}
                      </td>
                      <td colSpan={2} className="p-3.5 pr-6 text-center text-xs text-slate-500">
                        {rekapDataTanggal.every(p => p.statusPembayaran === 'Lunas') ? 'Semua Lunas' : 'Ada Siap Bayar'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================================================= */}
          {/* BAGIAN BAWAH: AKSI CETAK & REKAP TANGGAL PANEN */}
          {/* ========================================================================================= */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  Laporan Panen Harian
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedTanggalPanen === 'all' ? 'Semua Tanggal Panen' : formatTanggalIndo(selectedTanggalPanen)}
                </span>
              </div>
              <h4 className="text-lg font-black text-white">
                Total Netto Petani: <span className="text-emerald-400 font-mono">{formatRupiah(totalTanggalNetto)}</span>
              </h4>
              <p className="text-xs text-slate-400">
                Akumulasi dari {rekapDataTanggal.length} SPB • Total Tonase PKS: {formatKg(totalTanggalPksKg)} • Rata-rata TBS: {formatRupiah(avgHargaTanggal)}/kg
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCopyWaTanggal}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                title="Salin rincian rekap panen ke WhatsApp"
              >
                {copiedWaTanggal ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                <span>{copiedWaTanggal ? 'Tersalin ke WhatsApp!' : 'Salin Format WA'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcelTanggal}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                title="Unduh Excel untuk tanggal panen ini"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Unduh Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintTanggalModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-500 text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-green-900/40 active:scale-95"
                title="Buka lembar cetak resmi A4 rekapitulasi panen tanggal ini lengkap dengan tanda tangan"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rekap Tanggal Panen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Slip Semua SPB Petani (Mode Bulanan) */}
      {selectedPetaniForSlipAll && (
        <SlipSemuaPetaniModal
          isOpen={!!selectedPetaniForSlipAll}
          onClose={() => setSelectedPetaniForSlipAll(null)}
          petani={selectedPetaniForSlipAll.petani}
          harvests={selectedPetaniForSlipAll.harvests}
          periodeLabel={formatBulanTahunIndo(selectedMonth)}
        />
      )}

      {/* Modal Cetak Rekapitulasi Tanggal Panen (Mode Tanggal - Tombol di Bawah) */}
      {isPrintTanggalModalOpen && (
        <SlipRekapTanggalModal
          isOpen={isPrintTanggalModalOpen}
          onClose={() => setIsPrintTanggalModalOpen(false)}
          tanggal={selectedTanggalPanen === 'all' ? (tanggalPanenOptions[0]?.date || '2026-08-25') : selectedTanggalPanen}
          harvests={rekapDataTanggal}
        />
      )}

      {/* Modal Internal Edit Panen */}
      {internalEditingRecord && (
        <FormPanenModal
          isOpen={!!internalEditingRecord}
          onClose={() => setInternalEditingRecord(null)}
          editingRecord={internalEditingRecord}
        />
      )}

    </div>
  );
};
