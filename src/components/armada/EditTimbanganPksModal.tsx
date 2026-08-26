import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { PanenRecord } from '../../types';
import { 
  Building2, 
  Scale, 
  Truck, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Calculator, 
  Save, 
  X,
  TrendingDown,
  Info
} from 'lucide-react';
import { formatRupiah, formatKg, formatTon, formatTanggalIndo, cn } from '../../lib/utils';

interface EditTimbanganPksModalProps {
  isOpen: boolean;
  onClose: () => void;
  armadaGroup: {
    id: string;
    platTruk: string;
    namaSopir: string;
    namaPks: string;
    tanggal: string;
    panenRecords: PanenRecord[];
    totalDimuatKg: number;
    totalPksKg: number;
  } | null;
  focusedPanenId?: string | null;
}

interface FarmerPksInput {
  recordId: string;
  petaniNama: string;
  blokLahan: string;
  noSpb: string;
  timbanganRamKg: number;
  timbanganPksKg: number;
  proporsiPersen: number;
  hargaTbsPerKg: number;
  potonganPedaranKg: number;
  potonganIuranKasRupiah: number;
  upahPemanenRupiah: number;
  kasbonPupukRupiah: number;
  statusPembayaran: 'Lunas' | 'Siap Bayar' | 'Draft';
}

