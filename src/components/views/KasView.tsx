import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KasKelompok, PinjamanKasbon } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Users, 
  FileText,
  DollarSign,
  AlertCircle,
  Pencil,
  Search,
  Filter,
  Check,
  RefreshCw,
  Clock,
  ChevronDown,
  TrendingUp
} from 'lucide-react';
import { formatRupiah, formatKg, formatTanggalIndo, formatTanggalPendek } from '../../lib/utils';

export const KasView: React.FC = () => {
  const { 
    kasList, 
    pinjamanList, 
    petaniList, 
    panenList,
    pengaturan,
    addKas, 
    updateKas,
    deleteKas, 
    addPinjaman, 
    updatePinjaman, 
    deletePinjaman,
    userRole 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'kas' | 'pinjaman'>('kas');

  // Search & Filter State
  const [kasSearch, setKasSearch] = useState('');
  const [kasFilterJenis, setKasFilterJenis] = useState<'all' | 'Masuk' | 'Keluar'>('all');
  const [kasFilterKategori, setKasFilterKategori] = useState<string>('all');

  const [pinjamSearch, setPinjamSearch] = useState('');
  const [pinjamFilterStatus, setPinjamFilterStatus] = useState<'all' | 'Aktif' | 'Lunas'>('all');

  // Modal Tambah Kas
  const [isKasModalOpen, setIsKasModalOpen] = useState(false);
  const [kasTanggal, setKasTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [kasJenis, setKasJenis] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [kasKategori, setKasKategori] = useState<KasKelompok['kategori']>('Iuran Panen');
  const [kasKeterangan, setKasKeterangan] = useState('');
  const [kasJumlah, setKasJumlah] = useState<number>(500000);
  const [kasBuktiRef, setKasBuktiRef] = useState('');

  // Modal Edit Kas
  const [isEditKasModalOpen, setIsEditKasModalOpen] = useState(false);
  const [editingKasId, setEditingKasId] = useState<string | null>(null);
  const [editKasTanggal, setEditKasTanggal] = useState('');
  const [editKasJenis, setEditKasJenis] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [editKasKategori, setEditKasKategori] = useState<KasKelompok['kategori']>('Iuran Panen');
  const [editKasKeterangan, setEditKasKeterangan] = useState('');
  const [editKasJumlah, setEditKasJumlah] = useState<number>(0);
  const [editKasBuktiRef, setEditKasBuktiRef] = useState('');

  // Modal Tambah Pinjaman
  const [isPinjamModalOpen, setIsPinjamModalOpen] = useState(false);
  const [pinjamPetaniId, setPinjamPetaniId] = useState(petaniList[0]?.id || '');
  const [pinjamTanggal, setPinjamTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [pinjamKeperluan, setPinjamKeperluan] = useState<PinjamanKasbon['keperluan']>('Pupuk NPK & Urea');
  const [pinjamJumlah, setPinjamJumlah] = useState<number>(3000000);
  const [pinjamPotonganPerPanen, setPinjamPotonganPerPanen] = useState<number>(500000);
  const [pinjamKeterangan, setPinjamKeterangan] = useState('');

  // Modal Edit Pinjaman
  const [isEditPinjamModalOpen, setIsEditPinjamModalOpen] = useState(false);
  const [editingPinjamId, setEditingPinjamId] = useState<string | null>(null);
  const [editPinjamPetaniId, setEditPinjamPetaniId] = useState('');
  const [editPinjamTanggal, setEditPinjamTanggal] = useState('');
  const [editPinjamKeperluan, setEditPinjamKeperluan] = useState<PinjamanKasbon['keperluan']>('Pupuk NPK & Urea');
  const [editPinjamJumlah, setEditPinjamJumlah] = useState<number>(0);
  const [editPinjamSisa, setEditPinjamSisa] = useState<number>(0);
  const [editPinjamPotonganPerPanen, setEditPinjamPotonganPerPanen] = useState<number>(0);
  const [editPinjamStatus, setEditPinjamStatus] = useState<'Aktif' | 'Lunas'>('Aktif');
  const [editPinjamKeterangan, setEditPinjamKeterangan] = useState('');

  // Modal Konfirmasi Hapus
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    type: 'kas' | 'pinjaman';
    id: string;
    label: string;
  }>({
    isOpen: false,
    type: 'kas',
    id: '',
    label: '',
  });

  // Kas Calculations
  const currentSaldo = kasList.length > 0 ? kasList[kasList.length - 1].saldoSetelah : 0;
  const totalPemasukan = kasList.filter(k => k.jenis === 'Masuk').reduce((s, k) => s + k.jumlah, 0);
  const totalPengeluaran = kasList.filter(k => k.jenis === 'Keluar').reduce((s, k) => s + k.jumlah, 0);
  const totalMedaranMasuk = kasList.filter(k => k.kategori === 'Medaran' && k.jenis === 'Masuk').reduce((s, k) => s + k.jumlah, 0);
  const jmlTransaksiMedaran = kasList.filter(k => k.kategori === 'Medaran').length;

  // Omset Kelompok Tani dari Selisih Timbangan
  const totalSelisihPanenKg = panenList.reduce((s, p) => s + p.selisihKg, 0);
  const totalOmzetKelompokSelisih = panenList.reduce((s, p) => s + (p.selisihKg * (p.hargaTbsPerKg || pengaturan.hargaTbsDefault || 2780)), 0);

  const handleBukukanOmsetSelisih = () => {
    setKasJenis('Masuk');
    setKasKategori('Selisih Timbangan / Margin Panen');
    setKasKeterangan(`Omset Kelompok Tani: Selisih Timbangan Kebun vs Pabrik (${formatKg(totalSelisihPanenKg)} @ ${formatRupiah(pengaturan.hargaTbsDefault)}/kg)`);
    setKasJumlah(totalOmzetKelompokSelisih);
    setKasBuktiRef(`OMZET-PANEN-${new Date().toISOString().slice(0, 7)}`);
    setIsKasModalOpen(true);
  };

  // Pinjaman Calculations
  const totalPinjamanAktif = pinjamanList.filter(p => p.status === 'Aktif').reduce((s, p) => s + p.sisaPinjaman, 0);
  const jmlPeminjamAktif = pinjamanList.filter(p => p.status === 'Aktif').length;

  // Filtered Kas List
  const filteredKasList = kasList.filter(k => {
    if (kasFilterJenis !== 'all' && k.jenis !== kasFilterJenis) return false;
    if (kasFilterKategori !== 'all' && k.kategori !== kasFilterKategori) return false;
    if (kasSearch) {
      const q = kasSearch.toLowerCase();
      const matchKet = k.keterangan.toLowerCase().includes(q);
      const matchKat = k.kategori.toLowerCase().includes(q);
      const matchRef = (k.buktiRef || '').toLowerCase().includes(q);
      if (!matchKet && !matchKat && !matchRef) return false;
    }
    return true;
  });

  // Filtered Pinjaman List
  const filteredPinjamanList = pinjamanList.filter(p => {
    if (pinjamFilterStatus !== 'all' && p.status !== pinjamFilterStatus) return false;
    if (pinjamSearch) {
      const q = pinjamSearch.toLowerCase();
      const matchNama = p.petaniNama.toLowerCase().includes(q);
      const matchKep = p.keperluan.toLowerCase().includes(q);
      const matchKet = p.keterangan.toLowerCase().includes(q);
      if (!matchNama && !matchKep && !matchKet) return false;
    }
    return true;
  });

  // --- Handlers Kas ---
  const handleSaveKas = (e: React.FormEvent) => {
    e.preventDefault();
    if (kasJumlah <= 0) return;

    addKas({
      tanggal: kasTanggal,
      jenis: kasJenis,
      kategori: kasKategori,
      keterangan: kasKeterangan,
      jumlah: Number(kasJumlah),
      buktiRef: kasBuktiRef || `KAS-${Date.now().toString().slice(-4)}`,
    });

    setIsKasModalOpen(false);
    setKasKeterangan('');
    setKasJumlah(500000);
    setKasBuktiRef('');
  };

  const openEditKas = (kas: KasKelompok) => {
    setEditingKasId(kas.id);
    setEditKasTanggal(kas.tanggal);
    setEditKasJenis(kas.jenis);
    setEditKasKategori(kas.kategori);
    setEditKasKeterangan(kas.keterangan);
    setEditKasJumlah(kas.jumlah);
    setEditKasBuktiRef(kas.buktiRef || '');
    setIsEditKasModalOpen(true);
  };

  const handleUpdateKas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKasId || editKasJumlah <= 0) return;

    updateKas(editingKasId, {
      tanggal: editKasTanggal,
      jenis: editKasJenis,
      kategori: editKasKategori,
      keterangan: editKasKeterangan,
      jumlah: Number(editKasJumlah),
      buktiRef: editKasBuktiRef,
    });

    setIsEditKasModalOpen(false);
    setEditingKasId(null);
  };

  // --- Handlers Pinjaman ---
  const handleSavePinjam = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = petaniList.find(p => p.id === pinjamPetaniId);
    if (!pet || pinjamJumlah <= 0) return;

    addPinjaman({
      petaniId: pinjamPetaniId,
      petaniNama: pet.nama,
      tanggalPinjam: pinjamTanggal,
      keperluan: pinjamKeperluan,
      jumlahPinjaman: Number(pinjamJumlah),
      sisaPinjaman: Number(pinjamJumlah),
      potonganPerPanen: Number(pinjamPotonganPerPanen),
      status: 'Aktif',
      keterangan: pinjamKeterangan || `Pinjaman ${pinjamKeperluan} untuk ${pet.nama}`,
    });

    setIsPinjamModalOpen(false);
    setPinjamJumlah(3000000);
    setPinjamKeterangan('');
  };

  const openEditPinjam = (item: PinjamanKasbon) => {
    setEditingPinjamId(item.id);
    setEditPinjamPetaniId(item.petaniId);
    setEditPinjamTanggal(item.tanggalPinjam);
    setEditPinjamKeperluan(item.keperluan);
    setEditPinjamJumlah(item.jumlahPinjaman);
    setEditPinjamSisa(item.sisaPinjaman);
    setEditPinjamPotonganPerPanen(item.potonganPerPanen);
    setEditPinjamStatus(item.status);
    setEditPinjamKeterangan(item.keterangan);
    setIsEditPinjamModalOpen(true);
  };

  const handleUpdatePinjam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPinjamId || editPinjamJumlah <= 0) return;

    const pet = petaniList.find(p => p.id === editPinjamPetaniId);
    const petaniNama = pet ? pet.nama : (pinjamanList.find(p => p.id === editingPinjamId)?.petaniNama || '');

    updatePinjaman(editingPinjamId, {
      petaniId: editPinjamPetaniId,
      petaniNama,
      tanggalPinjam: editPinjamTanggal,
      keperluan: editPinjamKeperluan,
      jumlahPinjaman: Number(editPinjamJumlah),
      sisaPinjaman: Number(editPinjamSisa),
      potonganPerPanen: Number(editPinjamPotonganPerPanen),
      status: editPinjamSisa === 0 ? 'Lunas' : editPinjamStatus,
      keterangan: editPinjamKeterangan,
    });

    setIsEditPinjamModalOpen(false);
    setEditingPinjamId(null);
  };

  // --- Confirm Delete ---
  const handleExecuteDelete = () => {
    if (deleteConfirmModal.type === 'kas') {
      deleteKas(deleteConfirmModal.id);
    } else {
      deletePinjaman(deleteConfirmModal.id);
    }
    setDeleteConfirmModal({ isOpen: false, type: 'kas', id: '', label: '' });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600 dark:text-green-500" />
            <span>Kas & Pinjaman Pupuk Kelompok Tani</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pengelolaan buku kas operasional, akumulasi iuran panen, dan pencatatan kasbon pupuk anggota beserta fitur edit & pembaruan data.
          </p>
        </div>

        {userRole === 'admin' && (
          <div className="flex items-center gap-3">
            {activeSubTab === 'kas' ? (
              <button
                type="button"
                onClick={() => setIsKasModalOpen(true)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Catat Transaksi Kas</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsPinjamModalOpen(true)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Kasbon Pupuk</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveSubTab('kas')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'kas'
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
              : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Buku Kas Kelompok Tani</span>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">
            {kasList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pinjaman')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'pinjaman'
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
              : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pinjaman & Kasbon Pupuk</span>
          <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-mono border border-amber-500/20">
            {jmlPeminjamAktif} Aktif
          </span>
        </button>
      </div>

      {/* VIEW 1: BUKU KAS */}
      {activeSubTab === 'kas' && (
        <div className="space-y-6">
          {/* Kas KPI Summary Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 text-white p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-green-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider relative z-10">Saldo Kas Saat Ini</span>
              <p className="text-2xl sm:text-3xl font-black text-green-400 font-mono mt-1 relative z-10">{formatRupiah(currentSaldo)}</p>
              <span className="text-[11px] text-slate-400 mt-1 block relative z-10">Kas operasional & simpanan kelompok</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Pemasukan Kas</span>
              <p className="text-2xl font-black text-green-600 dark:text-green-400 font-mono mt-1">+{formatRupiah(totalPemasukan)}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Dari iuran panen, medaran & usaha</span>
            </div>

            <div className="bg-emerald-500/10 dark:bg-emerald-950/30 p-5 rounded-xl border border-emerald-500/30 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">Arus Kas Masuk: Nominal Medaran</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">+{formatRupiah(totalMedaranMasuk)}</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">
                Otomatis dari Monitoring Pengangkutan ({jmlTransaksiMedaran} rit armada @ Medaran × Harga Panen)
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Pengeluaran Kas</span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">-{formatRupiah(totalPengeluaran)}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">Perawatan jalan, ATK & operasional</span>
            </div>
          </div>

          {/* Banner: Omset Kelompok Tani dari Selisih Timbangan Panen */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-xl border border-emerald-800/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Omset Kelompok Tani (Selisih Timbangan Periode Ini)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Kebun vs Pabrik
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {formatRupiah(totalOmzetKelompokSelisih)}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    (Total Selisih {formatKg(totalSelisihPanenKg)} × {formatRupiah(pengaturan.hargaTbsDefault)}/kg)
                  </span>
                </div>
              </div>
            </div>

            {userRole === 'admin' && (
              <button
                type="button"
                onClick={handleBukukanOmsetSelisih}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Bukukan ke Kas Masuk</span>
              </button>
            )}
          </div>

          {/* Filter & Search Bar Kas */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari transaksi / keterangan / no ref..."
                value={kasSearch}
                onChange={(e) => setKasSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={kasFilterJenis}
                onChange={(e) => setKasFilterJenis(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="all">Semua Jenis Kas</option>
                <option value="Masuk">Pemasukan (+)</option>
                <option value="Keluar">Pengeluaran (-)</option>
              </select>

              <select
                value={kasFilterKategori}
                onChange={(e) => setKasFilterKategori(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="all">Semua Kategori</option>
                <option value="Iuran Panen">Iuran Panen</option>
                <option value="Iuran Bulanan">Iuran Bulanan</option>
                <option value="Medaran">Medaran</option>
                <option value="Selisih Timbangan / Margin Panen">Selisih Timbangan / Margin Panen</option>
                <option value="Penjualan Pupuk">Penjualan Pupuk</option>
                <option value="Perawatan Jalan Kebun">Perawatan Jalan Kebun</option>
                <option value="Operasional Pengurus">Operasional Pengurus</option>
                <option value="Sosial & Santunan">Sosial & Santunan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Kas Transactions Table Bento Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Buku Besar Arus Kas Kelompok Tani Bunga Sari
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Menampilkan {filteredKasList.length} dari {kasList.length} transaksi kas
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-6">Tanggal & Ref</th>
                    <th className="p-3.5">Kategori Transaksi</th>
                    <th className="p-3.5">Keterangan / Uraian</th>
                    <th className="p-3.5 text-right">Pemasukan (Rp)</th>
                    <th className="p-3.5 text-right">Pengeluaran (Rp)</th>
                    <th className="p-3.5 text-right font-bold text-green-600 dark:text-green-400">Saldo Akhir (Rp)</th>
                    {userRole === 'admin' && <th className="p-3.5 pr-6 text-center w-28">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredKasList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Tidak ada transaksi kas yang sesuai dengan pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    filteredKasList.map((kas) => (
                      <tr key={kas.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 pl-6">
                          <p className="font-bold text-slate-900 dark:text-white">{formatTanggalPendek(kas.tanggal)}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{kas.buktiRef || kas.id}</p>
                        </td>

                        <td className="p-3.5">
                          {kas.kategori === 'Medaran' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Medaran
                            </span>
                          ) : (
                            <Badge
                              variant={kas.jenis === 'Masuk' ? 'success' : 'danger'}
                              size="sm"
                              dot
                            >
                              {kas.kategori}
                            </Badge>
                          )}
                        </td>

                        <td className="p-3.5 max-w-sm">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{kas.keterangan}</p>
                          {kas.kategori === 'Medaran' && (
                            <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                              Otomatis dari Armada Truk (Periode Panen)
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-green-600 dark:text-green-400">
                          {kas.jenis === 'Masuk' ? `+${formatRupiah(kas.jumlah)}` : '-'}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {kas.jenis === 'Keluar' ? `-${formatRupiah(kas.jumlah)}` : '-'}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(kas.saldoSetelah)}
                        </td>

                        {userRole === 'admin' && (
                          <td className="p-3.5 pr-6 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditKas(kas)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 dark:hover:text-green-400 transition-colors cursor-pointer"
                                title="Edit Transaksi Kas"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteConfirmModal({
                                  isOpen: true,
                                  type: 'kas',
                                  id: kas.id,
                                  label: `Transaksi ${kas.kategori} (${formatRupiah(kas.jumlah)})`,
                                })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                title="Hapus Transaksi Kas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PINJAMAN & KASBON PUPUK */}
      {activeSubTab === 'pinjaman' && (
        <div className="space-y-6">
          {/* Pinjaman KPI Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-amber-500/10 dark:bg-amber-950/40 p-5 rounded-xl border border-amber-500/30">
              <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider">Total Sisa Pinjaman Kasbon Aktif</span>
              <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {formatRupiah(totalPinjamanAktif)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Akan dipotong otomatis saat panen berikutnya
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Anggota Memiliki Pinjaman</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {jmlPeminjamAktif} Petani
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Fasilitas pupuk subsidi & pemeliharaan kebun</span>
            </div>
          </div>

          {/* Filter & Search Bar Pinjaman */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama petani / keperluan pinjaman..."
                value={pinjamSearch}
                onChange={(e) => setPinjamSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={pinjamFilterStatus}
                onChange={(e) => setPinjamFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="all">Semua Status Pinjaman</option>
                <option value="Aktif">Hanya Aktif (Belum Lunas)</option>
                <option value="Lunas">Hanya Lunas</option>
              </select>
            </div>
          </div>

          {/* Pinjaman Cards & Table Bento Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Daftar Pinjaman & Fasilitas Kasbon Pupuk Anggota
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Menampilkan {filteredPinjamanList.length} data pinjaman kasbon petani
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 pl-6">Nama Petani</th>
                    <th className="p-3.5">Tanggal & Keperluan</th>
                    <th className="p-3.5 text-right">Jumlah Awal</th>
                    <th className="p-3.5 text-right">Potongan / Panen</th>
                    <th className="p-3.5 text-right font-bold text-rose-600 dark:text-rose-400">Sisa Hutang</th>
                    <th className="p-3.5 text-center">Status</th>
                    {userRole === 'admin' && <th className="p-3.5 pr-6 text-center w-36">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredPinjamanList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Tidak ada catatan pinjaman kasbon yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredPinjamanList.map((item) => {
                      const progressLunas = item.jumlahPinjaman > 0 
                        ? Math.min(100, Math.max(0, ((item.jumlahPinjaman - item.sisaPinjaman) / item.jumlahPinjaman) * 100))
                        : 100;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 pl-6">
                            <p className="font-bold text-slate-900 dark:text-white">{item.petaniNama}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{item.keterangan}</p>
                          </td>

                          <td className="p-3.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{item.keperluan}</p>
                            <p className="text-[11px] text-slate-400">{formatTanggalPendek(item.tanggalPinjam)}</p>
                          </td>

                          <td className="p-3.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {formatRupiah(item.jumlahPinjaman)}
                          </td>

                          <td className="p-3.5 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                            {formatRupiah(item.potonganPerPanen)}
                          </td>

                          <td className="p-3.5 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                            {formatRupiah(item.sisaPinjaman)}
                            <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden ml-auto mt-1">
                              <div 
                                className="bg-green-600 h-full rounded-full transition-all"
                                style={{ width: `${progressLunas}%` }}
                              />
                            </div>
                          </td>

                          <td className="p-3.5 text-center">
                            <Badge variant={item.status === 'Lunas' ? 'success' : 'warning'} size="sm">
                              {item.status} ({progressLunas.toFixed(0)}% Lunas)
                            </Badge>
                          </td>

                          {userRole === 'admin' && (
                            <td className="p-3.5 pr-6 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditPinjam(item)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 dark:hover:text-green-400 transition-colors cursor-pointer"
                                  title="Edit Kasbon Petani"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                {item.status === 'Aktif' ? (
                                  <button
                                    type="button"
                                    onClick={() => updatePinjaman(item.id, { sisaPinjaman: 0, status: 'Lunas' })}
                                    className="px-2 py-1 rounded-md text-[11px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors cursor-pointer whitespace-nowrap"
                                    title="Tandai Pinjaman Ini Sudah Lunas Sepenuhnya"
                                  >
                                    Lunas
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => updatePinjaman(item.id, { sisaPinjaman: item.jumlahPinjaman, status: 'Aktif' })}
                                    className="px-2 py-1 rounded-md text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer whitespace-nowrap"
                                    title="Aktifkan kembali pinjaman"
                                  >
                                    Aktifkan
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmModal({
                                    isOpen: true,
                                    type: 'pinjaman',
                                    id: item.id,
                                    label: `Kasbon ${item.petaniNama} (${formatRupiah(item.jumlahPinjaman)})`,
                                  })}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Hapus Catatan Pinjaman"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Transaksi Kas */}
      <Modal
        isOpen={isKasModalOpen}
        onClose={() => setIsKasModalOpen(false)}
        maxWidth="lg"
        title="Catat Transaksi Kas Kelompok"
        description="Pencatatan kas masuk atau pengeluaran dana operasional kelompok tani."
      >
        <form onSubmit={handleSaveKas} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal *
              </label>
              <input
                type="date"
                value={kasTanggal}
                onChange={(e) => setKasTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Kas *
              </label>
              <select
                value={kasJenis}
                onChange={(e) => setKasJenis(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="Masuk">Kas Masuk (+ Pemasukan)</option>
                <option value="Keluar">Kas Keluar (- Pengeluaran)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Transaksi *
              </label>
              <select
                value={kasKategori}
                onChange={(e) => setKasKategori(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="Iuran Panen">Iuran Panen Petani</option>
                <option value="Iuran Bulanan">Iuran Bulanan Anggota</option>
                <option value="Medaran">Medaran / Pedaran Potongan</option>
                <option value="Selisih Timbangan / Margin Panen">Selisih Timbangan / Margin Panen</option>
                <option value="Penjualan Pupuk">Penjualan Pupuk / Laba Usaha</option>
                <option value="Perawatan Jalan Kebun">Perawatan Jalan / Jembatan Kebun</option>
                <option value="Operasional Pengurus">Operasional Pengurus & ATK</option>
                <option value="Sosial & Santunan">Dana Sosial & Santunan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Referensi / Bukti
              </label>
              <input
                type="text"
                value={kasBuktiRef}
                onChange={(e) => setKasBuktiRef(e.target.value)}
                placeholder="Contoh: KAS-2026-088 atau No Kwitansi"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jumlah Nominal (Rp) *
            </label>
            <input
              type="number"
              min="1000"
              step="10000"
              value={kasJumlah}
              onChange={(e) => setKasJumlah(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {formatRupiah(kasJumlah)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keterangan Lengkap / Uraian *
            </label>
            <textarea
              value={kasKeterangan}
              onChange={(e) => setKasKeterangan(e.target.value)}
              placeholder="Contoh: Sewa alat berat grader jalan Blok B..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsKasModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm cursor-pointer"
            >
              Simpan Transaksi Kas
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal EDIT Transaksi Kas */}
      <Modal
        isOpen={isEditKasModalOpen}
        onClose={() => setIsEditKasModalOpen(false)}
        maxWidth="lg"
        title="Edit Transaksi Kas Kelompok"
        description="Perbarui informasi data transaksi kas yang sudah tercatat."
      >
        <form onSubmit={handleUpdateKas} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Transaksi *
              </label>
              <input
                type="date"
                value={editKasTanggal}
                onChange={(e) => setEditKasTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Kas *
              </label>
              <select
                value={editKasJenis}
                onChange={(e) => setEditKasJenis(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="Masuk">Kas Masuk (+ Pemasukan)</option>
                <option value="Keluar">Kas Keluar (- Pengeluaran)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Transaksi *
              </label>
              <select
                value={editKasKategori}
                onChange={(e) => setEditKasKategori(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="Iuran Panen">Iuran Panen Petani</option>
                <option value="Iuran Bulanan">Iuran Bulanan Anggota</option>
                <option value="Medaran">Medaran / Pedaran Potongan</option>
                <option value="Selisih Timbangan / Margin Panen">Selisih Timbangan / Margin Panen</option>
                <option value="Penjualan Pupuk">Penjualan Pupuk / Laba Usaha</option>
                <option value="Perawatan Jalan Kebun">Perawatan Jalan / Jembatan Kebun</option>
                <option value="Operasional Pengurus">Operasional Pengurus & ATK</option>
                <option value="Sosial & Santunan">Dana Sosial & Santunan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Referensi / Bukti
              </label>
              <input
                type="text"
                value={editKasBuktiRef}
                onChange={(e) => setEditKasBuktiRef(e.target.value)}
                placeholder="Contoh: KAS-2026-088"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jumlah Nominal (Rp) *
            </label>
            <input
              type="number"
              min="1000"
              step="10000"
              value={editKasJumlah}
              onChange={(e) => setEditKasJumlah(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {formatRupiah(editKasJumlah)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keterangan Lengkap / Uraian *
            </label>
            <textarea
              value={editKasKeterangan}
              onChange={(e) => setEditKasKeterangan(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditKasModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Pinjaman / Kasbon */}
      <Modal
        isOpen={isPinjamModalOpen}
        onClose={() => setIsPinjamModalOpen(false)}
        maxWidth="lg"
        title="Fasilitasi Kasbon Pupuk Anggota"
        description="Pemberian fasilitas kredit pupuk subsidi / modal kebun yang akan dipotong saat panen."
      >
        <form onSubmit={handleSavePinjam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Petani Peminjam *
            </label>
            <select
              value={pinjamPetaniId}
              onChange={(e) => setPinjamPetaniId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              required
            >
              {petaniList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.blokLahan})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pengajuan *
              </label>
              <input
                type="date"
                value={pinjamTanggal}
                onChange={(e) => setPinjamTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Keperluan *
              </label>
              <select
                value={pinjamKeperluan}
                onChange={(e) => setPinjamKeperluan(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="Pupuk NPK & Urea">Pupuk NPK & Urea</option>
                <option value="Bibit Sawit Unggul">Bibit Sawit Unggul</option>
                <option value="Herbisida / Racun">Herbisida / Racun Gulma</option>
                <option value="Alat Egrek / Dodos">Alat Egrek / Dodos Panen</option>
                <option value="Kebutuhan Mendesak">Kebutuhan Mendesak</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Pinjaman (Rp) *
              </label>
              <input
                type="number"
                min="100000"
                step="100000"
                value={pinjamJumlah}
                onChange={(e) => setPinjamJumlah(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {formatRupiah(pinjamJumlah)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Potongan per Panen (Rp) *
              </label>
              <input
                type="number"
                min="50000"
                step="50000"
                value={pinjamPotonganPerPanen}
                onChange={(e) => setPinjamPotonganPerPanen(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {formatRupiah(pinjamPotonganPerPanen)} / SPB
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Khusus
            </label>
            <input
              type="text"
              value={pinjamKeterangan}
              onChange={(e) => setPinjamKeterangan(e.target.value)}
              placeholder="Contoh: 10 sak pupuk NPK Mahkota..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPinjamModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm cursor-pointer"
            >
              Simpan Pinjaman Pupuk
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal EDIT Pinjaman / Kasbon */}
      <Modal
        isOpen={isEditPinjamModalOpen}
        onClose={() => setIsEditPinjamModalOpen(false)}
        maxWidth="lg"
        title="Edit Catatan Kasbon / Pinjaman Petani"
        description="Perbarui informasi pinjaman, sisa hutang, potongan per panen, atau status kelunasan."
      >
        <form onSubmit={handleUpdatePinjam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Petani Peminjam *
            </label>
            <select
              value={editPinjamPetaniId}
              onChange={(e) => setEditPinjamPetaniId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              required
            >
              {petaniList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.blokLahan})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pengajuan *
              </label>
              <input
                type="date"
                value={editPinjamTanggal}
                onChange={(e) => setEditPinjamTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Keperluan *
              </label>
              <select
                value={editPinjamKeperluan}
                onChange={(e) => setEditPinjamKeperluan(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="Pupuk NPK & Urea">Pupuk NPK & Urea</option>
                <option value="Bibit Sawit Unggul">Bibit Sawit Unggul</option>
                <option value="Herbisida / Racun">Herbisida / Racun Gulma</option>
                <option value="Alat Egrek / Dodos">Alat Egrek / Dodos Panen</option>
                <option value="Kebutuhan Mendesak">Kebutuhan Mendesak</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Awal Pinjaman (Rp) *
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={editPinjamJumlah}
                onChange={(e) => setEditPinjamJumlah(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {formatRupiah(editPinjamJumlah)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sisa Hutang Saat Ini (Rp) *
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={editPinjamSisa}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEditPinjamSisa(val);
                  if (val === 0) setEditPinjamStatus('Lunas');
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 outline-none"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {formatRupiah(editPinjamSisa)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Potongan per Panen (Rp) *
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={editPinjamPotonganPerPanen}
                onChange={(e) => setEditPinjamPotonganPerPanen(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 outline-none"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {formatRupiah(editPinjamPotonganPerPanen)} / Panen
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status Pinjaman *
            </label>
            <select
              value={editPinjamStatus}
              onChange={(e) => {
                const s = e.target.value as any;
                setEditPinjamStatus(s);
                if (s === 'Lunas') setEditPinjamSisa(0);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="Aktif">Aktif (Masih Ada Tagihan)</option>
              <option value="Lunas">Lunas (Sisa Hutang Rp 0)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Khusus
            </label>
            <textarea
              value={editPinjamKeterangan}
              onChange={(e) => setEditPinjamKeterangan(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditPinjamModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, type: 'kas', id: '', label: '' })}
        maxWidth="sm"
        title="Konfirmasi Hapus Data"
        description="Apakah Anda yakin ingin menghapus catatan data ini secara permanen?"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{deleteConfirmModal.label}</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                Tindakan ini tidak dapat dibatalkan dan saldo kas / rekap pinjaman akan otomatis diperbarui.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmModal({ isOpen: false, type: 'kas', id: '', label: '' })}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteDelete}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              Hapus Permanen
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
