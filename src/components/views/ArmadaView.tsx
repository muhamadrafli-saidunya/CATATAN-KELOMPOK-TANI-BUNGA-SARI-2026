import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Truck, 
  Scale, 
  Users, 
  Building2, 
  Calendar, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  ArrowUpRight, 
  Printer, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  TrendingUp,
  MapPin, 
  Layers, 
  PlusCircle,
  Copy,
  Check,
  Edit,
  Trash2,
  Phone,
  Settings,
  ShieldCheck,
  AlertCircle,
  Plus,
  Coins
} from 'lucide-react';
import { 
  formatRupiah, 
  formatKg, 
  formatTon, 
  formatTanggalIndo, 
  formatTanggalPendek, 
  formatNumber, 
  cn 
} from '../../lib/utils';
import { PanenRecord, ArmadaTruk } from '../../types';
import { FormArmadaModal } from '../armada/FormArmadaModal';
import { EditTimbanganPksModal } from '../armada/EditTimbanganPksModal';
import { EditRitModal } from '../armada/EditRitModal';
import { FormPanenModal } from '../panen/FormPanenModal';

interface ArmadaGroup {
  id: string;
  platTruk: string;
  namaSopir: string;
  namaPks: string;
  tanggal: string;
  panenRecords: PanenRecord[];
  totalDimuatKg: number;
  totalPksKg: number;
  totalSelisihKg: number;
  persentaseSusut: number;
  totalBruto: number;
  totalNetto: number;
  petaniList: {
    petaniId: string;
    petaniNama: string;
    blokLahan: string;
    noSpb: string;
    dimuatKg: number;
    pksKg: number;
    netto: number;
    statusPembayaran: string;
  }[];
}

interface ArmadaViewProps {
  onOpenAddPanen?: () => void;
  isEmbeddedInDashboard?: boolean;
}

