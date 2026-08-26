import React from 'react';
import { 
  LayoutDashboard, 
  Scale, 
  Truck,
  FileSpreadsheet, 
  GitCompare, 
  Wallet, 
  Users, 
  Printer, 
  Sparkles, 
  Settings, 
  TreePine,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import { cn, formatRupiah } from '../../lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isOpenMobile?: boolean;
  setIsOpenMobile?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isOpenMobile,
  setIsOpenMobile
}) => {
  const isMobileOpen = isOpen ?? isOpenMobile ?? false;

  const handleClose = () => {
    if (onClose) onClose();
    if (setIsOpenMobile) setIsOpenMobile(false);
  };
  const { 
    activeTab, 
    setActiveTab, 
    userRole, 
    setUserRole, 
    panenList, 
    petaniList, 
    kasList,
    pengaturan 
  } = useApp();

  const draftOrSiapCount = panenList.filter(p => p.statusPembayaran !== 'Lunas').length;
  const currentSaldoKas = kasList.length > 0 ? kasList[kasList.length - 1].saldoSetelah : 0;

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: string | number; badgeVariant?: string }[] = [
    { 
      id: 'dashboard', 
      label: 'Beranda & Ringkasan', 
      icon: LayoutDashboard 
    },
    { 
      id: 'armada', 
      label: 'Menu Armada & Logistik', 
      icon: Truck,
      badge: 'PKS'
    },
    { 
      id: 'panen', 
      label: 'Catatan Panen & SPB', 
      icon: Scale,
      badge: draftOrSiapCount > 0 ? `${draftOrSiapCount}` : undefined,
      badgeVariant: 'amber'
    },
    { 
      id: 'rekap', 
      label: 'Hasil Rekapan & Slip', 
      icon: FileSpreadsheet,
      badge: 'Cetak'
    },
    { 
      id: 'selisih', 
      label: 'Analisis Susut Tonase', 
      icon: GitCompare 
    },
    { 
      id: 'kas', 
      label: 'Kas & Kasbon Petani', 
      icon: Wallet 
    },
    { 
      id: 'petani', 
      label: 'Data Anggota (20)', 
      icon: Users 
    },
    { 
      id: 'cetak-laporan', 
      label: 'Cetak Laporan Resmi', 
      icon: Printer 
    },
    { 
      id: 'asisten-ai', 
      label: 'Konsultan Sawit AI', 
      icon: Sparkles,
      badge: 'AI Smart'
    },
    { 
      id: 'pengaturan', 
      label: 'Pengaturan & Tarif', 
      icon: Settings 
    },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    handleClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm shrink-0">
              <TreePine className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white leading-tight">
                {pengaturan.namaKelompok}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Sistem Panen & Keuangan
              </p>
            </div>
          </div>
        </div>

        {/* Live TBS Price Badge Ticker */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[11px] text-slate-400 font-medium">Harga TBS:</span>
          </div>
          <span className="text-[11px] font-bold text-green-400 bg-green-950/60 px-2 py-0.5 rounded border border-green-800/50">
            {formatRupiah(pengaturan.hargaTbsDefault)}/kg
          </span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs sm:text-sm transition-colors duration-150 group cursor-pointer",
                  isActive 
                    ? "bg-green-600/10 text-green-500 font-medium" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0 transition-colors",
                    isActive ? "bg-green-500" : "border border-slate-600 group-hover:border-slate-400"
                  )} />
                  <Icon className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-green-500" : "text-slate-400 group-hover:text-slate-200"
                  )} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                    isActive 
                      ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                      : item.badgeVariant === 'amber'
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Role Switcher & User Status */}
        <div className="p-3 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] text-slate-400 font-medium">Akses:</span>
            <button
              type="button"
              onClick={() => setUserRole(userRole === 'admin' ? 'petani' : 'admin')}
              className="text-[11px] text-green-400 hover:text-green-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              Ganti ke {userRole === 'admin' ? 'Petani' : 'Admin'}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg flex items-center gap-3 border border-slate-800">
            <div className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center text-white shrink-0 text-xs font-bold",
              userRole === 'admin' ? "bg-green-600" : "bg-blue-600"
            )}>
              {userRole === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {userRole === 'admin' ? 'Administrator' : 'Petani Anggota'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {userRole === 'admin' ? `${pengaturan.ketua}` : `${petaniList[0]?.nama || 'Anggota'}`}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
