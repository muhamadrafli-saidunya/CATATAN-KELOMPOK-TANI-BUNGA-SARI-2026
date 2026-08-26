import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Petani } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ImportPetaniModal } from '../petani/ImportPetaniModal';
import { 
  Users, 
  Search, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar, 
  Scale, 
  FileText,
  UserCheck,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { formatKg, formatRupiah, formatTanggalPendek } from '../../lib/utils';
import { exportPetaniToExcel, downloadPetaniExcelTemplate } from '../../lib/excelHelper';

interface PetaniViewProps {
  onOpenAddPanenWithPetani?: (petaniId: string) => void;
}

export const PetaniView: React.FC<PetaniViewProps> = ({ onOpenAddPanenWithPetani }) => {
  const { petaniList, panenList, addPetani, updatePetani, deletePetani, userRole, setActiveTab } = useApp();

  const [search, setSearch] = useState('');
  const [selectedBlok, setSelectedBlok] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPetani, setEditingPetani] = useState<Petani | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [noHp, setNoHp] = useState('');
  const [blokLahan, setBlokLahan] = useState('Blok A (Utara)');
  const [luasHa, setLuasHa] = useState<number>(2.5);
  const [jmlPokok, setJmlPokok] = useState<number>(340);
  const [noRekening, setNoRekening] = useState('');
  const [bank, setBank] = useState('BRI');
  const [statusAktif, setStatusAktif] = useState<boolean>(true);

  const openAddModal = () => {
    setEditingPetani(null);
    setNama('');
    setNik('');
    setNoHp('08');
    setBlokLahan('Blok A (Utara)');
    setLuasHa(2.0);
    setJmlPokok(280);
    setNoRekening('');
    setBank('BRI');
    setStatusAktif(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Petani) => {
    setEditingPetani(p);
    setNama(p.nama);
    setNik(p.nik);
    setNoHp(p.noHp);
    setBlokLahan(p.blokLahan);
    setLuasHa(p.luasHa);
    setJmlPokok(p.jmlPokok);
    setNoRekening(p.noRekening);
    setBank(p.bank);
    setStatusAktif(p.statusAktif);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    if (editingPetani) {
      updatePetani(editingPetani.id, {
        nama,
        nik,
        noHp,
        blokLahan,
        luasHa: Number(luasHa),
        jmlPokok: Number(jmlPokok),
        noRekening,
        bank,
        statusAktif,
      });
    } else {
      addPetani({
        nama,
        nik: nik || `140101${Date.now().toString().slice(-10)}`,
        noHp,
        blokLahan,
        luasHa: Number(luasHa),
        jmlPokok: Number(jmlPokok),
        noRekening: noRekening || '1234-01-000000-50-1',
        bank,
        tanggalGabung: new Date().toISOString().split('T')[0],
        statusAktif,
      });
    }

    setIsModalOpen(false);
  };

  // Farmer analytics
  const farmerStats = useMemo(() => {
    return petaniList.map(p => {
      const harvests = panenList.filter(h => h.petaniId === p.id);
      const totalKg = harvests.reduce((s, h) => s + h.timbanganPksKg, 0);
      const totalNetto = harvests.reduce((s, h) => s + h.totalNetto, 0);
      return {
        ...p,
        totalHarvests: harvests.length,
        totalKg,
        totalNetto,
      };
    }).filter(p => {
      const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase()) ||
                          p.blokLahan.toLowerCase().includes(search.toLowerCase()) ||
                          p.noHp.includes(search);
      const matchBlok = selectedBlok === 'all' || p.blokLahan.includes(selectedBlok);
      return matchSearch && matchBlok;
    });
  }, [petaniList, panenList, search, selectedBlok]);

  const totalHa = petaniList.reduce((s, p) => s + p.luasHa, 0);

  const handleExportExcel = () => {
    exportPetaniToExcel(petaniList);
  };

  const handleDownloadTemplate = () => {
    downloadPetaniExcelTemplate();
  };

  const handleExportCsv = () => {
    const headers = 'Nama Lengkap,NIK,No HP/WhatsApp,Blok Lahan,Luas Ha,Jumlah Pokok,Bank,No Rekening,Status,Tanggal Gabung\n';
    const rows = petaniList.map(p => 
      `"${p.nama}","${p.nik}","${p.noHp}","${p.blokLahan}",${p.luasHa},${p.jmlPokok},"${p.bank}","${p.noRekening}","${p.statusAktif ? 'Aktif' : 'Nonaktif'}","${p.tanggalGabung}"`
    ).join('\n');
    
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Petani_Kelompok_Tani_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600 dark:text-green-500" />
            <span>Data Anggota Kelompok Tani ({petaniList.length} Petani)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Data kebun, luas lahan, rekening bank penyaluran hasil panen, dan produktivitas sawit.
          </p>
        </div>

        {userRole === 'admin' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Unduh Template Excel (.xlsx) Rapi Siap Isi"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span>Template Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Impor massal dari file Excel (.xlsx) atau CSV"
            >
              <Upload className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span>Impor Data Petani</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Unduh seluruh data anggota saat ini dalam format Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Ekspor Excel</span>
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Anggota</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Anggota</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{petaniList.length} Orang</p>
          <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold">100% Terdata</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Luas Hamparan</p>
          <p className="text-2xl font-black text-green-600 dark:text-green-400 font-mono mt-1">{totalHa.toFixed(1)} Ha</p>
          <p className="text-[11px] text-slate-400">Rata-rata {(totalHa / petaniList.length).toFixed(1)} Ha/petani</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Blok Terkelola</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">4 Blok Lahan</p>
          <p className="text-[11px] text-slate-400">Blok A, B, C, dan D</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mitra Bank Penyalur</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">Bank BRI / BSI</p>
          <p className="text-[11px] text-slate-400">Transfer otomatis panen</p>
        </div>
      </div>

      {/* Filters Bento Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama anggota, no telepon, atau blok..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Filter Blok:</span>
          <select
            value={selectedBlok}
            onChange={(e) => setSelectedBlok(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
          >
            <option value="all">Semua Blok Lahan</option>
            <option value="Blok A">Blok A</option>
            <option value="Blok B">Blok B</option>
            <option value="Blok C">Blok C</option>
            <option value="Blok D">Blok D</option>
          </select>
        </div>
      </div>

      {/* Grid of Farmer Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {farmerStats.map((petani) => (
          <div
            key={petani.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-green-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-sm border border-green-500/20">
                    {petani.nama.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{petani.nama}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span>{petani.blokLahan}</span>
                    </p>
                  </div>
                </div>

                <Badge variant={petani.statusAktif ? 'success' : 'neutral'} size="sm">
                  {petani.statusAktif ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg text-xs mb-3 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 text-[10px] block">Luas Lahan:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{petani.luasHa} Hektar</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Populasi Pokok:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{petani.jmlPokok} Batang</strong>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 text-[10px] block">Rekening Bank:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-blue-500" />
                    <strong>{petani.bank}</strong> - {petani.noRekening}
                  </span>
                </div>
              </div>

              {/* Performance */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Panen (PKS):</span>
                  <strong className="text-green-600 dark:text-green-400 font-mono">{formatKg(petani.totalKg)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Netto Diterima:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{formatRupiah(petani.totalNetto)}</strong>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <a
                href={`https://wa.me/${petani.noHp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span>{petani.noHp}</span>
              </a>

              {userRole === 'admin' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(petani)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Profil"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus anggota ${petani.nama}?`)) {
                        deletePetani(petani.id);
                      }
                    }}
                    className="p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Hapus Anggota"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Petani */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="lg"
        title={editingPetani ? 'Edit Data Anggota Petani' : 'Pendaftaran Anggota Kelompok Tani'}
        description="Kelola informasi kepemilikan kebun sawit dan nomor rekening pembayaran."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap Petani *
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: H. Syamsudin"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. KTP / NIK
              </label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="1401..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No. WhatsApp / HP *
              </label>
              <input
                type="text"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="0812..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Blok Lahan *
              </label>
              <select
                value={blokLahan}
                onChange={(e) => setBlokLahan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-medium outline-none"
              >
                <option value="Blok A (Utara)">Blok A (Utara)</option>
                <option value="Blok B (Timur)">Blok B (Timur)</option>
                <option value="Blok C (Selatan)">Blok C (Selatan)</option>
                <option value="Blok D (Barat)">Blok D (Barat)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Luas Lahan (Ha) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={luasHa}
                onChange={(e) => setLuasHa(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Pokok Sawit *
              </label>
              <input
                type="number"
                min="50"
                max="5000"
                value={jmlPokok}
                onChange={(e) => setJmlPokok(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank Tujuan
              </label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
              >
                <option value="BRI">Bank BRI</option>
                <option value="Bank Mandiri">Bank Mandiri</option>
                <option value="BCA">Bank BCA</option>
                <option value="BNI">Bank BNI</option>
                <option value="Bank Riau Kepri Syariah">Bank Riau Kepri Syariah</option>
                <option value="BSI">Bank BSI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Rekening
              </label>
              <input
                type="text"
                value={noRekening}
                onChange={(e) => setNoRekening(e.target.value)}
                placeholder="1234-01-..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm cursor-pointer"
            >
              Simpan Data Anggota
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Import Data Petani */}
      <ImportPetaniModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

    </div>
  );
};