export const ArmadaView: React.FC<ArmadaViewProps> = ({ 
  onOpenAddPanen, 
  isEmbeddedInDashboard = false 
}) => {
  const { 
    panenList, 
    armadaList,
    deleteArmada,
    deletePanen,
    setSelectedPanenForSlip, 
    setActiveTab, 
    pengaturan 
  } = useApp();

  // Sub-tab: 'monitoring' (rit & muatan petani) vs 'master' (daftar induk armada truk)
  const [activeSubTab, setActiveSubTab] = useState<'monitoring' | 'master'>('monitoring');

  // Filter States for Monitoring
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPksFilter, setSelectedPksFilter] = useState('ALL');
  const [selectedTanggalFilter, setSelectedTanggalFilter] = useState('ALL');
  const [expandedArmadaId, setExpandedArmadaId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter States for Master Armada
  const [masterSearch, setMasterSearch] = useState('');
  const [masterStatusFilter, setMasterStatusFilter] = useState<'ALL' | 'Aktif' | 'Perbaikan' | 'Nonaktif'>('ALL');

  // Modal States for Add/Edit Armada
  const [isArmadaModalOpen, setIsArmadaModalOpen] = useState(false);
  const [editingArmada, setEditingArmada] = useState<ArmadaTruk | null>(null);
  const [armadaToDelete, setArmadaToDelete] = useState<ArmadaTruk | null>(null);

  // Modal State for Edit Timbangan Pabrik (PKS)
  const [selectedArmadaForPksEdit, setSelectedArmadaForPksEdit] = useState<ArmadaGroup | null>(null);
  const [focusedPanenId, setFocusedPanenId] = useState<string | null>(null);

  // Modal States for Edit & Delete in Monitoring
  const [selectedArmadaForRitEdit, setSelectedArmadaForRitEdit] = useState<ArmadaGroup | null>(null);
  const [selectedPanenForEdit, setSelectedPanenForEdit] = useState<PanenRecord | null>(null);
  const [panenToDelete, setPanenToDelete] = useState<PanenRecord | null>(null);
  const [ritToDelete, setRitToDelete] = useState<ArmadaGroup | null>(null);

  // Group all panen records by (platTruk + tanggal + namaPks) to represent individual truck trips/rit
  const armadaGroups: ArmadaGroup[] = useMemo(() => {
    const groupMap: { [key: string]: ArmadaGroup } = {};

    panenList.forEach((record) => {
      const plat = record.platTruk || 'BM 8412 TA';
      const tgl = record.tanggal;
      const pks = record.namaPks || 'PKS Agro Mandiri Tapung';
      const groupKey = `${plat}_${tgl}_${pks}`;

      if (!groupMap[groupKey]) {
        groupMap[groupKey] = {
          id: groupKey,
          platTruk: plat,
          namaSopir: record.namaSopir || 'Sopir Truk',
          namaPks: pks,
          tanggal: tgl,
          panenRecords: [],
          totalDimuatKg: 0,
          totalPksKg: 0,
          totalSelisihKg: 0,
          persentaseSusut: 0,
          totalBruto: 0,
          totalNetto: 0,
          petaniList: [],
        };
      }

      const dimuat = record.timbanganRamKg > 0 ? record.timbanganRamKg : record.timbanganPksKg;
      const pksKg = record.timbanganPksKg > 0 ? record.timbanganPksKg : record.timbanganRamKg;

      groupMap[groupKey].panenRecords.push(record);
      groupMap[groupKey].totalDimuatKg += dimuat;
      groupMap[groupKey].totalPksKg += pksKg;
      groupMap[groupKey].totalBruto += record.totalBruto;
      groupMap[groupKey].totalNetto += record.totalNetto;

      groupMap[groupKey].petaniList.push({
        petaniId: record.petaniId,
        petaniNama: record.petaniNama,
        blokLahan: record.blokLahan,
        noSpb: record.noSpb,
        dimuatKg: dimuat,
        pksKg: pksKg,
        netto: record.totalNetto,
        statusPembayaran: record.statusPembayaran,
      });
    });

    // Calculate shrinkage for each group
    return Object.values(groupMap)
      .map(group => {
        const selisih = Math.max(0, group.totalDimuatKg - group.totalPksKg);
        const susut = group.totalDimuatKg > 0 
          ? Number(((selisih / group.totalDimuatKg) * 100).toFixed(2)) 
          : 0;
        return {
          ...group,
          totalSelisihKg: selisih,
          persentaseSusut: susut,
        };
      })
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [panenList]);

  // Unique PKS list for filter
  const pksOptions = useMemo(() => {
    const set = new Set<string>();
    armadaGroups.forEach(a => set.add(a.namaPks));
    return Array.from(set);
  }, [armadaGroups]);

  // Unique Tanggal list for filter
  const tanggalOptions = useMemo(() => {
    const set = new Set<string>();
    armadaGroups.forEach(a => set.add(a.tanggal));
    return Array.from(set);
  }, [armadaGroups]);

  // Filtered armada groups for Monitoring
  const filteredArmada = useMemo(() => {
    return armadaGroups.filter(item => {
      const matchSearch = 
        item.platTruk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.namaSopir.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.namaPks.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.petaniList.some(p => p.petaniNama.toLowerCase().includes(searchQuery.toLowerCase()) || p.noSpb.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPks = selectedPksFilter === 'ALL' || item.namaPks === selectedPksFilter;
      const matchTanggal = selectedTanggalFilter === 'ALL' || item.tanggal === selectedTanggalFilter;

      return matchSearch && matchPks && matchTanggal;
    });
  }, [armadaGroups, searchQuery, selectedPksFilter, selectedTanggalFilter]);

  // Filtered master armada trucks
  const filteredMasterArmada = useMemo(() => {
    return armadaList.filter(armada => {
      const matchSearch = 
        armada.platNomor.toLowerCase().includes(masterSearch.toLowerCase()) ||
        armada.namaSopir.toLowerCase().includes(masterSearch.toLowerCase()) ||
        (armada.pksLangganan && armada.pksLangganan.toLowerCase().includes(masterSearch.toLowerCase())) ||
        armada.jenisKendaraan.toLowerCase().includes(masterSearch.toLowerCase());

      const matchStatus = masterStatusFilter === 'ALL' || armada.status === masterStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [armadaList, masterSearch, masterStatusFilter]);

  // Fleet stats for master armada
  const totalMasterArmada = armadaList.length;
  const masterAktifCount = armadaList.filter(a => a.status === 'Aktif').length;
  const masterPerbaikanCount = armadaList.filter(a => a.status === 'Perbaikan').length;
  const masterTotalKapasitasTon = armadaList.reduce((sum, a) => sum + (a.kapasitasTon || 0), 0);

  // KPI calculations for Monitoring
  const totalTrukAktif = new Set(filteredArmada.map(a => a.platTruk)).size;
  const totalRitPengangkutan = filteredArmada.length;
  const grandTotalDimuatKg = filteredArmada.reduce((sum, a) => sum + a.totalDimuatKg, 0);
  const grandTotalPksKg = filteredArmada.reduce((sum, a) => sum + a.totalPksKg, 0);
  const grandTotalSelisihKg = grandTotalDimuatKg - grandTotalPksKg;
  // Tonase MEDARAN: Hasil Timbangan Pabrik dikurang Total Timbangan di Muat
  const grandTotalMedaranKg = grandTotalPksKg - grandTotalDimuatKg;
  const grandAvgSusut = grandTotalDimuatKg > 0 ? ((grandTotalMedaranKg / grandTotalDimuatKg) * 100).toFixed(2) : '0';
  const grandTotalBruto = filteredArmada.reduce((sum, a) => sum + a.totalBruto, 0);

  // Hasil penjumlahan MEDARAN dikali harga periodik manen
  const grandTotalMedaranRupiah = useMemo(() => {
    return filteredArmada.reduce((sum, a) => {
      // Hitung per record panen: (timbangan pabrik - timbangan muat) * harga periodik manen
      const ritRupiah = a.panenRecords.reduce((rSum, r) => {
        const dimuat = r.timbanganRamKg > 0 ? r.timbanganRamKg : (r.timbanganPksKg || 0);
        const pksKg = r.timbanganPksKg > 0 ? r.timbanganPksKg : (r.timbanganRamKg || 0);
        const medaranKg = pksKg - dimuat;
        const harga = r.hargaTbsPerKg || pengaturan.hargaTbsDefault || 2780;
        return rSum + (medaranKg * harga);
      }, 0);

      if (a.panenRecords.length > 0) {
        return sum + ritRupiah;
      }

      const groupMedaran = a.totalPksKg - a.totalDimuatKg;
      const groupHarga = a.panenRecords[0]?.hargaTbsPerKg || pengaturan.hargaTbsDefault || 2780;
      return sum + (groupMedaran * groupHarga);
    }, 0);
  }, [filteredArmada, pengaturan.hargaTbsDefault]);

  const toggleExpand = (id: string) => {
    setExpandedArmadaId(prev => (prev === id ? null : id));
  };

  const handleOpenAddArmada = () => {
    setEditingArmada(null);
    setIsArmadaModalOpen(true);
  };

  const handleOpenEditArmada = (armada: ArmadaTruk) => {
    setEditingArmada(armada);
    setIsArmadaModalOpen(true);
  };

  const handleDeleteArmadaConfirm = () => {
    if (armadaToDelete) {
      deleteArmada(armadaToDelete.id);
      setArmadaToDelete(null);
    }
  };

  const handleDeletePanenConfirm = () => {
    if (panenToDelete) {
      deletePanen(panenToDelete.id);
      setPanenToDelete(null);
    }
  };

  const handleDeleteRitConfirm = () => {
    if (ritToDelete) {
      ritToDelete.panenRecords.forEach(record => {
        deletePanen(record.id);
      });
      setRitToDelete(null);
    }
  };

  const handleCopyManifest = (armada: ArmadaGroup) => {
    const text = `*MANIFEST ANGKUTAN TBS ARMADA*
Kelompok Tani: ${pengaturan.namaKelompok}
---------------------------------------
No. Polisi Truk : ${armada.platTruk}
Nama Sopir      : ${armada.namaSopir}
Tujuan PKS      : ${armada.namaPks}
Tanggal Muat    : ${formatTanggalIndo(armada.tanggal)}

*RINCIAN MUATAN DARI PETANI (${armada.petaniList.length} Petani):*
${armada.petaniList.map((p, idx) => `${idx + 1}. ${p.petaniNama} (${p.blokLahan})
   - SPB: ${p.noSpb}
   - Muat Kebun: ${formatKg(p.dimuatKg)}
   - Timbang PKS: ${formatKg(p.pksKg)}`).join('\n\n')}

---------------------------------------
*TOTAL TIMBANGAN YANG DIMUAT : ${formatKg(armada.totalDimuatKg)} (${formatTon(armada.totalDimuatKg)})*
*HASIL TIMBANGAN PABRIK (PKS) : ${formatKg(armada.totalPksKg)} (${formatTon(armada.totalPksKg)})*
Selisih Susut Jalan: ${formatKg(armada.totalSelisihKg)} (${armada.persentaseSusut}%)
Estimasi Nilai Bruto: ${formatRupiah(armada.totalBruto)}
---------------------------------------`;

    navigator.clipboard.writeText(text);
    setCopiedId(armada.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner Armada */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Logistik & Monitoring Armada TBS
              </h2>
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300">
                {armadaList.length} Unit Truk Master
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {totalRitPengangkutan} Rit Pengangkutan
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola master armada truk, pantau muatan petani, total timbangan yang dimuat, serta hasil timbangan pabrik/PKS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleOpenAddArmada}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Armada Baru</span>
          </button>

          {onOpenAddPanen && (
            <button
              type="button"
              onClick={onOpenAddPanen}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Muatan Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Nav Subtabs: Monitoring Rit vs Master Armada */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('monitoring')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeSubTab === 'monitoring'
                ? "bg-green-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            <Scale className="w-4 h-4" />
            <span>Monitoring Pengangkutan & Muatan Petani</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeSubTab === 'monitoring' ? "bg-green-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            )}>
              {totalRitPengangkutan}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('master')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeSubTab === 'master'
                ? "bg-green-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            <Truck className="w-4 h-4" />
            <span>Master Data Armada Truk (Tambah / Edit)</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeSubTab === 'master' ? "bg-green-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            )}>
              {totalMasterArmada}
            </span>
          </button>
        </div>

        <div className="hidden sm:block text-xs text-slate-400">
          {activeSubTab === 'monitoring' 
            ? 'Memantau muatan dari kebun ke PKS' 
            : 'Pilihan armada di input muatan baru terhubung ke sini'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: MONITORING RIT & MUATAN DARI PETANI & HASIL TIMBANGAN PKS */}
      {/* ========================================================================= */}
      {activeSubTab === 'monitoring' && (
        <div className="space-y-6">
          {/* KPI Cards for Armada Monitoring */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            
            {/* Card 1: Total Armada & Rit */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Armada Beroperasi</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {totalTrukAktif} <span className="text-xs font-normal text-slate-400">Unit Truk</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Total <strong className="text-slate-700 dark:text-slate-200">{totalRitPengangkutan} Rit</strong> pengangkutan
                </div>
              </div>
            </div>

            {/* Card 2: Total Timbangan yang Dimuat di Kebun */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Timbangan Dimuat</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {formatKg(grandTotalDimuatKg)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Setara <strong className="text-slate-700 dark:text-slate-200">{formatTon(grandTotalDimuatKg)}</strong> timbangan kebun
                </div>
              </div>
            </div>

            {/* Card 3: Hasil Timbangan dari Pabrik/PKS */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hasil Timbangan Pabrik/PKS</span>
                <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                  {formatKg(grandTotalPksKg)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Netto pabrik: <strong className="text-slate-700 dark:text-slate-200">{formatTon(grandTotalPksKg)}</strong>
                </div>
              </div>
            </div>

            {/* Card 4: MEDARAN (Hasil Timbangan Pabrik - Total Timbangan di Muat) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-wider block",
                    grandTotalMedaranKg < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    MEDARAN
                  </span>
                  <span className="text-[10px] text-slate-400">Pabrik - Total Dimuat</span>
                </div>
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  grandTotalMedaranKg < 0 
                    ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400" 
                    : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                )}>
                  {grandTotalMedaranKg < 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className="mt-2">
                <div className={cn(
                  "text-xl sm:text-2xl font-bold font-mono",
                  grandTotalMedaranKg < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {grandTotalMedaranKg > 0 ? `+${formatKg(grandTotalMedaranKg)}` : formatKg(grandTotalMedaranKg)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                  <span>Tonase: <strong className="text-slate-700 dark:text-slate-200 font-mono">{formatTon(grandTotalMedaranKg)}</strong></span>
                  <span className={cn(
                    "font-semibold",
                    grandTotalMedaranKg < 0 ? "text-rose-500" : "text-emerald-500"
                  )}>
                    ({grandAvgSusut}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Card 5: NOMINAL MEDARAN */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">NOMINAL MEDARAN</span>
                  <span className="text-[10px] text-emerald-600/90 dark:text-emerald-400/90">Medaran × Harga Panen</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-2xs">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className={cn(
                  "text-xl sm:text-2xl font-bold font-mono",
                  grandTotalMedaranRupiah < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-300"
                )}>
                  {grandTotalMedaranRupiah > 0 ? `+${formatRupiah(grandTotalMedaranRupiah)}` : formatRupiah(grandTotalMedaranRupiah)}
                </div>
                <div className="text-xs text-emerald-700/90 dark:text-emerald-300/90 mt-0.5 flex items-center justify-between">
                  <span>Hasil {formatKg(grandTotalMedaranKg)} × Harga Periode</span>
                </div>
              </div>
            </div>

          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Plat Truk, Nama Sopir, Petani, No. SPB, atau PKS..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>

            {/* Filter PKS */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedPksFilter}
                onChange={(e) => setSelectedPksFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ALL">Semua Pabrik/PKS Tujuan ({pksOptions.length})</option>
                {pksOptions.map(pks => (
                  <option key={pks} value={pks}>{pks}</option>
                ))}
              </select>
            </div>

            {/* Filter Tanggal */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedTanggalFilter}
                onChange={(e) => setSelectedTanggalFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ALL">Semua Tanggal Pengiriman</option>
                {tanggalOptions.map(tgl => (
                  <option key={tgl} value={tgl}>{formatTanggalPendek(tgl)}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Main List of Armada Trips */}
          <div className="space-y-4">
            {filteredArmada.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
                <Truck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tidak Ada Data Armada yang Sesuai
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Coba sesuaikan kata kunci pencarian atau reset filter di atas.
                </p>
              </div>
            ) : (
              filteredArmada.map((armada) => {
                const isExpanded = expandedArmadaId === armada.id;
                const jumlahPetani = armada.petaniList.length;

                return (
                  <div 
                    key={armada.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden"
                  >
                    {/* Armada Card Top Summary Bar */}
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
                      
                      {/* Left: Truk & Sopir info */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm">
                          <Truck className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-black text-slate-900 dark:text-white font-mono tracking-tight">
                              {armada.platTruk}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-bold">
                              {armada.namaSopir}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Tiba di PKS</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <strong className="text-slate-700 dark:text-slate-300 font-semibold">{armada.namaPks}</strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatTanggalIndo(armada.tanggal)}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
                              <Users className="w-3.5 h-3.5" />
                              <span>{jumlahPetani} Petani Dimuat</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle & Right: Timbangan Dimuat vs Timbangan PKS Comparison */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                        
                        {/* Total Dimuat (Kebun/Ram) */}
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Total Dimuat di Kebun
                          </span>
                          <strong className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 font-mono block">
                            {formatKg(armada.totalDimuatKg)}
                          </strong>
                          <span className="text-[11px] text-slate-400">
                            {formatTon(armada.totalDimuatKg)}
                          </span>
                        </div>

                        {/* Arrow / Divider */}
                        <div className="text-slate-300 dark:text-slate-700 hidden sm:block">
                          <ChevronRight className="w-5 h-5" />
                        </div>

                        {/* Hasil Timbangan Pabrik/PKS */}
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 block">
                            Hasil Timbangan Pabrik / PKS
                          </span>
                          <strong className="text-base sm:text-lg font-black text-green-600 dark:text-green-400 font-mono block">
                            {formatKg(armada.totalPksKg)}
                          </strong>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Selisih: -{formatKg(armada.totalSelisihKg)} ({armada.persentaseSusut}%)
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 pl-2 flex-wrap sm:flex-nowrap justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedArmadaForPksEdit(armada);
                              setFocusedPanenId(null);
                            }}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Input atau koreksi hasil timbangan dari pabrik/PKS"
                          >
                            <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="hidden sm:inline">Edit Timbangan Pabrik</span>
                            <span className="sm:hidden">Timbang PKS</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedArmadaForRitEdit(armada)}
                            className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Ubah Data Rit (Truk, Sopir, PKS, Tanggal)"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Ubah Rit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRitToDelete(armada)}
                            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Seluruh Rit Pengangkutan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyManifest(armada)}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Salin Rincian Manifest Armada"
                          >
                            {copiedId === armada.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleExpand(armada.id)}
                            className={cn(
                              "px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                              isExpanded 
                                ? "bg-green-600 text-white" 
                                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                            )}
                          >
                            <span>{isExpanded ? 'Tutup' : 'Lihat Muatan'}</span>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                      </div>

                    </div>

                    {/* Expanded Details: Rincian Muatan dari Petani */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-green-600" />
                            <span>Rincian Muatan Dari Petani ({armada.petaniList.length} Petani Terangkut)</span>
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Total Nilai Bruto Rit Ini: <strong className="text-green-600 dark:text-green-400 font-mono">{formatRupiah(armada.totalBruto)}</strong>
                          </span>
                        </div>

                        {/* Table of Farmers inside this Truck */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                  <th className="p-3 pl-4">No. SPB</th>
                                  <th className="p-3">Nama Petani & Blok</th>
                                  <th className="p-3 text-right">Timbangan Dimuat (Kebun)</th>
                                  <th className="p-3 text-right">Hasil Timbangan Pabrik (PKS)</th>
                                  <th className="p-3 text-right">Hasil Bersih Petani</th>
                                  <th className="p-3 text-center">Status</th>
                                  <th className="p-3 pr-4 text-center">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {armada.panenRecords.map((record) => (
                                  <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="p-3 pl-4 font-mono font-bold text-slate-900 dark:text-white">
                                      {record.noSpb}
                                    </td>

                                    <td className="p-3">
                                      <p className="font-bold text-slate-900 dark:text-white">{record.petaniNama}</p>
                                      <p className="text-[11px] text-slate-400">{record.blokLahan}</p>
                                    </td>

                                    <td className="p-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                                      {formatKg(record.timbanganRamKg || record.timbanganPksKg)}
                                    </td>

                                    <td className="p-3 text-right font-mono font-bold text-green-600 dark:text-green-400 text-sm">
                                      {formatKg(record.timbanganPksKg)}
                                      <span className="block text-[10px] font-normal text-slate-400 font-sans">
                                        @{formatRupiah(record.hargaTbsPerKg)}/kg
                                      </span>
                                    </td>

                                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                      {formatRupiah(record.totalNetto)}
                                    </td>

                                    <td className="p-3 text-center">
                                      <span className={cn(
                                        "px-2 py-0.5 text-[10px] font-bold rounded-full",
                                        record.statusPembayaran === 'Lunas' 
                                          ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                      )}>
                                        {record.statusPembayaran}
                                      </span>
                                    </td>

                                    <td className="p-3 pr-4 text-center">
                                      <div className="flex items-center justify-center gap-1.5 flex-wrap sm:flex-nowrap">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedArmadaForPksEdit(armada);
                                            setFocusedPanenId(record.id);
                                          }}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-md transition-colors cursor-pointer"
                                          title="Input/Edit Hasil Timbangan Pabrik PKS"
                                        >
                                          <Scale className="w-3 h-3 text-emerald-600" />
                                          <span>PKS</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setSelectedPanenForEdit(record)}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-md transition-colors cursor-pointer"
                                          title="Ubah / Edit Data Lengkap Muatan Petani (SPB)"
                                        >
                                          <Edit className="w-3 h-3 text-blue-600" />
                                          <span>Edit</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setSelectedPanenForSlip(record)}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                                          title="Cetak Slip Pembayaran Petani"
                                        >
                                          <Printer className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                          <span>Slip</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setPanenToDelete(record)}
                                          className="p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors cursor-pointer"
                                          title="Hapus Data Muatan Petani Ini"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Summary Footer for Truck Trip */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 flex-wrap">
                            <span>PKS Tujuan: <strong className="text-slate-700 dark:text-slate-300">{armada.namaPks}</strong></span>
                            <span>•</span>
                            <span>Sopir: <strong className="text-slate-700 dark:text-slate-300">{armada.namaSopir}</strong></span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedArmadaForPksEdit(armada);
                                setFocusedPanenId(null);
                              }}
                              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Edit Timbangan Pabrik</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedArmadaForRitEdit(armada)}
                              className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Ubah Data Rit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRitToDelete(armada)}
                              className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Rit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyManifest(armada)}
                              className="text-xs font-bold text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 cursor-pointer px-2 py-1.5"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Manifest WA</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: MASTER DATA ARMADA TRUK (TAMBAH / EDIT / KELOLA) */}
      {/* ========================================================================= */}
      {activeSubTab === 'master' && (
        <div className="space-y-6">
          
          {/* Master Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Total Truk Terdaftar</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {totalMasterArmada} <span className="text-xs font-normal text-slate-400">Unit</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Armada Kelompok & Mitra</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-emerald-600">Siap Operasi (Aktif)</div>
              <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                {masterAktifCount} <span className="text-xs font-normal text-slate-400">Unit</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Tersedia untuk muat TBS</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-amber-600">Perbaikan / Servis</div>
              <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
                {masterPerbaikanCount} <span className="text-xs font-normal text-slate-400">Unit</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Dalam perawatan bengkel</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-blue-600">Total Kapasitas Angkut</div>
              <div className="text-2xl font-black text-blue-600 mt-1 font-mono">
                {masterTotalKapasitasTon.toFixed(1)} <span className="text-xs font-normal text-slate-400">Ton/Rit</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Daya tampung simultan</div>
            </div>
          </div>

          {/* Action and Filter Header */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={masterSearch}
                onChange={(e) => setMasterSearch(e.target.value)}
                placeholder="Cari Plat Nomor, Nama Sopir, Jenis Truk, atau PKS..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={masterStatusFilter}
                onChange={(e) => setMasterStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="ALL">Semua Status Operasi ({armadaList.length})</option>
                <option value="Aktif">Aktif Saja ({masterAktifCount})</option>
                <option value="Perbaikan">Dalam Perbaikan ({masterPerbaikanCount})</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>

              <button
                type="button"
                onClick={handleOpenAddArmada}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Truk</span>
              </button>
            </div>

          </div>

          {/* Master Armada Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMasterArmada.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
                <Truck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tidak Ada Truk yang Sesuai
                </h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Silakan tambah data armada truk baru untuk mempermudah pencatatan panen.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddArmada}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Armada Truk Sekarang</span>
                </button>
              </div>
            ) : (
              filteredMasterArmada.map((armada) => {
                // Count historical trips logged for this truck
                const tripCount = panenList.filter(
                  p => (p.platTruk || '').toUpperCase().trim() === armada.platNomor.toUpperCase().trim()
                ).length;

                return (
                  <div 
                    key={armada.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Plate & Status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-base font-black text-slate-900 dark:text-white font-mono tracking-tight block">
                              {armada.platNomor}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                              {armada.jenisKendaraan}
                            </span>
                          </div>
                        </div>

                        <span className={cn(
                          "px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
                          armada.status === 'Aktif'
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : armada.status === 'Perbaikan'
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                        )}>
                          {armada.status}
                        </span>
                      </div>

                      {/* Specs Details */}
                      <div className="space-y-2 py-3 border-y border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Sopir / Driver:</span>
                          <strong className="text-slate-800 dark:text-slate-200 font-semibold">{armada.namaSopir}</strong>
                        </div>

                        {armada.noHpSopir && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">No. WhatsApp / HP:</span>
                            <a 
                              href={`https://wa.me/${armada.noHpSopir.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{armada.noHpSopir}</span>
                            </a>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Kapasitas Muatan:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {armada.kapasitasTon} Ton ({armada.kapasitasTon * 1000} Kg)
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">PKS Langganan:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium text-right truncate max-w-[170px]">
                            {armada.pksLangganan || 'Sesuai Arahan Panen'}
                          </span>
                        </div>

                        {armada.catatan && (
                          <div className="pt-1 text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                            "{armada.catatan}"
                          </div>
                        )}
                      </div>

                      {/* Trip counter badge */}
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>Total Rit Tercatat:</span>
                        <strong className="text-green-600 dark:text-green-400 font-bold font-mono">
                          {tripCount} Rit Pengiriman
                        </strong>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditArmada(armada)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit Armada</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setArmadaToDelete(armada)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Armada Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Form Add / Edit Armada Modal */}
      <FormArmadaModal
        isOpen={isArmadaModalOpen}
        onClose={() => {
          setIsArmadaModalOpen(false);
          setEditingArmada(null);
        }}
        initialArmada={editingArmada}
      />

      {/* Modal Edit Data Rit (Truk, Sopir, PKS, Tanggal) */}
      <EditRitModal
        isOpen={Boolean(selectedArmadaForRitEdit)}
        onClose={() => setSelectedArmadaForRitEdit(null)}
        armadaGroup={selectedArmadaForRitEdit}
      />

      {/* Modal Edit Muatan Panen / SPB Petani */}
      <FormPanenModal
        isOpen={Boolean(selectedPanenForEdit)}
        onClose={() => setSelectedPanenForEdit(null)}
        initialRecord={selectedPanenForEdit}
      />

      {/* Modal Edit Timbangan Pabrik (PKS) */}
      <EditTimbanganPksModal
        isOpen={Boolean(selectedArmadaForPksEdit)}
        onClose={() => {
          setSelectedArmadaForPksEdit(null);
          setFocusedPanenId(null);
        }}
        armadaGroup={selectedArmadaForPksEdit}
        focusedPanenId={focusedPanenId}
      />

      {/* Delete Confirmation Dialog: Single Farmer Load (SPB) */}
      {panenToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Muatan Petani?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus data muatan SPB <strong className="text-slate-800 dark:text-slate-200 font-mono">{panenToDelete.noSpb}</strong> milik <strong className="text-slate-800 dark:text-slate-200">{panenToDelete.petaniNama}</strong> ({formatKg(panenToDelete.timbanganRamKg || panenToDelete.timbanganPksKg)})?
              </p>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300">
              Data catatan panen, timbangan, dan slip pembayaran terkait akan dihapus dari sistem pengangkutan.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPanenToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeletePanenConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm cursor-pointer"
              >
                Ya, Hapus Muatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog: Entire Truck Trip / Rit */}
      {ritToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Seluruh Rit Pengangkutan?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus rit truk <strong className="text-slate-800 dark:text-slate-200 font-mono">{ritToDelete.platTruk}</strong> ({ritToDelete.namaSopir}) tujuan <strong>{ritToDelete.namaPks}</strong> tanggal <strong>{formatTanggalIndo(ritToDelete.tanggal)}</strong>?
              </p>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
              <strong>Peringatan:</strong> Tindakan ini akan menghapus <strong>{ritToDelete.panenRecords.length} data muatan SPB petani</strong> dengan total tonase <strong>{formatKg(ritToDelete.totalDimuatKg)}</strong> sekaligus.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRitToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteRitConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm cursor-pointer"
              >
                Ya, Hapus Seluruh Rit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog: Master Armada */}
      {armadaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Armada Truk?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus armada <strong className="text-slate-800 dark:text-slate-200">{armadaToDelete.platNomor} ({armadaToDelete.namaSopir})</strong> dari daftar master?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArmadaToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteArmadaConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm"
              >
                Ya, Hapus Armada
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
