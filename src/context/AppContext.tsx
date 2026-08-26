import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Petani, 
  ArmadaTruk,
  PanenRecord, 
  KasKelompok, 
  PinjamanKasbon, 
  PengaturanKelompok, 
  DatabaseBackupData,
  UserRole, 
  ActiveTab 
} from '../types';
import { 
  initialPetani, 
  initialArmada,
  initialPanen, 
  initialKasKelompok, 
  initialPinjaman, 
  initialPengaturan 
} from '../data/initialData';

interface AppContextType {
  // Navigation & Role
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  activePetaniId: string | null;
  setActivePetaniId: (id: string | null) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Data State
  petaniList: Petani[];
  armadaList: ArmadaTruk[];
  panenList: PanenRecord[];
  kasList: KasKelompok[];
  pinjamanList: PinjamanKasbon[];
  pengaturan: PengaturanKelompok;

  // CRUD Petani
  addPetani: (data: Omit<Petani, 'id'>) => void;
  updatePetani: (id: string, data: Partial<Petani>) => void;
  deletePetani: (id: string) => void;
  importPetaniList: (dataList: Omit<Petani, 'id'>[], mode?: 'append' | 'replace') => number;

  // CRUD Armada Truk
  addArmada: (data: Omit<ArmadaTruk, 'id'>) => ArmadaTruk;
  updateArmada: (id: string, data: Partial<ArmadaTruk>) => void;
  deleteArmada: (id: string) => void;

  // CRUD Panen
  addPanen: (data: Omit<PanenRecord, 'id' | 'noSpb' | 'selisihKg' | 'persentaseSelisih' | 'totalBruto' | 'potonganPedaranRupiah' | 'totalPotongan' | 'totalNetto'> & Partial<PanenRecord>) => PanenRecord;
  importPanenList: (dataList: (Omit<PanenRecord, 'id' | 'noSpb' | 'selisihKg' | 'persentaseSelisih' | 'totalBruto' | 'potonganPedaranRupiah' | 'totalPotongan' | 'totalNetto'> & Partial<PanenRecord>)[], mode?: 'append' | 'replace') => number;
  updatePanen: (id: string, data: Partial<PanenRecord>) => void;
  batchUpdatePanen: (updates: { id: string; data: Partial<PanenRecord> }[]) => void;
  deletePanen: (id: string) => void;
  batchUpdateStatusPanen: (ids: string[], status: 'Lunas' | 'Siap Bayar' | 'Draft') => void;

  // CRUD Kas
  addKas: (data: Omit<KasKelompok, 'id' | 'saldoSetelah'>) => void;
  updateKas: (id: string, data: Partial<KasKelompok>) => void;
  deleteKas: (id: string) => void;

  // CRUD Pinjaman
  addPinjaman: (data: Omit<PinjamanKasbon, 'id'>) => void;
  updatePinjaman: (id: string, data: Partial<PinjamanKasbon>) => void;
  deletePinjaman: (id: string) => void;

  // Pengaturan
  updatePengaturan: (data: Partial<PengaturanKelompok>) => void;

  // Print & Modal State
  selectedPanenForSlip: PanenRecord | null;
  setSelectedPanenForSlip: (panen: PanenRecord | null) => void;
  selectedPetaniForSlip: Petani | null;
  setSelectedPetaniForSlip: (petani: Petani | null) => void;

