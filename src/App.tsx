import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/views/DashboardView';
import { ArmadaView } from './components/views/ArmadaView';
import { PanenView } from './components/views/PanenView';
import { RekapView } from './components/views/RekapView';
import { SelisihView } from './components/views/SelisihView';
import { KasView } from './components/views/KasView';
import { PetaniView } from './components/views/PetaniView';
import { CetakLaporanView } from './components/views/CetakLaporanView';
import { AsistenAIView } from './components/views/AsistenAIView';
import { PengaturanView } from './components/views/PengaturanView';
import { FormPanenModal } from './components/panen/FormPanenModal';
import { SlipCetakModal } from './components/panen/SlipCetakModal';
import { PanenRecord } from './types';

const MainApp: React.FC = () => {
  const { activeTab, selectedPanenForSlip, setSelectedPanenForSlip } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPanenModalOpen, setIsPanenModalOpen] = useState(false);
  const [editingPanenRecord, setEditingPanenRecord] = useState<PanenRecord | null>(null);

  const handleOpenAddPanen = () => {
    setEditingPanenRecord(null);
    setIsPanenModalOpen(true);
  };

  const handleOpenEditPanen = (record: PanenRecord) => {
    setEditingPanenRecord(record);
    setIsPanenModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col antialiased transition-colors duration-200">
      <div className="flex flex-1 min-h-screen">
        
        {/* Responsive Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          isOpenMobile={isSidebarOpen}
          setIsOpenMobile={setIsSidebarOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          
          {/* Sticky Topbar */}
          <Topbar 
            onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
            onOpenMobileMenu={() => setIsSidebarOpen(prev => !prev)}
            onOpenAddPanen={handleOpenAddPanen}
          />

          {/* Dynamic Page Views */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView onOpenAddPanen={handleOpenAddPanen} />
            )}

            {activeTab === 'armada' && (
              <ArmadaView onOpenAddPanen={handleOpenAddPanen} />
            )}

            {activeTab === 'panen' && (
              <PanenView 
                onOpenAddPanen={handleOpenAddPanen}
                onOpenEditPanen={handleOpenEditPanen}
              />
            )}

            {activeTab === 'rekap' && (
              <RekapView onOpenEditPanen={handleOpenEditPanen} />
            )}

            {activeTab === 'selisih' && (
              <SelisihView />
            )}

            {activeTab === 'kas' && (
              <KasView />
            )}

            {activeTab === 'petani' && (
              <PetaniView />
            )}

            {activeTab === 'cetak-laporan' && (
              <CetakLaporanView />
            )}

            {activeTab === 'asisten-ai' && (
              <AsistenAIView />
            )}

            {activeTab === 'pengaturan' && (
              <PengaturanView />
            )}
          </main>
        </div>
      </div>

      {/* Harvest Form Modal (Add & Edit) */}
      <FormPanenModal
        isOpen={isPanenModalOpen}
        onClose={() => {
          setIsPanenModalOpen(false);
          setEditingPanenRecord(null);
        }}
        initialRecord={editingPanenRecord}
        editingRecord={editingPanenRecord}
      />

      {/* Slip Generator & WhatsApp Modal */}
      {selectedPanenForSlip && (
        <SlipCetakModal
          isOpen={!!selectedPanenForSlip}
          onClose={() => setSelectedPanenForSlip(null)}
          record={selectedPanenForSlip}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
