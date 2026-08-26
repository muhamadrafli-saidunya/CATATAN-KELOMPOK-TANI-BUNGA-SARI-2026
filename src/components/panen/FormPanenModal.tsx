import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { PanenRecord, ArmadaTruk } from '../../types';
import { formatRupiah, formatNumber, formatKg, formatTanggalPendek, formatTanggalIndo } from '../../lib/utils';
import { 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  Truck, 
  Plus, 
  RotateCcw, 
  History, 
  TrendingUp, 
  ArrowRight,
  Info
} from 'lucide-react';
import { FormArmadaModal } from '../armada/FormArmadaModal';

interface FormPanenModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecord?: PanenRecord | null;
  editingRecord?: PanenRecord | null;
}

export const FormPanenModal: React.FC<FormPanenModalProps> = ({
  isOpen,
  onClose,
  initialRecord,
  editingRecord,
}) => {
  const { panenList, petaniList, armadaList, pengaturan, pinjamanList, addPanen, updatePanen } = useApp();

  const activeRecord = initialRecord || editingRecord || null;
  const isEdit = !!activeRecord;

  // Form States
  const [petaniId, setPetaniId] = useState<string>(petaniList[0]?.id || '');
  const [tanggal, setTanggal] = useState<string>(pengaturan.tanggalPanenDefault || new Date().toISOString().split('T')[0]);
  const [blokLahan, setBlokLahan] = useState<string>('');
  const [timbanganKg, setTimbanganKg] = useState<number>(5000);
  const [hargaTbsPerKg, setHargaTbsPerKg] = useState<number>(pengaturan.hargaTbsDefault || 2780);
  const [potonganPedaranKg, setPotonganPedaranKg] = useState<number>(0);
  const [tarifIuranKasPerKg, setTarifIuranKasPerKg] = useState<number>(pengaturan.tarifIuranKasPerKg || 0);
  const [tarifUpahPanenPerKg, setTarifUpahPanenPerKg] = useState<number>(pengaturan.tarifUpahPanenPerKg || 0);
  const [kasbonPupukRupiah, setKasbonPupukRupiah] = useState<number>(0);
  const [namaPks, setNamaPks] = useState<string>('PKS Agro Mandiri Tapung');
  const [selectedArmadaId, setSelectedArmadaId] = useState<string>('');
  const [platTruk, setPlatTruk] = useState<string>('BM 8412 TA');
  const [namaSopir, setNamaSopir] = useState<string>('Pak Eko (Truk 01)');
  const [namaPemanen, setNamaPemanen] = useState<string>('Regu Panen Pak Yanto');
  const [statusPembayaran, setStatusPembayaran] = useState<'Lunas' | 'Siap Bayar' | 'Draft'>('Siap Bayar');
  const [catatan, setCatatan] = useState<string>('');
  const [isAddArmadaOpen, setIsAddArmadaOpen] = useState<boolean>(false);

  // Selected Petani details & loans
  const selectedPetani = petaniList.find(p => p.id === petaniId);
  const activePinjaman = pinjamanList.find(p => p.petaniId === petaniId && p.status === 'Aktif');

  // Find previous harvest in history for this farmer (excluding current editing record)
  const previousFarmerHarvest = useMemo(() => {
    return panenList.find(p => p.petaniId === petaniId && p.id !== activeRecord?.id);
  }, [panenList, petaniId, activeRecord]);

  // Sync initial data when modal opens or edits
  useEffect(() => {
    if (activeRecord) {
      setPetaniId(activeRecord.petaniId);
      setTanggal(activeRecord.tanggal);
      setBlokLahan(activeRecord.blokLahan);
      const bobot = activeRecord.timbanganRamKg || activeRecord.timbanganPksKg || 0;
      setTimbanganKg(bobot);
      setHargaTbsPerKg(activeRecord.hargaTbsPerKg);
      setPotonganPedaranKg(activeRecord.potonganPedaranKg);
      setTarifIuranKasPerKg(
        bobot > 0 
          ? Math.round(activeRecord.potonganIuranKasRupiah / bobot) 
          : (pengaturan.tarifIuranKasPerKg || 0)
      );
      setTarifUpahPanenPerKg(
        bobot > 0 
          ? Math.round(activeRecord.upahPemanenRupiah / bobot) 
          : (pengaturan.tarifUpahPanenPerKg || 0)
      );
      setKasbonPupukRupiah(activeRecord.kasbonPupukRupiah);
      setNamaPks(activeRecord.namaPks);
      setPlatTruk(activeRecord.platTruk);
      setNamaSopir(activeRecord.namaSopir);
      setNamaPemanen(activeRecord.namaPemanen);
      setStatusPembayaran(activeRecord.statusPembayaran);
      setCatatan(activeRecord.catatan || '');

      // Match armada if exists
      const match = armadaList.find(a => a.platNomor.toLowerCase() === activeRecord.platTruk.toLowerCase());
      if (match) {
        setSelectedArmadaId(match.id);
      } else {
        setSelectedArmadaId('custom');
      }
    } else {
      // Default new
      const defaultPetani = petaniList[0];
      if (defaultPetani) {
        setPetaniId(defaultPetani.id);
        setBlokLahan(defaultPetani.blokLahan);
        const pinjam = pinjamanList.find(p => p.petaniId === defaultPetani.id && p.status === 'Aktif');
        setKasbonPupukRupiah(pinjam ? pinjam.potonganPerPanen : 0);
      }
      setTanggal(pengaturan.tanggalPanenDefault || new Date().toISOString().split('T')[0]);
      setTimbanganKg(5000);
      setHargaTbsPerKg(pengaturan.hargaTbsDefault || 2780);
      setPotonganPedaranKg(0);
      setTarifIuranKasPerKg(pengaturan.tarifIuranKasPerKg || 0);
      setTarifUpahPanenPerKg(pengaturan.tarifUpahPanenPerKg || 0);
      setStatusPembayaran('Siap Bayar');
      setCatatan('');

      // Default to first active armada if available
      const defaultArmada = armadaList.find(a => a.status === 'Aktif') || armadaList[0];
      if (defaultArmada) {
        setSelectedArmadaId(defaultArmada.id);
        setPlatTruk(defaultArmada.platNomor);
        setNamaSopir(defaultArmada.namaSopir);
        if (defaultArmada.pksLangganan) {
          setNamaPks(defaultArmada.pksLangganan);
        }
      } else {
        setSelectedArmadaId('custom');
        setPlatTruk('BM 8412 TA');
        setNamaSopir('Pak Eko (Truk 01)');
      }
    }
  }, [activeRecord, isOpen, petaniList, armadaList, pengaturan, pinjamanList]);

  // Handle armada selector change
  const handleArmadaChange = (armadaId: string) => {
    setSelectedArmadaId(armadaId);
    if (armadaId === 'custom') {
      return;
    }
    const chosen = armadaList.find(a => a.id === armadaId);
    if (chosen) {
      setPlatTruk(chosen.platNomor);
      setNamaSopir(chosen.namaSopir);
      if (chosen.pksLangganan) {
        setNamaPks(chosen.pksLangganan);
      }
    }
  };

  const handleArmadaCreated = (newArmada: ArmadaTruk) => {
    setSelectedArmadaId(newArmada.id);
    setPlatTruk(newArmada.platNomor);
    setNamaSopir(newArmada.namaSopir);
    if (newArmada.pksLangganan) {
      setNamaPks(newArmada.pksLangganan);
    }
  };

  // When farmer changes in new record form, update blok and auto-load kasbon installment
  const handlePetaniChange = (newId: string) => {
    setPetaniId(newId);
    const pet = petaniList.find(p => p.id === newId);
    if (pet) {
      setBlokLahan(pet.blokLahan);
    }
    const pinjam = pinjamanList.find(p => p.petaniId === newId && p.status === 'Aktif');
    if (pinjam) {
      setKasbonPupukRupiah(pinjam.potonganPerPanen);
    } else {
      setKasbonPupukRupiah(0);
    }
  };

  // Previous recorded values when in edit mode
  const originalRamKg = activeRecord?.timbanganRamKg ?? (activeRecord?.timbanganPksKg ?? 0);
  const diffFromOriginal = isEdit ? (timbanganKg - originalRamKg) : 0;

  // Real-time calculations
  const totalBruto = (timbanganKg || 0) * (hargaTbsPerKg || 0);
  const potonganPedaranRupiah = (potonganPedaranKg || 0) * (hargaTbsPerKg || 0);
  const potonganIuranKasRupiah = (timbanganKg || 0) * (tarifIuranKasPerKg || 0);
  const upahPemanenRupiah = (timbanganKg || 0) * (tarifUpahPanenPerKg || 0);
  const totalPotongan = potonganPedaranRupiah + potonganIuranKasRupiah + upahPemanenRupiah + (kasbonPupukRupiah || 0);
  // Netto Petani: Perkalian Timbangan Kebun dengan Harga TBS
  const totalNetto = (timbanganKg || 0) * (hargaTbsPerKg || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetani) return;

    // In edit mode: if PKS weight existed and Ram weight wasn't equal to PKS originally, keep PKS or adjust
    let pksWeight = Number(timbanganKg);
    if (isEdit && activeRecord) {
      if (activeRecord.timbanganPksKg > 0 && activeRecord.timbanganPksKg !== activeRecord.timbanganRamKg) {
        // If Ram changed, adjust PKS proportionally or keep previous PKS
        if (originalRamKg > 0 && originalRamKg !== Number(timbanganKg)) {
          const ratio = activeRecord.timbanganPksKg / originalRamKg;
          pksWeight = Math.round(Number(timbanganKg) * ratio);
        } else {
          pksWeight = activeRecord.timbanganPksKg;
        }
      }
    }

    const payload = {
      tanggal,
      petaniId,
      petaniNama: selectedPetani.nama,
      blokLahan: blokLahan || selectedPetani.blokLahan,
      timbanganRamKg: Number(timbanganKg),
      timbanganPksKg: pksWeight,
      hargaTbsPerKg: Number(hargaTbsPerKg),
      potonganPedaranKg: Number(potonganPedaranKg),
      potonganIuranKasRupiah: Number(potonganIuranKasRupiah),
      upahPemanenRupiah: Number(upahPemanenRupiah),
      kasbonPupukRupiah: Number(kasbonPupukRupiah),
      namaPks,
      platTruk,
      namaSopir,
      namaPemanen,
      statusPembayaran,
      catatan,
    };

    if (isEdit && activeRecord) {
      updatePanen(activeRecord.id, payload);
    } else {
      addPanen(payload);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#00AA13]" />
          <span>{isEdit ? `Edit Catatan Panen & Penimbangan (${activeRecord?.noSpb})` : 'Input Catatan Panen & SPB Baru'}</span>
        </div>
      }
      description="Formulir resmi penimbangan buah sawit TBS, penetapan harga, dan potongan otomatis."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Data Sebelumnya Jika Mode Edit */}
        {isEdit && activeRecord && (
          <div className="p-4 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Angka Timbangan & Nilai Tercatat Sebelumnya ({activeRecord.noSpb})</span>
              </div>
              {diffFromOriginal !== 0 && (
                <button
                  type="button"
                  onClick={() => setTimbanganKg(originalRamKg)}
                  className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pulihkan ke {formatKg(originalRamKg)}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Timbangan Kebun (Lama)</span>
                <strong className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {formatKg(originalRamKg)}
                </strong>
              </div>

              <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Harga TBS Awal</span>
                <strong className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {formatRupiah(activeRecord.hargaTbsPerKg)}
                </strong>
              </div>

              <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200/60 dark:border-amber-900/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Netto Petani Awal</span>
                <strong className="text-sm font-bold text-[#00AA13] font-mono">
                  {formatRupiah(activeRecord.totalNetto)}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Informasi Petani & Lahan */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00AA13]" />
            1. Data Petani & Asal Buah
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nama Petani Anggota *
              </label>
              <select
                value={petaniId}
                onChange={(e) => handlePetaniChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#00AA13] focus:border-transparent text-gray-900 dark:text-white font-medium"
                required
              >
                {petaniList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} — ({p.blokLahan})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tanggal Panen / SPB *
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#00AA13] text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Blok Lahan Kebun
              </label>
              <input
                type="text"
                value={blokLahan}
                onChange={(e) => setBlokLahan(e.target.value)}
                placeholder="Contoh: Blok A-01 (Kavling Utama)"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#00AA13] text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Data Tonase & Harga TBS */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#00AA13]" />
              2. Berat Timbangan Kebun & Harga TBS
            </h4>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100/90 dark:bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
              Acuan Pembayaran Petani
            </span>
          </div>

          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-950 dark:text-emerald-200">
            <Scale className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>
              <strong>Acuan Pembayaran:</strong> Berat <strong>Timbangan Kebun / Ram Petani</strong> ini dijadikan dasar acuan resmi perhitungan hak penerimaan kotor (Bruto) dan bersih (Netto) petani.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  Berat Timbangan Kebun / Ram (Kg) * <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">[Acuan Bayar]</span>
                </label>
                {/* Visual Pill Timbangan Sebelumnya */}
                {isEdit && (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md font-mono">
                    Sebelumnya: {formatKg(originalRamKg)}
                  </span>
                )}
              </div>
              
              <div className="relative">
                <input
                  type="number"
                  value={timbanganKg === 0 ? '' : timbanganKg}
                  onChange={(e) => setTimbanganKg(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="Contoh: 5000"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-base font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00AA13]"
                  required
                />
              </div>

              {/* Status Perubahan Timbangan */}
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-gray-500 dark:text-gray-400 font-mono">
                  {formatKg(timbanganKg)} (Basis timbangan kebun)
                </span>

                {isEdit && diffFromOriginal !== 0 && (
                  <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                    diffFromOriginal > 0 
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60' 
                      : 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60'
                  }`}>
                    {diffFromOriginal > 0 ? `+${formatKg(diffFromOriginal)}` : formatKg(diffFromOriginal)} dari awal
                  </span>
                )}
              </div>

              {/* Info Timbangan Panen Terakhir Petani (Riwayat Historis) */}
              {previousFarmerHarvest && (
                <div className="mt-2 p-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Panen Lalu ({formatTanggalPendek(previousFarmerHarvest.tanggal)}): <strong>{formatKg(previousFarmerHarvest.timbanganRamKg || previousFarmerHarvest.timbanganPksKg)}</strong>
                    </span>
                  </div>
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={() => setTimbanganKg(previousFarmerHarvest.timbanganRamKg || previousFarmerHarvest.timbanganPksKg)}
                      className="text-[10px] underline font-bold hover:text-emerald-700"
                    >
                      Gunakan
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Harga TBS (Rp/Kg) *
                </label>
                {isEdit && activeRecord && (
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                    Awal: {formatRupiah(activeRecord.hargaTbsPerKg)}
                  </span>
                )}
              </div>
              <input
                type="number"
                value={hargaTbsPerKg === 0 ? '' : hargaTbsPerKg}
                onChange={(e) => setHargaTbsPerKg(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="Bisa diisi nominal berapapun"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-base font-bold text-[#00AA13] focus:ring-2 focus:ring-[#00AA13]"
                required
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block font-mono">
                {formatRupiah(hargaTbsPerKg)} / kg
              </span>
            </div>
          </div>

          {/* Subtotal Kalkulasi Hasil */}
          <div className="flex items-center justify-between p-3.5 bg-white dark:bg-gray-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block text-[11px]">Tonase Bersih:</span>
              <strong className="text-sm font-bold text-gray-900 dark:text-white">
                {formatKg(timbanganKg)}
              </strong>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block text-[11px]">Harga Satuan:</span>
              <strong className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {formatRupiah(hargaTbsPerKg)}/kg
              </strong>
            </div>
            <div className="text-right">
              <span className="text-gray-500 dark:text-gray-400 block text-[11px]">Total Bruto:</span>
              <strong className="text-base font-black text-[#00AA13]">
                {formatRupiah(totalBruto)}
              </strong>
            </div>
          </div>
        </div>

        {/* Section 3: Rincian Potongan & Pedaran */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            3. Rincian Potongan, Upah & Pedaran
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Potongan Pedaran / Sampah (Kg)
              </label>
              <input
                type="number"
                min="0"
                value={potonganPedaranKg}
                onChange={(e) => setPotonganPedaranKg(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                = {formatRupiah(potonganPedaranRupiah)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tarif Iuran Kas (Rp/Kg)
              </label>
              <input
                type="number"
                min="0"
                value={tarifIuranKasPerKg}
                onChange={(e) => setTarifIuranKasPerKg(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                = {formatRupiah(potonganIuranKasRupiah)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tarif Upah Panen (Rp/Kg)
              </label>
              <input
                type="number"
                min="0"
                value={tarifUpahPanenPerKg}
                onChange={(e) => setTarifUpahPanenPerKg(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                = {formatRupiah(upahPemanenRupiah)}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Potong Kasbon Pupuk (Rp)
                </label>
                {activePinjaman && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    Sisa: {formatRupiah(activePinjaman.sisaPinjaman)}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="50000"
                value={kasbonPupukRupiah}
                onChange={(e) => setKasbonPupukRupiah(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white font-semibold"
              />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                {formatRupiah(kasbonPupukRupiah)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Logistik, Armada Truk, Status & Catatan */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600" />
              4. Logistik Pengangkutan & PKS Tujuan
            </h4>
            <button
              type="button"
              onClick={() => setIsAddArmadaOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Armada Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Pilihan Armada Master */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Pilih Armada Truk Terdaftar *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-3">
                  <select
                    value={selectedArmadaId}
                    onChange={(e) => handleArmadaChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <optgroup label="Daftar Armada Master Kelompok">
                      {armadaList.map((a) => (
                        <option key={a.id} value={a.id}>
                          🚛 {a.platNomor} - {a.namaSopir} ({a.kapasitasTon} Ton) {a.status !== 'Aktif' ? `[${a.status}]` : ''}
                        </option>
                      ))}
                    </optgroup>
                    <option value="custom">✏️ Input Manual / Truk Luar</option>
                  </select>
                </div>
                <div className="sm:col-span-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsAddArmadaOpen(true)}
                    className="w-full h-full py-2 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Daftar Truk Baru</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nomor Plat Truk
              </label>
              <input
                type="text"
                value={platTruk}
                onChange={(e) => {
                  setPlatTruk(e.target.value.toUpperCase());
                  setSelectedArmadaId('custom');
                }}
                placeholder="Contoh: BM 8412 TA"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-mono font-bold text-gray-900 dark:text-white uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nama Sopir / Driver
              </label>
              <input
                type="text"
                value={namaSopir}
                onChange={(e) => {
                  setNamaSopir(e.target.value);
                  setSelectedArmadaId('custom');
                }}
                placeholder="Contoh: Pak Eko"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                PKS Tujuan
              </label>
              <input
                type="text"
                value={namaPks}
                onChange={(e) => setNamaPks(e.target.value)}
                placeholder="Contoh: PKS Agro Mandiri Tapung"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nama Pemanen / Tukang Egrek
              </label>
              <input
                type="text"
                value={namaPemanen}
                onChange={(e) => setNamaPemanen(e.target.value)}
                placeholder="Contoh: Regu Panen Pak Yanto"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Status Pembayaran
              </label>
              <select
                value={statusPembayaran}
                onChange={(e) => setStatusPembayaran(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white"
              >
                <option value="Siap Bayar">Siap Bayar (Menunggu Transfer)</option>
                <option value="Lunas">Lunas (Sudah Ditransfer)</option>
                <option value="Draft">Draft (Belum Verifikasi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Catatan Khusus / Sortasi Buah
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Buah super, sortasi minimal, antrian timbang lancar"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Calculation Summary Box (Final Result) */}
        <div className="bg-gray-900 text-white p-5 rounded-2xl shadow-lg border border-gray-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-800 pb-2">
            <span>Total Hasil Bruto: <strong className="text-white">{formatRupiah(totalBruto)}</strong></span>
            <span>Total Semua Potongan: <strong className="text-rose-400">- {formatRupiah(totalPotongan)}</strong></span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#00AA13] font-semibold uppercase tracking-wider">
                Total Netto Petani (Timbangan Kebun × Harga TBS)
              </p>
              <p className="text-2xl font-black text-white mt-0.5">
                {formatRupiah(totalNetto)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Harga TBS per Kg:</span>
              <span className="text-sm font-bold text-gray-200">
                {formatRupiah(hargaTbsPerKg)} / kg
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#00AA13] hover:bg-[#00880D] active:scale-95 transition-all shadow-md shadow-[#00AA13]/30 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Data Panen'}</span>
          </button>
        </div>
      </form>

      {/* Quick Add Armada Modal */}
      <FormArmadaModal
        isOpen={isAddArmadaOpen}
        onClose={() => setIsAddArmadaOpen(false)}
        onSaved={handleArmadaCreated}
      />
    </Modal>
  );
};

