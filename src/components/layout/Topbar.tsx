import React from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  PlusCircle, 
  TrendingUp, 
  Printer, 
  HelpCircle,
  Bell,
  RefreshCw,
  Search,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatTon } from '../../lib/utils';

interface TopbarProps {
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenAddPanen: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  onToggleSidebar, 
  onOpenMobileMenu, 
  onOpenAddPanen 
}) => {
  const handleToggleMenu = onToggleSidebar || onOpenMobileMenu || (() => {});
  const { 
    activeTab, 
    setActiveTab, 
    darkMode, 
    setDarkMode, 
    userRole, 
    setUserRole,
    activePetaniId,
    setActivePetaniId,
    petaniList,
    panenList,
    pengaturan,
    resetToDefault
  } = useApp();

  const activePetani = petaniList.find(p => p.id === activePetaniId) || petaniList[0];

  const totalTonaseBulanIni = panenList.reduce((acc, curr) => acc + curr.timbanganPksKg, 0);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard & Ringkasan Kelompok';
      case 'panen': return 'Catatan Panen & Penimbangan SPB';
      case 'rekap': return 'Rekapitulasi Panen & Slip Pembayaran';
      case 'selisih': return 'Analisis Susut / Selisih Tonase Kebun vs PKS';
      case 'kas': return 'Buku Kas & Pinjaman Pupuk Kelompok Tani';
      case 'petani': return 'Data 20 Anggota Kelompok Tani Bunga Sari';
      case 'cetak-laporan': return 'Cetak Laporan Rekapitulasi Resmi';
      case 'asisten-ai': return 'Konsultan Sawit Cerdas (AI & Agronomi)';
      case 'pengaturan': return 'Pengaturan Tarif & Struktur Kelompok';
      default: return 'Laporan Kelompok Tani';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between px-4 sm:px-8 h-16 gap-4">
        
        {/* Left Side: Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleToggleMenu}
            className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase tracking-widest hidden sm:inline-block">
                {pengaturan.namaKelompok}
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline-block">•</span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {getPageTitle()}
              </h2>
            </div>
          </div>
        </div>

        {/* Right Side: Actions, Metrics, Theme Toggle, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Live Price Tag (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span>Harga TBS: <strong className="font-bold text-green-600 dark:text-green-400">{formatRupiah(pengaturan.hargaTbsDefault)}/kg</strong></span>
          </div>

          {/* Quick Add Panen Button */}
          {userRole === 'admin' && (
            <button
              type="button"
              onClick={onOpenAddPanen}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Catat Panen</span>
              <span className="sm:hidden">Input</span>
            </button>
          )}

          {/* Fast Switch Role & Active Farmer (for Petani role) */}
          {userRole === 'petani' && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-md text-xs">
              <Users className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-slate-500 dark:text-slate-400 hidden md:inline">Akun:</span>
              <select
                value={activePetaniId || ''}
                onChange={(e) => setActivePetaniId(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {petaniList.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
};