  // Reset & Database Restore
  resetToDefault: () => void;
  resetToDefaultData: () => void;
  restoreDatabase: (backup: DatabaseBackupData, mode?: 'replace' | 'merge') => {
    success: boolean;
    message: string;
    counts: { petani: number; armada: number; panen: number; kas: number; pinjaman: number };
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PETANI: 'laporan_sawit_petani_v1',
  ARMADA: 'laporan_sawit_armada_v1',
  PANEN: 'laporan_sawit_panen_v1',
  KAS: 'laporan_sawit_kas_v1',
  PINJAMAN: 'laporan_sawit_pinjaman_v1',
  PENGATURAN: 'laporan_sawit_pengaturan_v1',
  DARK_MODE: 'laporan_sawit_darkmode_v1',
  ROLE: 'laporan_sawit_role_v1',
  ACTIVE_PETANI: 'laporan_sawit_active_petani_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dark mode init
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // User role init
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
      return (saved as UserRole) || 'admin';
    } catch {
      return 'admin';
    }
  });

  const [activePetaniId, setActivePetaniId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_PETANI) || 'petani-01';
    } catch {
      return 'petani-01';
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Main Data States
  const [petaniList, setPetaniList] = useState<Petani[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PETANI);
      return saved ? JSON.parse(saved) : initialPetani;
    } catch {
      return initialPetani;
    }
  });

  const [armadaList, setArmadaList] = useState<ArmadaTruk[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARMADA);
      return saved ? JSON.parse(saved) : initialArmada;
    } catch {
      return initialArmada;
    }
  });

  // Helper recalculate kas balances (kronologis dari tanggal terlama ke terbaru)
  const recalculateKasBalances = (list: KasKelompok[]): KasKelompok[] => {
    const sorted = [...list].sort((a, b) => {
      const dateDiff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id.localeCompare(b.id);
    });

    let running = 0;
    return sorted.map(item => {
      if (item.jenis === 'Masuk') {
        running += item.jumlah;
      } else {
        running -= item.jumlah;
      }
      return {
        ...item,
        saldoSetelah: running,
      };
    });
  };

  // Helper untuk menghitung kelompok armada dan nilai medaran (Kg medaran di monitoring pengangkutan × harga TBS tanggal periode panen)
  const calculateArmadaMedaranGroups = (panenRecords: PanenRecord[]) => {
    const groupMap: { [key: string]: {
      platTruk: string;
      namaSopir: string;
      namaPks: string;
      tanggal: string;
      totalDimuatKg: number;
      totalPksKg: number;
      totalPotonganPedaranKg: number;
      hargaTbsPerKg: number;
      panenRecords: PanenRecord[];
    } } = {};

    panenRecords.forEach(record => {
      const plat = record.platTruk || 'BM 8412 TA';
      const tgl = record.tanggal;
      const pks = record.namaPks || 'PKS Agro Mandiri Tapung';
      const groupKey = `${plat}_${tgl}_${pks}`;

      if (!groupMap[groupKey]) {
        groupMap[groupKey] = {
          platTruk: plat,
          namaSopir: record.namaSopir || 'Sopir Truk',
          namaPks: pks,
          tanggal: tgl,
          totalDimuatKg: 0,
          totalPksKg: 0,
          totalPotonganPedaranKg: 0,
          hargaTbsPerKg: record.hargaTbsPerKg || 2780,
          panenRecords: [],
        };
      }

      const dimuat = record.timbanganRamKg > 0 ? record.timbanganRamKg : record.timbanganPksKg;
      const pksKg = record.timbanganPksKg > 0 ? record.timbanganPksKg : record.timbanganRamKg;

      groupMap[groupKey].totalDimuatKg += dimuat;
      groupMap[groupKey].totalPksKg += pksKg;
      groupMap[groupKey].totalPotonganPedaranKg += (record.potonganPedaranKg || 0);
      groupMap[groupKey].panenRecords.push(record);
      if (record.hargaTbsPerKg) {
        groupMap[groupKey].hargaTbsPerKg = record.hargaTbsPerKg;
      }
    });

    return Object.entries(groupMap).map(([groupKey, item]) => {
      // Tonase MEDARAN: Hasil Timbangan Pabrik dikurang Total Timbangan di Muat
      const medaranKg = item.totalPksKg - item.totalDimuatKg;
      
      // NOMINAL MEDARAN: Hasil penjumlahan MEDARAN dikali harga periodik manen
      const ritRupiah = item.panenRecords.reduce((sum, r) => {
        const dimuat = r.timbanganRamKg > 0 ? r.timbanganRamKg : (r.timbanganPksKg || 0);
        const pksKg = r.timbanganPksKg > 0 ? r.timbanganPksKg : (r.timbanganRamKg || 0);
        const diffKg = pksKg - dimuat;
        const harga = r.hargaTbsPerKg || item.hargaTbsPerKg || 2780;
        return sum + (diffKg * harga);
      }, 0);

      const totalMedaranRupiah = item.panenRecords.length > 0 ? ritRupiah : (medaranKg * item.hargaTbsPerKg);

      return {
        groupKey,
        platTruk: item.platTruk,
        namaSopir: item.namaSopir,
        namaPks: item.namaPks,
        tanggal: item.tanggal,
        totalDimuatKg: item.totalDimuatKg,
        totalPksKg: item.totalPksKg,
        medaranKg,
        hargaTbsPerKg: item.hargaTbsPerKg,
        totalMedaranRupiah,
        panenRecords: item.panenRecords,
      };
    });
  };

  // Helper sinkronisasi Buku Kas Kelompok Tani dengan NOMINAL MEDARAN dari Monitoring Pengangkutan Petani
  const syncKasWithArmadaMedaran = (currentKasList: KasKelompok[], panenRecords: PanenRecord[]): KasKelompok[] => {
    // Pertahankan semua kas manual / non-auto-generated
    const manualKas = currentKasList.filter(k => 
      !k.isAutoGenerated && 
      !k.id.startsWith('kas-medaran-') && 
      !k.buktiRef?.startsWith('MEDARAN-')
    );

    const armadaGroups = calculateArmadaMedaranGroups(panenRecords);
    const autoKasList: KasKelompok[] = [];

    armadaGroups.forEach(group => {
      const nominalMedaran = Math.abs(group.totalMedaranRupiah);
      // Otomatis ditambahkan ke arus kas masuk buku besar jika terdapat nominal medaran dari rit armada
      if (nominalMedaran > 0) {
        const cleanPlat = group.platTruk.replace(/\s+/g, '');
        const cleanPks = group.namaPks.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        const sign = group.medaranKg >= 0 ? '+' : '';
        const kasItem: KasKelompok = {
          id: `kas-medaran-armada-${cleanPlat}-${group.tanggal}-${cleanPks}`,
          tanggal: group.tanggal, // Tanggal periode panen
          jenis: 'Masuk',
          kategori: 'Medaran',
          keterangan: `Kas Masuk Nominal Medaran: Truk ${group.platTruk} (${group.namaSopir}) ke ${group.namaPks} - Medaran ${sign}${group.medaranKg.toLocaleString('id-ID')} kg @ Rp ${group.hargaTbsPerKg.toLocaleString('id-ID')}/kg`,
          jumlah: Math.round(nominalMedaran),
          saldoSetelah: 0,
          buktiRef: `MEDARAN-${cleanPlat}-${group.tanggal}`,
          isAutoGenerated: true,
        };
        autoKasList.push(kasItem);
      }
    });

    return recalculateKasBalances([...manualKas, ...autoKasList]);
  };

  const [panenList, setPanenList] = useState<PanenRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PANEN);
      if (saved) {
        return JSON.parse(saved) as PanenRecord[];
      }
      return initialPanen;
    } catch {
      return initialPanen;
    }
  });

  const [kasList, setKasList] = useState<KasKelompok[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KAS);
      const baseKas: KasKelompok[] = saved ? JSON.parse(saved) : initialKasKelompok;
      
      // Ambil data panen efektif untuk sinkronisasi armada medaran
      const effectivePanen: PanenRecord[] = (() => {
        try {
          const savedPanen = localStorage.getItem(STORAGE_KEYS.PANEN);
          return savedPanen ? JSON.parse(savedPanen) : initialPanen;
        } catch {
          return initialPanen;
        }
      })();

      return syncKasWithArmadaMedaran(baseKas, effectivePanen);
    } catch {
      return initialKasKelompok;
    }
  });

  const [pinjamanList, setPinjamanList] = useState<PinjamanKasbon[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PINJAMAN);
      return saved ? JSON.parse(saved) : initialPinjaman;
    } catch {
      return initialPinjaman;
    }
  });

  const [pengaturan, setPengaturan] = useState<PengaturanKelompok>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PENGATURAN);
      return saved ? JSON.parse(saved) : initialPengaturan;
    } catch {
      return initialPengaturan;
    }
  });

  // Slip Printing & Detail Modal
  const [selectedPanenForSlip, setSelectedPanenForSlip] = useState<PanenRecord | null>(null);
  const [selectedPetaniForSlip, setSelectedPetaniForSlip] = useState<Petani | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(darkMode));
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE, userRole);
    } catch (e) {
      console.error(e);
    }
  }, [userRole]);

  useEffect(() => {
    try {
      if (activePetaniId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PETANI, activePetaniId);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activePetaniId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PETANI, JSON.stringify(petaniList));
    } catch (e) {
      console.error(e);
    }
  }, [petaniList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ARMADA, JSON.stringify(armadaList));
    } catch (e) {
      console.error(e);
    }
  }, [armadaList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PANEN, JSON.stringify(panenList));
    } catch (e) {
      console.error(e);
    }
  }, [panenList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(kasList));
    } catch (e) {
      console.error(e);
    }
  }, [kasList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PINJAMAN, JSON.stringify(pinjamanList));
    } catch (e) {
      console.error(e);
    }
  }, [pinjamanList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(pengaturan));
    } catch (e) {
      console.error(e);
    }
  }, [pengaturan]);

  // Petani Actions
  const addPetani = (data: Omit<Petani, 'id'>) => {
    const newId = `petani-${String(petaniList.length + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    const newPetani: Petani = {
      ...data,
      id: newId,
    };
    setPetaniList(prev => [newPetani, ...prev]);
  };

  const updatePetani = (id: string, data: Partial<Petani>) => {
    setPetaniList(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deletePetani = (id: string) => {
    setPetaniList(prev => prev.filter(p => p.id !== id));
  };

  const importPetaniList = (dataList: Omit<Petani, 'id'>[], mode: 'append' | 'replace' = 'append'): number => {
    const timestamp = Date.now();
    const formattedList: Petani[] = dataList.map((data, index) => {
      const idx = mode === 'replace' ? index + 1 : petaniList.length + index + 1;
      return {
        ...data,
        id: `petani-${String(idx).padStart(2, '0')}-${timestamp.toString().slice(-4)}${index}`,
      };
    });

    if (mode === 'replace') {
      setPetaniList(formattedList);
    } else {
      setPetaniList(prev => [...prev, ...formattedList]);
    }
    return formattedList.length;
  };

  // Armada Actions
  const addArmada = (data: Omit<ArmadaTruk, 'id'>): ArmadaTruk => {
    const newId = `armada-${Date.now().toString().slice(-6)}`;
    const newArmada: ArmadaTruk = {
      ...data,
      id: newId,
    };
    setArmadaList(prev => [newArmada, ...prev]);
    return newArmada;
  };

  const updateArmada = (id: string, data: Partial<ArmadaTruk>) => {
    setArmadaList(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteArmada = (id: string) => {
    setArmadaList(prev => prev.filter(a => a.id !== id));
  };

  // Helper calculation for Panen
  const calculatePanenFields = (input: {
    timbanganRamKg?: number;
    timbanganPksKg?: number;
    hargaTbsPerKg: number;
    potonganPedaranKg?: number;
    potonganIuranKasRupiah?: number;
    upahPemanenRupiah?: number;
    kasbonPupukRupiah?: number;
  }) => {
    const beratKg = input.timbanganPksKg ?? input.timbanganRamKg ?? 0;
    const timbanganRamKg = input.timbanganRamKg ?? beratKg;
    const timbanganPksKg = input.timbanganPksKg ?? beratKg;

    const selisihKg = Math.max(0, timbanganRamKg - timbanganPksKg);
    const persentaseSelisih = timbanganRamKg > 0 
      ? Number(((selisihKg / timbanganRamKg) * 100).toFixed(2)) 
      : 0;
    
    const totalBruto = beratKg * (input.hargaTbsPerKg || 0);
    const pedaranKg = input.potonganPedaranKg || 0;
    const pedaranRupiah = pedaranKg * (input.hargaTbsPerKg || 0);
    
    const iuranKas = input.potonganIuranKasRupiah !== undefined 
      ? input.potonganIuranKasRupiah 
      : (beratKg * (pengaturan.tarifIuranKasPerKg || 0));

    const upahPanen = input.upahPemanenRupiah !== undefined 
      ? input.upahPemanenRupiah 
      : (beratKg * (pengaturan.tarifUpahPanenPerKg || 0));

    const kasbon = input.kasbonPupukRupiah || 0;
    const totalPotongan = pedaranRupiah + iuranKas + upahPanen + kasbon;
    // Nilai netto petani dihitung dari perkalian timbangan kebun dengan harga TBS
    const beratKebun = timbanganRamKg || beratKg;
    const totalNetto = beratKebun * (input.hargaTbsPerKg || 0);

    return {
      timbanganRamKg,
      timbanganPksKg,
      selisihKg,
      persentaseSelisih,
      totalBruto,
      potonganPedaranKg: pedaranKg,
      potonganPedaranRupiah: pedaranRupiah,
      potonganIuranKasRupiah: iuranKas,
      upahPemanenRupiah: upahPanen,
      kasbonPupukRupiah: kasbon,
      totalPotongan,
      totalNetto,
    };
  };

  // Panen Actions
  const addPanen = (data: Omit<PanenRecord, 'id' | 'noSpb' | 'selisihKg' | 'persentaseSelisih' | 'totalBruto' | 'potonganPedaranRupiah' | 'totalPotongan' | 'totalNetto'> & Partial<PanenRecord>): PanenRecord => {
    const nextNum = panenList.length + 1;
    const dateStr = data.tanggal || new Date().toISOString().split('T')[0];
    const [year, month] = dateStr.split('-');
    const noSpb = `SPB-BS/${year}/${month}/${String(nextNum).padStart(3, '0')}`;
    const newId = `panen-${Date.now()}`;

    const calcs = calculatePanenFields({
      timbanganRamKg: data.timbanganRamKg,
      timbanganPksKg: data.timbanganPksKg,
      hargaTbsPerKg: data.hargaTbsPerKg,
      potonganPedaranKg: data.potonganPedaranKg,
      potonganIuranKasRupiah: data.potonganIuranKasRupiah,
      upahPemanenRupiah: data.upahPemanenRupiah,
      kasbonPupukRupiah: data.kasbonPupukRupiah,
    });

    const newRecord: PanenRecord = {
      ...data,
      id: newId,
      noSpb,
      ...calcs,
      statusPembayaran: data.statusPembayaran || 'Draft',
    };

    const nextPanenList = [newRecord, ...panenList];
    setPanenList(nextPanenList);
    // Sinkronisasi otomatis Kas Masuk Medaran Armada (Kg Medaran Armada × Harga TBS periode panen)
    setKasList(prev => syncKasWithArmadaMedaran(prev, nextPanenList));

    // Jika ada kasbon yang dipotong, kurangi sisa pinjaman
    if (calcs.kasbonPupukRupiah > 0) {
      setPinjamanList(prev => prev.map(pinjam => {
        if (pinjam.petaniId === data.petaniId && pinjam.status === 'Aktif') {
          const newSisa = Math.max(0, pinjam.sisaPinjaman - calcs.kasbonPupukRupiah);
          return {
            ...pinjam,
            sisaPinjaman: newSisa,
            status: newSisa === 0 ? 'Lunas' : 'Aktif',
          };
        }
        return pinjam;
      }));
    }

    return newRecord;
  };

  const importPanenList = (
    dataList: (Omit<PanenRecord, 'id' | 'noSpb' | 'selisihKg' | 'persentaseSelisih' | 'totalBruto' | 'potonganPedaranRupiah' | 'totalPotongan' | 'totalNetto'> & Partial<PanenRecord>)[],
    mode: 'append' | 'replace' = 'append'
  ): number => {
    let nextNum = mode === 'replace' ? 1 : panenList.length + 1;
    const today = new Date().toISOString().split('T')[0];

    const newRecords: PanenRecord[] = dataList.map((data, idx) => {
      const dateStr = data.tanggal || today;
      const [year, month] = dateStr.split('-');
      const noSpb = data.noSpb || `SPB-BS/${year || '2026'}/${month || '08'}/${String(nextNum + idx).padStart(3, '0')}`;
      const newId = `panen-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;

      const calcs = calculatePanenFields({
        timbanganRamKg: data.timbanganRamKg,
        timbanganPksKg: data.timbanganPksKg,
        hargaTbsPerKg: data.hargaTbsPerKg,
        potonganPedaranKg: data.potonganPedaranKg,
        potonganIuranKasRupiah: data.potonganIuranKasRupiah,
        upahPemanenRupiah: data.upahPemanenRupiah,
        kasbonPupukRupiah: data.kasbonPupukRupiah,
      });

      return {
        id: newId,
        noSpb,
        tanggal: dateStr,
        petaniId: data.petaniId || 'unknown',
        petaniNama: data.petaniNama || 'Petani',
        blokLahan: data.blokLahan || 'Blok Kebun',
        timbanganRamKg: data.timbanganRamKg || 0,
        timbanganPksKg: data.timbanganPksKg || 0,
        hargaTbsPerKg: data.hargaTbsPerKg || (pengaturan.hargaTbsDefault || 2780),
        ...calcs,
        namaPks: data.namaPks || pengaturan.namaPksDefault || 'PT. Sawit Sejahtera Tapung',
        platTruk: data.platTruk || 'BM 8412 TA',
        namaSopir: data.namaSopir || 'Pak Eko',
        namaPemanen: data.namaPemanen || 'Regu Panen',
        statusPembayaran: data.statusPembayaran || 'Siap Bayar',
        catatan: data.catatan || '',
      };
    });

    const combinedList = mode === 'replace' ? newRecords : [...newRecords, ...panenList];
    setPanenList(combinedList);
    setKasList(prev => syncKasWithArmadaMedaran(prev, combinedList));

    return newRecords.length;
  };

  const updatePanen = (id: string, data: Partial<PanenRecord>) => {
    let nextPanenList: PanenRecord[] = [];

    setPanenList(prev => {
      nextPanenList = prev.map(item => {
        if (item.id !== id) return item;

        const merged = { ...item, ...data };
        const calcs = calculatePanenFields({
          timbanganRamKg: merged.timbanganRamKg,
          timbanganPksKg: merged.timbanganPksKg,
          hargaTbsPerKg: merged.hargaTbsPerKg,
          potonganPedaranKg: merged.potonganPedaranKg,
          potonganIuranKasRupiah: merged.potonganIuranKasRupiah,
          upahPemanenRupiah: merged.upahPemanenRupiah,
          kasbonPupukRupiah: merged.kasbonPupukRupiah,
        });

        return {
          ...merged,
          ...calcs,
        };
      });
      return nextPanenList;
    });

    // Update otomatis entri arus kas masuk hasil medaran armada terkait perubahan ini
    setKasList(prev => syncKasWithArmadaMedaran(prev, nextPanenList));
  };

  const batchUpdatePanen = (updates: { id: string; data: Partial<PanenRecord> }[]) => {
    const updateMap = new Map(updates.map(u => [u.id, u.data]));
    let nextPanenList: PanenRecord[] = [];

    setPanenList(prev => {
      nextPanenList = prev.map(item => {
        const patch = updateMap.get(item.id);
        if (!patch) return item;

        const merged = { ...item, ...patch };
        const calcs = calculatePanenFields({
          timbanganRamKg: merged.timbanganRamKg,
          timbanganPksKg: merged.timbanganPksKg,
          hargaTbsPerKg: merged.hargaTbsPerKg,
          potonganPedaranKg: merged.potonganPedaranKg,
          potonganIuranKasRupiah: merged.potonganIuranKasRupiah,
          upahPemanenRupiah: merged.upahPemanenRupiah,
          kasbonPupukRupiah: merged.kasbonPupukRupiah,
        });

        return {
          ...merged,
          ...calcs,
        };
      });
      return nextPanenList;
    });

    // Sinkronisasi otomatis arus kas masuk medaran armada
    setKasList(prev => syncKasWithArmadaMedaran(prev, nextPanenList));
  };

  const deletePanen = (id: string) => {
    const nextPanenList = panenList.filter(p => p.id !== id);
    setPanenList(nextPanenList);
    // Sinkronisasi ulang entri arus kas medaran armada
    setKasList(prev => syncKasWithArmadaMedaran(prev, nextPanenList));
  };

  const batchUpdateStatusPanen = (ids: string[], status: 'Lunas' | 'Siap Bayar' | 'Draft') => {
    const today = new Date().toISOString().split('T')[0];
    setPanenList(prev => prev.map(p => {
      if (ids.includes(p.id)) {
        return {
          ...p,
          statusPembayaran: status,
          tanggalBayar: status === 'Lunas' ? (p.tanggalBayar || today) : undefined,
        };
      }
      return p;
    }));
  };

  // Kas Actions
  const addKas = (data: Omit<KasKelompok, 'id' | 'saldoSetelah'>) => {
    const newKas: KasKelompok = {
      ...data,
      id: `kas-${Date.now()}`,
      saldoSetelah: 0,
    };
    setKasList(prev => recalculateKasBalances([...prev, newKas]));
  };

  const updateKas = (id: string, data: Partial<KasKelompok>) => {
    setKasList(prev => recalculateKasBalances(
      prev.map(k => k.id === id ? { ...k, ...data } : k)
    ));
  };

  const deleteKas = (id: string) => {
    setKasList(prev => recalculateKasBalances(prev.filter(k => k.id !== id)));
  };

  // Pinjaman Actions
  const addPinjaman = (data: Omit<PinjamanKasbon, 'id'>) => {
    const newPinjam: PinjamanKasbon = {
      ...data,
      id: `pinjam-${Date.now()}`,
    };
    setPinjamanList(prev => [newPinjam, ...prev]);
  };

  const updatePinjaman = (id: string, data: Partial<PinjamanKasbon>) => {
    setPinjamanList(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deletePinjaman = (id: string) => {
    setPinjamanList(prev => prev.filter(p => p.id !== id));
  };

  // Pengaturan
  const updatePengaturan = (data: Partial<PengaturanKelompok>) => {
    setPengaturan(prev => ({ ...prev, ...data }));
  };

  // Reset to default data
  const resetToDefault = () => {
    setPetaniList(initialPetani);
    setArmadaList(initialArmada);
    setPanenList(initialPanen);
    setKasList(initialKasKelompok);
    setPinjamanList(initialPinjaman);
    setPengaturan(initialPengaturan);
    localStorage.removeItem(STORAGE_KEYS.PETANI);
    localStorage.removeItem(STORAGE_KEYS.ARMADA);
    localStorage.removeItem(STORAGE_KEYS.PANEN);
    localStorage.removeItem(STORAGE_KEYS.KAS);
    localStorage.removeItem(STORAGE_KEYS.PINJAMAN);
    localStorage.removeItem(STORAGE_KEYS.PENGATURAN);
  };

  const resetToDefaultData = resetToDefault;

  // Restore database from backup object
  const restoreDatabase = (backup: DatabaseBackupData, mode: 'replace' | 'merge' = 'replace') => {
    try {
      let newPetani = petaniList;
      let newArmada = armadaList;
      let newPanen = panenList;
      let newKas = kasList;
      let newPinjaman = pinjamanList;
      let newPengaturan = pengaturan;

      if (mode === 'replace') {
        if (backup.petaniList && Array.isArray(backup.petaniList)) {
          newPetani = backup.petaniList;
          setPetaniList(newPetani);
          localStorage.setItem(STORAGE_KEYS.PETANI, JSON.stringify(newPetani));
        }
        if (backup.armadaList && Array.isArray(backup.armadaList)) {
          newArmada = backup.armadaList;
          setArmadaList(newArmada);
          localStorage.setItem(STORAGE_KEYS.ARMADA, JSON.stringify(newArmada));
        }
        if (backup.panenList && Array.isArray(backup.panenList)) {
          newPanen = backup.panenList;
          setPanenList(newPanen);
          localStorage.setItem(STORAGE_KEYS.PANEN, JSON.stringify(newPanen));
        }
        if (backup.kasList && Array.isArray(backup.kasList)) {
          newKas = backup.kasList;
          setKasList(newKas);
          localStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(newKas));
        }
        if (backup.pinjamanList && Array.isArray(backup.pinjamanList)) {
          newPinjaman = backup.pinjamanList;
          setPinjamanList(newPinjaman);
          localStorage.setItem(STORAGE_KEYS.PINJAMAN, JSON.stringify(newPinjaman));
        }
        if (backup.pengaturan && typeof backup.pengaturan === 'object') {
          newPengaturan = { ...pengaturan, ...backup.pengaturan };
          setPengaturan(newPengaturan);
          localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(newPengaturan));
        }
      } else {
        // Merge mode
        if (backup.petaniList && Array.isArray(backup.petaniList)) {
          const existingIds = new Set(petaniList.map(p => p.id));
          const toAdd = backup.petaniList.filter(p => !existingIds.has(p.id));
          newPetani = [...petaniList, ...toAdd];
          setPetaniList(newPetani);
          localStorage.setItem(STORAGE_KEYS.PETANI, JSON.stringify(newPetani));
        }
        if (backup.armadaList && Array.isArray(backup.armadaList)) {
          const existingIds = new Set(armadaList.map(a => a.id));
          const toAdd = backup.armadaList.filter(a => !existingIds.has(a.id));
          newArmada = [...armadaList, ...toAdd];
          setArmadaList(newArmada);
          localStorage.setItem(STORAGE_KEYS.ARMADA, JSON.stringify(newArmada));
        }
        if (backup.panenList && Array.isArray(backup.panenList)) {
          const existingIds = new Set(panenList.map(p => p.id));
          const toAdd = backup.panenList.filter(p => !existingIds.has(p.id));
          newPanen = [...panenList, ...toAdd];
          setPanenList(newPanen);
          localStorage.setItem(STORAGE_KEYS.PANEN, JSON.stringify(newPanen));
        }
        if (backup.kasList && Array.isArray(backup.kasList)) {
          const existingIds = new Set(kasList.map(k => k.id));
          const toAdd = backup.kasList.filter(k => !existingIds.has(k.id));
          newKas = [...kasList, ...toAdd];
          setKasList(newKas);
          localStorage.setItem(STORAGE_KEYS.KAS, JSON.stringify(newKas));
        }
        if (backup.pinjamanList && Array.isArray(backup.pinjamanList)) {
          const existingIds = new Set(pinjamanList.map(p => p.id));
          const toAdd = backup.pinjamanList.filter(p => !existingIds.has(p.id));
          newPinjaman = [...pinjamanList, ...toAdd];
          setPinjamanList(newPinjaman);
          localStorage.setItem(STORAGE_KEYS.PINJAMAN, JSON.stringify(newPinjaman));
        }
        if (backup.pengaturan) {
          newPengaturan = { ...pengaturan, ...backup.pengaturan };
          setPengaturan(newPengaturan);
          localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(newPengaturan));
        }
      }

      return {
        success: true,
        message: 'Pemulihan database berhasil dieksekusi.',
        counts: {
          petani: backup.petaniList?.length || 0,
          armada: backup.armadaList?.length || 0,
          panen: backup.panenList?.length || 0,
          kas: backup.kasList?.length || 0,
          pinjaman: backup.pinjamanList?.length || 0
        }
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal memulihkan database.',
        counts: { petani: 0, armada: 0, panen: 0, kas: 0, pinjaman: 0 }
      };
    }
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        activePetaniId,
        setActivePetaniId,
        activeTab,
        setActiveTab,
        darkMode,
        setDarkMode,
        petaniList,
        armadaList,
        panenList,
        kasList,
        pinjamanList,
        pengaturan,
        addPetani,
        updatePetani,
        deletePetani,
        importPetaniList,
        addArmada,
        updateArmada,
        deleteArmada,
        addPanen,
        importPanenList,
        updatePanen,
        deletePanen,
        batchUpdateStatusPanen,
        addKas,
        updateKas,
        deleteKas,
        addPinjaman,
        updatePinjaman,
        deletePinjaman,
        updatePengaturan,
        selectedPanenForSlip,
        setSelectedPanenForSlip,
        selectedPetaniForSlip,
        setSelectedPetaniForSlip,
        resetToDefault,
        resetToDefaultData,
        restoreDatabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
