import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { ArmadaTruk } from '../../types';
import { Truck, CheckCircle2, AlertCircle, Phone, User, ShieldCheck, Gauge, Building } from 'lucide-react';

interface FormArmadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialArmada?: ArmadaTruk | null;
  onSaved?: (saved: ArmadaTruk) => void;
}

const JENIS_KENDARAAN_OPTIONS = [
  'Mitsubishi Colt Diesel Canter (6 Roda)',
  'Isuzu Elf Giga NMR 71 (6 Roda)',
  'Hino Dutro Dump Truk HD',
  'Mitsubishi Fuso Fighter (6 Roda Long)',
  'Toyota Dyna Rino 130HT',
  'Colt Diesel 120PS (Standard)',
  'Truk Tronton / 10 Roda',
  'Lainnya / Custom',
];

const PKS_DEFAULT_OPTIONS = [
  'PKS Agro Mandiri Tapung',
  'PKS Sawit Riau Makmur',
  'PKS PT. Sawit Sejahtera',
  'PKS Sumber Sawit Nusantara',
  'PKS Berlian Inti Mekar',
];

export const FormArmadaModal: React.FC<FormArmadaModalProps> = ({
  isOpen,
  onClose,
  initialArmada,
  onSaved,
}) => {
  const { addArmada, updateArmada } = useApp();

  const isEdit = !!initialArmada;

  const [platNomor, setPlatNomor] = useState('');
  const [namaSopir, setNamaSopir] = useState('');
  const [noHpSopir, setNoHpSopir] = useState('');
  const [jenisKendaraan, setJenisKendaraan] = useState(JENIS_KENDARAAN_OPTIONS[0]);
  const [customJenis, setCustomJenis] = useState('');
  const [kapasitasTon, setKapasitasTon] = useState<number>(8.0);
  const [pksLangganan, setPksLangganan] = useState(PKS_DEFAULT_OPTIONS[0]);
  const [customPks, setCustomPks] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Perbaikan' | 'Nonaktif'>('Aktif');
  const [catatan, setCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialArmada) {
      setPlatNomor(initialArmada.platNomor);
      setNamaSopir(initialArmada.namaSopir);
      setNoHpSopir(initialArmada.noHpSopir || '');
      
      if (JENIS_KENDARAAN_OPTIONS.includes(initialArmada.jenisKendaraan)) {
        setJenisKendaraan(initialArmada.jenisKendaraan);
        setCustomJenis('');
      } else {
        setJenisKendaraan('Lainnya / Custom');
        setCustomJenis(initialArmada.jenisKendaraan);
      }

      setKapasitasTon(initialArmada.kapasitasTon || 8.0);

      if (initialArmada.pksLangganan && PKS_DEFAULT_OPTIONS.includes(initialArmada.pksLangganan)) {
        setPksLangganan(initialArmada.pksLangganan);
        setCustomPks('');
      } else if (initialArmada.pksLangganan) {
        setPksLangganan('Lainnya');
        setCustomPks(initialArmada.pksLangganan);
      } else {
        setPksLangganan(PKS_DEFAULT_OPTIONS[0]);
        setCustomPks('');
      }

      setStatus(initialArmada.status);
      setCatatan(initialArmada.catatan || '');
    } else {
      // Reset form
      setPlatNomor('');
      setNamaSopir('');
      setNoHpSopir('');
      setJenisKendaraan(JENIS_KENDARAAN_OPTIONS[0]);
      setCustomJenis('');
      setKapasitasTon(8.0);
      setPksLangganan(PKS_DEFAULT_OPTIONS[0]);
      setCustomPks('');
      setStatus('Aktif');
      setCatatan('');
    }
    setErrorMsg('');
  }, [initialArmada, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const formattedPlat = platNomor.trim().toUpperCase();
    if (!formattedPlat) {
      setErrorMsg('Nomor Plat Truk wajib diisi (Contoh: BM 8412 TA).');
      return;
    }

    if (!namaSopir.trim()) {
      setErrorMsg('Nama Sopir Truk wajib diisi.');
      return;
    }

    const finalJenis = jenisKendaraan === 'Lainnya / Custom' 
      ? (customJenis.trim() || 'Truk Angkut TBS')
      : jenisKendaraan;

    const finalPks = pksLangganan === 'Lainnya'
      ? (customPks.trim() || 'PKS Agro Mandiri Tapung')
      : pksLangganan;

    const payload = {
      platNomor: formattedPlat,
      namaSopir: namaSopir.trim(),
      noHpSopir: noHpSopir.trim() || undefined,
      jenisKendaraan: finalJenis,
      kapasitasTon: Number(kapasitasTon) || 8.0,
      pksLangganan: finalPks,
      status,
      catatan: catatan.trim() || undefined,
    };

    let savedItem: ArmadaTruk;
    if (isEdit && initialArmada) {
      updateArmada(initialArmada.id, payload);
      savedItem = { ...initialArmada, ...payload };
    } else {
      savedItem = addArmada(payload);
    }

    if (onSaved) {
      onSaved(savedItem);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>{isEdit ? 'Edit Data Armada Truk' : 'Tambah Armada Truk Baru'}</span>
        </div>
      }
      description="Kelola data induk armada truk pengangkut TBS sawit untuk dipilih pada input muatan dan monitoring logistik."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Info Utama: Plat Nomor & Sopir */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Identitas Truk & Pengemudi
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. Polisi / Plat Truk <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: BM 8412 TA"
                  value={platNomor}
                  onChange={(e) => setPlatNomor(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
                <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Nomor registrasi kendaraan sesuai STNK / lambung truk.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Sopir / Driver <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: Pak Eko (Truk 01)"
                  value={namaSopir}
                  onChange={(e) => setNamaSopir(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. WhatsApp / HP Sopir
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: 0812-7654-9988"
                  value={noHpSopir}
                  onChange={(e) => setNoHpSopir(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status Operasional Armada
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="Aktif">🟢 Aktif (Siap Angkut TBS)</option>
                <option value="Perbaikan">🟡 Perbaikan / Servis Bengkel</option>
                <option value="Nonaktif">🔴 Nonaktif / Cadangan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Spesifikasi Teknis & Rute Tujuan */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-600" />
            Spesifikasi Muatan & Pabrik Langganan
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis / Tipe Kendaraan
              </label>
              <select
                value={jenisKendaraan}
                onChange={(e) => setJenisKendaraan(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {JENIS_KENDARAAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {jenisKendaraan === 'Lainnya / Custom' && (
                <input
                  type="text"
                  placeholder="Tuliskan tipe kendaraan..."
                  value={customJenis}
                  onChange={(e) => setCustomJenis(e.target.value)}
                  className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kapasitas Muatan Standar (Ton)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="40"
                  value={kapasitasTon}
                  onChange={(e) => setKapasitasTon(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">
                  Ton ({(kapasitasTon * 1000).toLocaleString('id-ID')} Kg)
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pabrik Kelapa Sawit (PKS) Tujuan Utama
              </label>
              <div className="relative">
                <select
                  value={pksLangganan}
                  onChange={(e) => setPksLangganan(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {PKS_DEFAULT_OPTIONS.map((pks) => (
                    <option key={pks} value={pks}>
                      {pks}
                    </option>
                  ))}
                  <option value="Lainnya">PKS Lainnya / Custom...</option>
                </select>
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              {pksLangganan === 'Lainnya' && (
                <input
                  type="text"
                  placeholder="Nama PKS Tujuan..."
                  value={customPks}
                  onChange={(e) => setCustomPks(e.target.value)}
                  className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                />
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Tambahan / Keterangan Armada
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Truk khusus jalur gambut Blok C, dilengkapi tali jaring pengaman, rem baru diservis."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEdit ? 'Simpan Perubahan Armada' : 'Daftarkan Armada Truk'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