export const EditTimbanganPksModal: React.FC<EditTimbanganPksModalProps> = ({
  isOpen,
  onClose,
  armadaGroup,
  focusedPanenId,
}) => {
  const { updatePanen, pengaturan } = useApp();

  const [namaPks, setNamaPks] = useState<string>('');
  const [totalPksTrukKg, setTotalPksTrukKg] = useState<number>(0);
  const [hargaSeragamPks, setHargaSeragamPks] = useState<number>(2450);
  const [statusSeragam, setStatusSeragam] = useState<'Lunas' | 'Siap Bayar' | 'Draft'>('Siap Bayar');
  const [catatanTimbang, setCatatanTimbang] = useState<string>('');
  const [farmerInputs, setFarmerInputs] = useState<FarmerPksInput[]>([]);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  const [autoDistribute, setAutoDistribute] = useState<boolean>(true);

  // Helper function to distribute total PKS tonnage to all farmers proportionally
  const distributePksWeight = (
    totalPks: number, 
    price: number, 
    baseInputs: FarmerPksInput[], 
    totalKebun: number
  ): FarmerPksInput[] => {
    if (totalKebun <= 0 || baseInputs.length === 0) return baseInputs;
    
    let accumulated = 0;
    const count = baseInputs.length;

    return baseInputs.map((item, idx) => {
      const proporsi = item.timbanganRamKg / totalKebun;
      const proporsiPersen = Number((proporsi * 100).toFixed(2));
      
      let allocatedPks = 0;
      if (idx === count - 1) {
        // Last farmer takes remainder to ensure exact sum matches totalPks
        allocatedPks = Math.max(0, Math.round(totalPks - accumulated));
      } else {
        allocatedPks = Math.round(totalPks * proporsi);
        accumulated += allocatedPks;
      }

      return {
        ...item,
        proporsiPersen,
        timbanganPksKg: totalPks > 0 ? allocatedPks : item.timbanganRamKg,
        hargaTbsPerKg: price > 0 ? price : item.hargaTbsPerKg,
      };
    });
  };

  // Initialize data when armadaGroup changes
  useEffect(() => {
    if (armadaGroup && isOpen) {
      setNamaPks(armadaGroup.namaPks || 'PKS Agro Mandiri Tapung');
      const initialTotalPks = armadaGroup.totalPksKg > 0 ? armadaGroup.totalPksKg : armadaGroup.totalDimuatKg;
      setTotalPksTrukKg(initialTotalPks);
      
      const firstRecord = armadaGroup.panenRecords[0];
      const initialPrice = firstRecord ? firstRecord.hargaTbsPerKg : (pengaturan.hargaTbsDefault || 2450);
      setHargaSeragamPks(initialPrice);
      setStatusSeragam(firstRecord ? firstRecord.statusPembayaran : 'Siap Bayar');
      setCatatanTimbang(firstRecord?.catatan || '');

      const totalKebun = armadaGroup.totalDimuatKg;
      const initialInputs: FarmerPksInput[] = armadaGroup.panenRecords.map(rec => {
        const ramKg = rec.timbanganRamKg > 0 ? rec.timbanganRamKg : rec.timbanganPksKg;
        const proporsi = totalKebun > 0 ? (ramKg / totalKebun) * 100 : 0;
        return {
          recordId: rec.id,
          petaniNama: rec.petaniNama,
          blokLahan: rec.blokLahan,
          noSpb: rec.noSpb,
          timbanganRamKg: ramKg,
          timbanganPksKg: rec.timbanganPksKg > 0 ? rec.timbanganPksKg : ramKg,
          proporsiPersen: Number(proporsi.toFixed(2)),
          hargaTbsPerKg: rec.hargaTbsPerKg || pengaturan.hargaTbsDefault || 2450,
          potonganPedaranKg: rec.potonganPedaranKg || 0,
          potonganIuranKasRupiah: rec.potonganIuranKasRupiah,
          upahPemanenRupiah: rec.upahPemanenRupiah,
          kasbonPupukRupiah: rec.kasbonPupukRupiah || 0,
          statusPembayaran: rec.statusPembayaran,
        };
      });

      // Distribute from total PKS if already set
      if (initialTotalPks > 0 && totalKebun > 0) {
        setFarmerInputs(distributePksWeight(initialTotalPks, initialPrice, initialInputs, totalKebun));
      } else {
        setFarmerInputs(initialInputs);
      }

      setIsSavedSuccess(false);
    }
  }, [armadaGroup, isOpen, pengaturan]);

  if (!armadaGroup) return null;

  // Handle total truckload PKS weight change
  const handleTotalPksChange = (newTotalPks: number) => {
    setTotalPksTrukKg(newTotalPks);
    if (autoDistribute && armadaGroup.totalDimuatKg > 0) {
      setFarmerInputs(prev => distributePksWeight(newTotalPks, hargaSeragamPks, prev, armadaGroup.totalDimuatKg));
    }
  };

  // Handle uniform price change
  const handleUniformPriceChange = (newPrice: number) => {
    setHargaSeragamPks(newPrice);
    setFarmerInputs(prev => prev.map(item => ({
      ...item,
      hargaTbsPerKg: newPrice > 0 ? newPrice : item.hargaTbsPerKg,
    })));
  };

  // Handle single farmer input change
  const handleFarmerInputChange = (index: number, field: keyof FarmerPksInput, value: any) => {
    setFarmerInputs(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // Auto distribute trigger
  const handleDistributeProportionally = () => {
    if (totalPksTrukKg <= 0 || armadaGroup.totalDimuatKg <= 0) return;
    setFarmerInputs(prev => distributePksWeight(totalPksTrukKg, hargaSeragamPks, prev, armadaGroup.totalDimuatKg));
  };

  // Apply uniform status to all farmers in this truck
  const handleApplyUniformStatus = (status: 'Lunas' | 'Siap Bayar' | 'Draft') => {
    setStatusSeragam(status);
    setFarmerInputs(prev => prev.map(item => ({
      ...item,
      statusPembayaran: status,
    })));
  };

  // Calculate live totals for the modal
  const sumDimuatKg = farmerInputs.reduce((sum, item) => sum + item.timbanganRamKg, 0);
  const sumPksKg = farmerInputs.reduce((sum, item) => sum + item.timbanganPksKg, 0);
  const sumSelisihKg = Math.max(0, sumDimuatKg - sumPksKg);
  const susutPersen = sumDimuatKg > 0 ? Number(((sumSelisihKg / sumDimuatKg) * 100).toFixed(2)) : 0;
  
  const sumBruto = farmerInputs.reduce((sum, item) => sum + (item.timbanganPksKg * item.hargaTbsPerKg), 0);

  // Submit and save updates to AppContext
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    farmerInputs.forEach(item => {
      const originalRecord = armadaGroup.panenRecords.find(r => r.id === item.recordId);
      if (originalRecord) {
        updatePanen(item.recordId, {
          timbanganPksKg: item.timbanganPksKg,
          hargaTbsPerKg: item.hargaTbsPerKg,
          potonganPedaranKg: item.potonganPedaranKg,
          namaPks: namaPks,
          statusPembayaran: item.statusPembayaran,
          catatan: catatanTimbang ? `${catatanTimbang} (Total Muatan PKS: ${formatKg(totalPksTrukKg)} - Porsi Petani: ${formatKg(item.timbanganPksKg)})` : originalRecord.catatan,
        });
      }
    });

    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Input Timbangan PKS (Jumlah Total Muatan Truk)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tonase timbangan PKS dicatat per total muatan rit {armadaGroup.platTruk} & dialokasikan proporsional ke petani
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Armada Trip Summary Header */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                  {armadaGroup.platTruk}
                </span>
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-bold">
                  Sopir: {armadaGroup.namaSopir}
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded font-bold">
                  {farmerInputs.length} Petani Terangkut
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Tanggal Rit: <strong>{formatTanggalIndo(armadaGroup.tanggal)}</strong></span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span>PKS: <strong>{namaPks}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Muatan Kebun</span>
              <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatKg(sumDimuatKg)}
              </strong>
            </div>
            <div className="w-px h-7 bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Total Netto PKS</span>
              <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatKg(sumPksKg)}
              </strong>
            </div>
            <div className="w-px h-7 bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600 block">Susut Jalan</span>
              <strong className="text-sm font-bold text-amber-600 font-mono">
                -{formatKg(sumSelisihKg)} ({susutPersen}%)
              </strong>
            </div>
          </div>
        </div>

        {/* Section 1: Main Total PKS Load Input */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 p-4 sm:p-5 rounded-2xl border border-emerald-300/80 dark:border-emerald-700/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Tonase Netto Tiket PKS (Jumlah Total Muatan Truk)</span>
              </h4>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-400 mt-0.5">
                Masukkan berat netto satu truk dari slip/tiket jembatan timbang PKS. Nilai ini otomatis didistribusikan ke seluruh petani secara proporsional.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 cursor-pointer bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700">
                <input 
                  type="checkbox"
                  checked={autoDistribute}
                  onChange={(e) => setAutoDistribute(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Auto-Proporsional</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-300 dark:border-emerald-700/70 shadow-xs">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Total Netto Tiket PKS (Kg) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={totalPksTrukKg || ''}
                  onChange={(e) => handleTotalPksChange(Number(e.target.value))}
                  placeholder="Contoh: 8520"
                  className="w-full px-3 py-2 bg-emerald-50/40 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-600 rounded-lg text-lg font-mono font-black text-emerald-950 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-700 dark:text-emerald-400 font-bold">Kg TBS</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Total Muatan Kebun: {formatKg(armadaGroup.totalDimuatKg)}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Harga TBS Pabrik (Rp/Kg) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={hargaSeragamPks || ''}
                  onChange={(e) => handleUniformPriceChange(Number(e.target.value))}
                  placeholder="2450"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-lg font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">/Kg</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Diterapkan seragam ke seluruh muatan rit ini
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Kalkulasi Susut Muatan Rit
                </span>
                <p className="text-base font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                  -{formatKg(sumSelisihKg)} ({susutPersen}%)
                </p>
              </div>
              <button
                type="button"
                onClick={handleDistributeProportionally}
                className="w-full mt-2 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Hitung Ulang Alokasi Petani</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Detail Alokasi Proporsional Tiap Petani */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Alokasi Proporsional Hasil Timbangan PKS Tiap Petani</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Formula: (Muat Kebun ÷ Total Muat Truk) × Total Netto PKS. Hasil pembagian adil & tepat 100% sama dengan total tiket PKS.
              </p>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              {farmerInputs.length} SPB Terdaftar
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 pl-4">No. SPB & Petani</th>
                    <th className="p-3 text-right">Muat Kebun (Kg)</th>
                    <th className="p-3 text-center">Porsi (%)</th>
                    <th className="p-3 w-36 text-center">Alokasi PKS (Kg) *</th>
                    <th className="p-3 w-28 text-center">Harga (Rp)</th>
                    <th className="p-3 w-24 text-center">Sortasi (Kg)</th>
                    <th className="p-3 text-right">Susut Porsi</th>
                    <th className="p-3 pr-4 text-right">Nilai Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {farmerInputs.map((input, idx) => {
                    const isFocused = focusedPanenId === input.recordId;
                    const farmerSelisih = Math.max(0, input.timbanganRamKg - input.timbanganPksKg);
                    const farmerSusutPersen = input.timbanganRamKg > 0 
                      ? ((farmerSelisih / input.timbanganRamKg) * 100).toFixed(1) 
                      : '0.0';
                    const farmerBruto = input.timbanganPksKg * input.hargaTbsPerKg;

                    return (
                      <tr 
                        key={input.recordId} 
                        className={cn(
                          "transition-colors",
                          isFocused 
                            ? "bg-emerald-50/70 dark:bg-emerald-950/40" 
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        )}
                      >
                        <td className="p-3 pl-4">
                          <p className="font-bold text-slate-900 dark:text-white">{input.petaniNama}</p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <span className="font-mono">{input.noSpb}</span>
                            <span>•</span>
                            <span>{input.blokLahan}</span>
                          </div>
                        </td>

                        <td className="p-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {formatKg(input.timbanganRamKg)}
                        </td>

                        <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-[11px]">
                            {input.proporsiPersen}%
                          </span>
                        </td>

                        <td className="p-2 text-center">
                          <input
                            type="number"
                            value={input.timbanganPksKg || ''}
                            onChange={(e) => handleFarmerInputChange(idx, 'timbanganPksKg', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-lg text-sm font-mono font-bold text-emerald-900 dark:text-emerald-200 text-right focus:ring-2 focus:ring-emerald-500"
                            placeholder="0"
                            required
                          />
                        </td>

                        <td className="p-2 text-center">
                          <input
                            type="number"
                            value={input.hargaTbsPerKg || ''}
                            onChange={(e) => handleFarmerInputChange(idx, 'hargaTbsPerKg', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-semibold text-slate-900 dark:text-white text-right"
                            placeholder="2450"
                            required
                          />
                        </td>

                        <td className="p-2 text-center">
                          <input
                            type="number"
                            value={input.potonganPedaranKg || ''}
                            onChange={(e) => handleFarmerInputChange(idx, 'potonganPedaranKg', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white text-right"
                            placeholder="0"
                          />
                        </td>

                        <td className="p-3 text-right font-mono">
                          <span className={cn(
                            "font-bold text-xs",
                            farmerSelisih > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"
                          )}>
                            -{formatKg(farmerSelisih)}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            ({farmerSusutPersen}%)
                          </span>
                        </td>

                        <td className="p-3 pr-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(farmerBruto)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 3: Info PKS, Status & Catatan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pabrik Kelapa Sawit (PKS) Tujuan
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={namaPks}
                onChange={(e) => setNamaPks(e.target.value)}
                placeholder="Contoh: PKS Agro Mandiri Tapung"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status Pembayaran Muatan
            </label>
            <select
              value={statusSeragam}
              onChange={(e) => handleApplyUniformStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="Siap Bayar">Siap Bayar (Selesai Timbang PKS)</option>
              <option value="Lunas">Lunas (Sudah Ditransfer)</option>
              <option value="Draft">Draft (Dalam Verifikasi)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No. Tiket / Catatan Timbangan Pabrik
            </label>
            <input
              type="text"
              value={catatanTimbang}
              onChange={(e) => setCatatanTimbang(e.target.value)}
              placeholder="Contoh: Tiket PKS No. 9812/PKS-AM"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Live Calculation Summary Banner */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Kebun</span>
              <strong className="text-sm font-mono text-white">{formatKg(sumDimuatKg)}</strong>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 block uppercase font-bold">Total PKS Netto</span>
              <strong className="text-sm font-mono text-emerald-400">{formatKg(sumPksKg)}</strong>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 block uppercase font-bold">Susut Pengangkutan</span>
              <strong className="text-sm font-mono text-amber-400">-{formatKg(sumSelisihKg)} ({susutPersen}%)</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Nilai Bruto</span>
              <strong className="text-sm font-mono text-white">{formatRupiah(sumBruto)}</strong>
            </div>
          </div>

          {isSavedSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Timbangan Berhasil Disimpan!</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Hasil Timbangan Pabrik</span>
          </button>
        </div>

      </form>
    </Modal>
  );
};
