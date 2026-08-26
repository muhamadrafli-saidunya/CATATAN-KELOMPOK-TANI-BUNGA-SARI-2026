import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { PanenRecord, ArmadaTruk } from '../../types';
import { Truck, Calendar, Building2, User, Save, AlertCircle } from 'lucide-react';
import { formatTanggalIndo } from '../../lib/utils';

interface ArmadaGroup {
  id: string;
  platTruk: string;
  namaSopir: string;
  namaPks: string;
  tanggal: string;
  panenRecords: PanenRecord[];
  totalDimuatKg: number;
  totalPksKg: number;
}

interface EditRitModalProps {
  isOpen: boolean;
  onClose: () => void;
  armadaGroup: ArmadaGroup | null;
}

export const EditRitModal: React.FC<EditRitModalProps> = ({
  isOpen,
  onClose,
  armadaGroup,
}) => {
  const { armadaList, updatePanen } = useApp();

  const [selectedArmadaId, setSelectedArmadaId] = useState<string>('');
  const [platTruk, setPlatTruk] = useState<string>('');
  const [namaSopir, setNamaSopir] = useState<string>('');
  const [namaPks, setNamaPks] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>('');

  useEffect(() => {
    if (armadaGroup && isOpen) {
      setPlatTruk(armadaGroup.platTruk || '');
      setNamaSopir(armadaGroup.namaSopir || '');
      setNamaPks(armadaGroup.namaPks || '');
      setTanggal(armadaGroup.tanggal || new Date().toISOString().split('T')[0]);

      // Check if matches an existing armada in master list
      const matched = armadaList.find(a => a.platNomor.toLowerCase() === (armadaGroup.platTruk || '').toLowerCase());
      if (matched) {
        setSelectedArmadaId(matched.id);
      } else {
        setSelectedArmadaId('manual');
      }
    }
  }, [armadaGroup, isOpen, armadaList]);

  const handleArmadaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedArmadaId(val);

    if (val === 'manual' || val === '') {
      return;
    }

    const armada = armadaList.find(a => a.id === val);
    if (armada) {
      setPlatTruk(armada.platNomor);
      setNamaSopir(armada.namaSopir);
      if (armada.pksLangganan) {
        setNamaPks(armada.pksLangganan);
      }
    }
  };

  if (!armadaGroup) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!platTruk.trim() || !namaSopir.trim() || !namaPks.trim() || !tanggal) {
      return;
    }

    // Update all panen records belonging to this rit
    armadaGroup.panenRecords.forEach(record => {
      updatePanen(record.id, {
        platTruk: platTruk.trim().toUpperCase(),
        namaSopir: namaSopir.trim(),
        namaPks: namaPks.trim(),
        tanggal: tanggal,
      });
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ubah Data Rit Pengangkutan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perbarui armada truk, sopir, PKS tujuan, dan tanggal untuk {armadaGroup.panenRecords.length} muatan petani
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Perubahan data pada form ini akan otomatis diterapkan ke seluruh <strong>{armadaGroup.panenRecords.length} SPB muatan petani</strong> yang terangkut dalam rit perjalanan ini.
          </span>
        </div>

        {/* Pilihan Armada Master */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Pilih Dari Master Armada Truk
          </label>
          <select
            value={selectedArmadaId}
            onChange={handleArmadaSelect}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="manual">-- Input Manual / Truk Lain --</option>
            {armadaList.map(a => (
              <option key={a.id} value={a.id}>
                {a.platNomor} - {a.namaSopir} ({a.jenisKendaraan} - Kap. {a.kapasitasTon} Ton)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Plat Nomor Truk *
            </label>
            <div className="relative">
              <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={platTruk}
                onChange={(e) => setPlatTruk(e.target.value.toUpperCase())}
                placeholder="BM 8412 TA"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Sopir *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={namaSopir}
                onChange={(e) => setNamaSopir(e.target.value)}
                placeholder="Contoh: Pak Eko"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pabrik Kelapa Sawit (PKS) Tujuan *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={namaPks}
                onChange={(e) => setNamaPks(e.target.value)}
                placeholder="PKS Agro Mandiri Tapung"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Pengiriman *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Rit</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
