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
  Filter
} from 'lucide-react';
import { 
  formatRupiah, 
  formatKg, 
  formatTanggalIndo, 
  formatNumber, 
  formatTanggalPendek 
} from '../../lib/utils';
import { exportPanenToExcel } from '../../lib/excelHelper';
import { SlipSemuaPetaniModal } from '../panen/SlipSemuaPetaniModal';

export const RekapView: React.FC = () => {
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

  // Filter Periode (Bulan Ini / Semua)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [searchPetani, setSearchPetani] = useState('');
  const [expandedPetaniId, setExpandedPetaniId] = useState<string | null>(null);
  const [selectedPetaniForSlipAll, setSelectedPetaniForSlipAll] = useState<{
    petani: Petani;
    harvests: PanenRecord[];
  } | null>(null);

  // Group harvest by Petani
  const rekapData = useMemo(() => {
    return petaniList.map((petani) => {
      // Find all harvests for this farmer in the selected month
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

  // Overall Totals
  const grandTotalRamKg = rekapData.reduce((s, r) => s + r.totalRamKg, 0);
  const grandTotalPksKg = rekapData.reduce((s, r) => s + r.totalPksKg, 0);
  const grandTotalSelisihKg = rekapData.reduce((s, r) => s + r.totalSelisihKg, 0);
  const grandAvgSusut = grandTotalRamKg > 0 ? ((grandTotalSelisihKg / grandTotalRamKg) * 100).toFixed(2) : '0';
  const grandTotalOmzetKelompokSelisih = grandTotalSelisihKg * (pengaturan.hargaTbsDefault || 2780);
  const grandTotalBruto = rekapData.reduce((s, r) => s + r.totalBruto, 0);
  const grandTotalPotongan = rekapData.reduce((s, r) => s + r.totalPotongan, 0);
  const grandTotalNetto = rekapData.reduce((s, r) => s + r.totalNetto, 0);
  const grandTotalIuran = rekapData.reduce((s, r) => s + r.totalIuranKas, 0);

  const toggleExpand = (petaniId: string) => {
    setExpandedPetaniId(prev => prev === petaniId ? null : petaniId);
  };

  const handleMarkFarmerAllPaid = (harvests: PanenRecord[]) => {
    const ids = harvests.filter(h => h.statusPembayaran !== 'Lunas').map(h => h.id);
    if (ids.length > 0) {
      batchUpdateStatusPanen(ids, 'Lunas');
    }
  };

  const handleExportExcel = () => {
    const periodHarvests = panenList.filter(p => {
      const matchMonth = selectedMonth === 'all' || p.tanggal.startsWith(selectedMonth);
      if (userRole === 'petani' && activePetaniId) {
        return matchMonth && p.petaniId === activePetaniId;
      }
      return matchMonth;
    });

    const monthName = selectedMonth === 'all' 
      ? 'Semua Periode' 
      : `Periode ${selectedMonth}`;

    exportPanenToExcel(periodHarvests, {
      namaKelompok: pengaturan.namaKelompok || 'Kelompok Tani Bunga Sari',
      periodeLabel: monthName,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-500" />
            <span>Hasil Rekapan & Slip Pembayaran Petani</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rekapitulasi resmi tonase, potongan pedaran, iuran kas kelompok, dan total pembayaran bersih ke petani.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
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
            <span>Cetak Rekapitulasi Resmi</span>
          </button>
        </div>
      </div>

      {/* Filter & Period Selector Bento Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-green-600 dark:text-green-500" />
            <span>Periode Rekap:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="2026-08">Agustus 2026 (Bulan Berjalan)</option>
            <option value="2026-07">Juli 2026</option>
            <option value="2026-06">Juni 2026</option>
            <option value="all">Semua Periode</option>
          </select>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchPetani}
            onChange={(e) => setSearchPetani(e.target.value)}
            placeholder="Cari nama petani atau blok..."
            className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
      </div>

      {/* Grand Summary KPI Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Tonase PKS Netto</p>
          <p className="text-xl font-black text-green-600 dark:text-green-400 font-mono mt-1">{formatKg(grandTotalPksKg)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Ram: {formatKg(grandTotalRamKg)}</p>
        </div>

        <div className="bg-slate-950 text-white p-4 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider relative z-10">Omset Kelompok (Selisih)</p>
          <p className="text-xl font-black text-emerald-400 font-mono mt-1 relative z-10">{formatRupiah(grandTotalOmzetKelompokSelisih)}</p>
          <p className="text-[11px] text-slate-300 mt-0.5 relative z-10 font-mono">Susut: {formatKg(grandTotalSelisihKg)} ({grandAvgSusut}%)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Bruto Panen</p>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">{formatRupiah(grandTotalBruto)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Potongan: -{formatRupiah(grandTotalPotongan)}</p>
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
              Rekapitulasi Pendapatan Per Petani ({rekapData.length} Anggota)
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
              {rekapData.map((row) => {
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
                                      <th className="p-2 text-right">Susut</th>
                                      <th className="p-2 text-right">Bruto</th>
                                      <th className="p-2 text-right">Pedaran</th>
                                      <th className="p-2 text-right">Upah</th>
                                      <th className="p-2 text-right">Kasbon</th>
                                      <th className="p-2 text-right font-bold">Netto</th>
                                      <th className="p-2 text-center">Status</th>
                                      <th className="p-2 text-center">Cetak</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {row.harvests.map((h) => (
                                      <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="p-2 font-mono font-bold text-slate-900 dark:text-white">{h.noSpb}</td>
                                        <td className="p-2 text-slate-400">{formatTanggalPendek(h.tanggal)}</td>
                                        <td className="p-2 text-slate-400">{h.platTruk} - {h.namaPks}</td>
                                        <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">{formatNumber(h.timbanganPksKg)} kg</td>
                                        <td className="p-2 text-right font-mono text-rose-600 dark:text-rose-400">-{h.selisihKg}kg ({h.persentaseSelisih}%)</td>
                                        <td className="p-2 text-right font-mono text-slate-900 dark:text-white">{formatRupiah(h.totalBruto)}</td>
                                        <td className="p-2 text-right font-mono text-rose-600 dark:text-rose-400">-{formatRupiah(h.potonganPedaranRupiah)}</td>
                                        <td className="p-2 text-right font-mono text-rose-600 dark:text-rose-400">-{formatRupiah(h.upahPemanenRupiah)}</td>
                                        <td className="p-2 text-right font-mono text-rose-600 dark:text-rose-400">-{formatRupiah(h.kasbonPupukRupiah)}</td>
                                        <td className="p-2 text-right font-mono font-bold text-green-600 dark:text-green-400">{formatRupiah(h.totalNetto)}</td>
                                        <td className="p-2 text-center">
                                          <Badge variant={h.statusPembayaran === 'Lunas' ? 'success' : 'warning'} size="sm">
                                            {h.statusPembayaran}
                                          </Badge>
                                        </td>
                                        <td className="p-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => setSelectedPanenForSlip(h)}
                                            className="p-1 rounded-md text-green-600 dark:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                            title="Cetak Kwitansi SPB"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                          </button>
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

      {/* Modal Cetak Slip Semua SPB Petani */}
      {selectedPetaniForSlipAll && (
        <SlipSemuaPetaniModal
          isOpen={!!selectedPetaniForSlipAll}
          onClose={() => setSelectedPetaniForSlipAll(null)}
          petani={selectedPetaniForSlipAll.petani}
          harvests={selectedPetaniForSlipAll.harvests}
          periodeLabel={
            selectedMonth === 'all' 
              ? 'Semua Periode' 
              : selectedMonth === '2026-08' 
                ? 'Agustus 2026' 
                : selectedMonth === '2026-07' 
                  ? 'Juli 2026' 
                  : selectedMonth === '2026-06' 
                    ? 'Juni 2026' 
                    : selectedMonth
          }
        />
      )}

    </div>
  );
};
