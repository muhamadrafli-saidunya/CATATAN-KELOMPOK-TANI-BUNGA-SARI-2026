import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { 
  GitCompare, 
  Truck, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  ArrowUpRight, 
  Info,
  Scale,
  Calendar
} from 'lucide-react';
import { 
  formatKg, 
  formatTon, 
  formatRupiah, 
  formatNumber, 
  formatTanggalPendek 
} from '../../lib/utils';

export const SelisihView: React.FC = () => {
  const { panenList, pengaturan } = useApp();

  const [selectedPksFilter, setSelectedPksFilter] = useState<string>('all');
  const [selectedTrukFilter, setSelectedTrukFilter] = useState<string>('all');

  // Group by PKS
  const pksStats = useMemo(() => {
    const map: { [pks: string]: { nama: string; rit: number; ramKg: number; pksKg: number; selisihKg: number } } = {};
    panenList.forEach(p => {
      if (!map[p.namaPks]) {
        map[p.namaPks] = { nama: p.namaPks, rit: 0, ramKg: 0, pksKg: 0, selisihKg: 0 };
      }
      map[p.namaPks].rit += 1;
      map[p.namaPks].ramKg += p.timbanganRamKg;
      map[p.namaPks].pksKg += p.timbanganPksKg;
      map[p.namaPks].selisihKg += p.selisihKg;
    });

    return Object.values(map).map(item => ({
      ...item,
      susutPersen: item.ramKg > 0 ? Number(((item.selisihKg / item.ramKg) * 100).toFixed(2)) : 0,
      nominalSusutRupiah: item.selisihKg * pengaturan.hargaTbsDefault,
    }));
  }, [panenList, pengaturan]);

  // Group by Truk / Sopir
  const trukStats = useMemo(() => {
    const map: { [truk: string]: { plat: string; sopir: string; rit: number; ramKg: number; pksKg: number; selisihKg: number } } = {};
    panenList.forEach(p => {
      const key = `${p.platTruk}_${p.namaSopir}`;
      if (!map[key]) {
        map[key] = { plat: p.platTruk, sopir: p.namaSopir, rit: 0, ramKg: 0, pksKg: 0, selisihKg: 0 };
      }
      map[key].rit += 1;
      map[key].ramKg += p.timbanganRamKg;
      map[key].pksKg += p.timbanganPksKg;
      map[key].selisihKg += p.selisihKg;
    });

    return Object.values(map).map(item => ({
      ...item,
      susutPersen: item.ramKg > 0 ? Number(((item.selisihKg / item.ramKg) * 100).toFixed(2)) : 0,
    }));
  }, [panenList]);

  // High loss alerts (> 2.0%)
  const highLossList = panenList.filter(p => p.persentaseSelisih > (pengaturan.toleransiSusutPersen || 2.0));

  // Overall calculations
  const totalRam = panenList.reduce((s, p) => s + p.timbanganRamKg, 0);
  const totalPks = panenList.reduce((s, p) => s + p.timbanganPksKg, 0);
  const totalSelisih = panenList.reduce((s, p) => s + p.selisihKg, 0);
  const avgSusut = totalRam > 0 ? ((totalSelisih / totalRam) * 100).toFixed(2) : '0';
  const totalLossNominal = totalSelisih * pengaturan.hargaTbsDefault;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-green-600 dark:text-green-500" />
            <span>Analisis Susut & Selisih Tonase Kebun vs Pabrik (PKS)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit transparansi penyusutan tonase timbangan ram kebun terhadap timbangan netto pabrik kelapa sawit.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Ambang Batas Toleransi Susut: <strong>≤ {pengaturan.toleransiSusutPersen || 2.0}%</strong></span>
        </div>
      </div>

      {/* Summary KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tonase Ram Kebun</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{formatTon(totalRam)}</p>
          <span className="text-[11px] text-slate-400">100% basis timbangan awal</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tonase Netto PKS</span>
          <p className="text-2xl font-black text-green-600 dark:text-green-400 font-mono mt-1">{formatTon(totalPks)}</p>
          <span className="text-[11px] text-green-600 dark:text-green-400 font-semibold">{((totalPks / (totalRam || 1)) * 100).toFixed(2)}% terkonfirmasi pabrik</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Susut Selisih</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">-{formatKg(totalSelisih)}</p>
          <span className="text-[11px] text-rose-500 font-semibold">Rata-rata: {avgSusut}% susut</span>
        </div>

        <div className="bg-slate-950 text-white p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block relative z-10">Omset Kelompok (Selisih Timbangan)</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1 relative z-10">{formatRupiah(totalLossNominal)}</p>
          <span className="text-[11px] text-slate-300 relative z-10 font-mono">
            {formatKg(totalSelisih)} × {formatRupiah(pengaturan.hargaTbsDefault)}/kg
          </span>
        </div>
      </div>

      {/* Grid Comparison: Per PKS & Per Truk/Sopir Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Performance Per PKS Tujuan */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>Kinerja Selisih Per Pabrik Kelapa Sawit (PKS)</span>
            </h3>
          </div>

          <div className="space-y-3 pt-1">
            {pksStats.map((pks) => {
              const isHigh = pks.susutPersen > 2.0;
              return (
                <div key={pks.nama} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">{pks.nama}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{pks.rit} Pengiriman SPB</p>
                    </div>
                    <Badge variant={isHigh ? 'danger' : 'success'} size="sm" dot>
                      Susut: {pks.susutPersen}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-700/60 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Ram Kebun:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{formatKg(pks.ramKg)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">PKS Netto:</span>
                      <strong className="text-green-600 dark:text-green-400">{formatKg(pks.pksKg)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-sans">Selisih:</span>
                      <strong className={isHigh ? 'text-rose-600 dark:text-rose-400' : 'text-green-600 dark:text-green-400'}>-{pks.selisihKg} kg</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Performance Per Truk & Sopir */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>Audit Susut Per Armada Angkutan & Sopir</span>
            </h3>
          </div>

          <div className="space-y-3 pt-1">
            {trukStats.map((truk) => {
              const isHigh = truk.susutPersen > 2.0;
              return (
                <div key={truk.plat + truk.sopir} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs font-mono">{truk.plat}</h4>
                      <p className="text-[11px] text-slate-400">Sopir: {truk.sopir}</p>
                    </div>
                    <Badge variant={isHigh ? 'danger' : 'success'} size="sm" dot>
                      Susut: {truk.susutPersen}% ({truk.rit} Rit)
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-700/60 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Ram Kebun:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{formatKg(truk.ramKg)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">PKS Netto:</span>
                      <strong className="text-green-600 dark:text-green-400">{formatKg(truk.pksKg)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-sans">Selisih:</span>
                      <strong className={isHigh ? 'text-rose-600 dark:text-rose-400' : 'text-green-600 dark:text-green-400'}>-{truk.selisihKg} kg</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* High Loss Critical Audit Table Bento Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-rose-500/5 dark:bg-rose-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Daftar Pengiriman dengan Susut Tinggi (&gt; 2.0%)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Memerlukan evaluasi penyebab penyusutan (antrian timbang lama, sortasi ketat, atau kalibrasi ram).
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
            {highLossList.length} Transaksi Terindikasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-6">No. SPB / Tanggal</th>
                <th className="p-3.5">Petani & Lokasi</th>
                <th className="p-3.5">PKS & Truk</th>
                <th className="p-3.5 text-right">Ram Kebun</th>
                <th className="p-3.5 text-right">PKS Netto</th>
                <th className="p-3.5 text-right text-rose-600 dark:text-rose-400 font-bold">Selisih Susut</th>
                <th className="p-3.5 text-right">Persentase</th>
                <th className="p-3.5 pr-6">Catatan Investigasi / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {highLossList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-green-600 dark:text-green-400 font-bold">
                    ✓ Luar biasa! Tidak ada pengiriman yang melebihi ambang batas toleransi susut 2.0%.
                  </td>
                </tr>
              ) : (
                highLossList.map((item) => (
                  <tr key={item.id} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                    <td className="p-3.5 pl-6 font-mono font-bold text-slate-900 dark:text-white">
                      {item.noSpb}
                      <span className="block text-[11px] font-normal text-slate-400 font-sans">
                        {formatTanggalPendek(item.tanggal)}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{item.petaniNama}</p>
                      <p className="text-[11px] text-slate-400">{item.blokLahan}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-medium text-slate-900 dark:text-white">{item.namaPks}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{item.platTruk} ({item.namaSopir})</p>
                    </td>

                    <td className="p-3.5 text-right font-mono">
                      {formatKg(item.timbanganRamKg)}
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatKg(item.timbanganPksKg)}
                    </td>

                    <td className="p-3.5 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                      -{item.selisihKg} kg
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {item.persentaseSelisih}%
                    </td>

                    <td className="p-3.5 pr-6 text-slate-400 italic">
                      {item.catatan || 'Antrian pabrik melebihi batas waktu standar.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
