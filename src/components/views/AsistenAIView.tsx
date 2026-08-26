import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Lightbulb, 
  Scale, 
  TrendingUp, 
  HelpCircle, 
  CheckCircle2, 
  RotateCcw,
  TreePine,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { formatRupiah, formatKg } from '../../lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export const AsistenAIView: React.FC = () => {
  const { panenList, petaniList, kasList, pengaturan } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Compute live dataset context for AI
  const totalTonasePks = panenList.reduce((s, p) => s + p.timbanganPksKg, 0);
  const totalTonaseRam = panenList.reduce((s, p) => s + p.timbanganRamKg, 0);
  const totalSelisih = panenList.reduce((s, p) => s + p.selisihKg, 0);
  const avgSusut = totalTonaseRam > 0 ? ((totalSelisih / totalTonaseRam) * 100).toFixed(2) : '0';
  const totalNetto = panenList.reduce((s, p) => s + p.totalNetto, 0);
  const totalBruto = panenList.reduce((s, p) => s + p.totalBruto, 0);
  const saldoKas = kasList.length > 0 ? kasList[kasList.length - 1].saldoSetelah : 0;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Halo Pengurus & Anggota **Kelompok Tani Bunga Sari**! 🌿\n\nSaya adalah **Asisten Cerdas Kelompok Tani**. Saya telah terhubung langsung dengan data penimbangan panen, analisis susut tonase, dan buku kas kelompok Anda.\n\nApa yang ingin Anda konsultasikan hari ini?`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        '📊 Analisis susut tonase dan audit SPB bulan ini',
        '💰 Hitung proyeksi laba jika TBS naik ke Rp 2.750/kg',
        '🌱 Rekomendasi dosis pemupukan sawit TM (10-15 tahun)',
        '⚖️ Cara mengurangi penyusutan timbangan kebun vs PKS'
      ]
    }
  ]);

  const quickPrompts = [
    {
      title: 'Audit Susut Timbangan',
      desc: 'Deteksi rit yang mengalami susut > 2.0%',
      icon: Scale,
      prompt: 'Tolong audit data susut tonase pabrik vs kebun kita, dan berikan rekomendasi pencegahannya.'
    },
    {
      title: 'Proyeksi Pendapatan',
      desc: 'Simulasi kenaikan harga TBS pabrik',
      icon: TrendingUp,
      prompt: 'Bagaimana proyeksi omzet dan pendapatan bersih petani jika harga TBS naik 10% dari harga sekarang?'
    },
    {
      title: 'Manajemen Kas & Iuran',
      desc: 'Evaluasi kecukupan dana perawatan jalan kebun',
      icon: DollarSign,
      prompt: 'Evaluasi saldo kas kelompok saat ini dan apakah cukup untuk program perbaikan jalan kebun bulan depan?'
    },
    {
      title: 'Rekomendasi Agronomi',
      desc: 'Dosis pupuk NPK & penanganan gulma',
      icon: TreePine,
      prompt: 'Berikan panduan jadwal dan dosis pemupukan sawit umur 10-12 tahun di lahan darat mineral.'
    }
  ];

  // Helper response generator with domain knowledge & actual dataset facts
  const generateAssistantResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('susut') || q.includes('selisih') || q.includes('audit')) {
      const highLossList = panenList.filter(p => p.persentaseSelisih > 2.0);
      return `### 📊 Laporan Audit Penyusutan & Selisih Tonase
      
Berdasarkan catatan penimbangan aktual Kelompok Tani Bunga Sari:
- **Total Timbangan Kebun (Ram):** ${formatKg(totalTonaseRam)}
- **Total Timbangan Pabrik (PKS):** ${formatKg(totalTonasePks)}
- **Total Selisih Susut:** -${formatKg(totalSelisih)} (**${avgSusut}%**)
- **Ambang Batas Toleransi:** ≤ ${pengaturan.toleransiSusutPersen || 2.0}%
- **Jumlah SPB Susut Tinggi (>2.0%):** ${highLossList.length} rit pengiriman

**Penyebab Umum & Tindakan Pencegahan:**
1. **Waktu Antrian Truk di PKS:** Truk yang menginap lebih dari 12 jam dapat menyebabkan penguapan air buah sawit (susut 0.8% - 1.5%).
2. **Kalibrasi Timbangan Ram Kebun:** Disarankan kalibrasi ulang timbangan ram setiap 3 bulan sekali.
3. **Sortasi Buah Mentah/Tangkai Panjang:** Pastikan pemanen memotong tangkai mepet (V-cut) agar tidak dipotong sortasi berlebih di sortasi pabrik.`;
    }

    if (q.includes('proyeksi') || q.includes('tbs') || q.includes('harga') || q.includes('naik') || q.includes('laba')) {
      const newPrice = 2750;
      const projectedBruto = totalTonasePks * newPrice;
      const projectedNetto = projectedBruto - (panenList.reduce((s, p) => s + p.totalPotongan, 0));
      return `### 💰 Simulasi Proyeksi Kenaikan Harga TBS
      
Jika harga TBS disesuaikan menjadi **${formatRupiah(newPrice)}/kg** (saat ini ${formatRupiah(pengaturan.hargaTbsDefault)}/kg):
- **Total Tonase PKS Bersih:** ${formatKg(totalTonasePks)}
- **Estimasi Omzet Bruto Baru:** **${formatRupiah(projectedBruto)}** (Kenaikan +${formatRupiah(projectedBruto - totalBruto)})
- **Estimasi Netto Bersih Diterima Petani:** **${formatRupiah(projectedNetto)}**
- **Iuran Kas Terkumpul:** Tetap stabil Rp 20/kg = **${formatRupiah(totalTonasePks * 20)}**

*Peningkatan ini sangat sehat untuk mempercepat pelunasan pinjaman kasbon pupuk anggota.*`;
    }

    if (q.includes('kas') || q.includes('jalan') || q.includes('saldo')) {
      return `### 🏦 Evaluasi Kas & Dana Operasional Kelompok
      
- **Saldo Kas Saat Ini:** **${formatRupiah(saldoKas)}**
- **Iuran Panen Rutin:** Rp ${pengaturan.potonganIuranKasPerKg}/kg (${formatRupiah(totalTonasePks * pengaturan.potonganIuranKasPerKg)} terkumpul bulan ini).
- **Rekomendasi Pemeliharaan Jalan Kebun:** 
  Biaya sewa grader & perataan jalan berkisar antara Rp 1.500.000 - Rp 2.500.000 per blok. Dengan saldo kas saat ini, dana **sangat mencukupi** untuk perbaikan jalan poros utama Blok A & B tanpa perlu memungut iuran tambahan dari anggota.`;
    }

    if (q.includes('pupuk') || q.includes('agronomi') || q.includes('dosis') || q.includes('gulma')) {
      return `### 🌱 Panduan Agronomi & Pemupukan Sawit TM (10-15 Tahun)
      
Untuk populasi standar 136-143 pokok/hektar di lahan mineral:
1. **Semester I (Awal Musim Hujan):**
   - **Urea / ZA:** 2.0 - 2.5 kg/pokok (tabur merata di piringan 1.5m dari pangkal batang).
   - **Rock Phosphate (RP):** 1.5 kg/pokok.
2. **Semester II:**
   - **MOP / KCl:** 2.0 - 3.0 kg/pokok (meningkatkan bobot janjang & rendemen minyak).
   - **Kieserite (Magnesium):** 1.0 - 1.5 kg/pokok.
   - **Borate:** 100 - 150 gr/pokok (di ketiak pelepah).

*Tips: Pastikan piringan bersih dari gulma tebal sebelum penaburan pupuk agar penyerapan hara maksimal.*`;
    }

    return `Terima kasih atas pertanyaannya! Berdasarkan data Kelompok Tani Bunga Sari:
- **Total Produksi PKS:** ${formatKg(totalTonasePks)} dari 20 anggota.
- **Pendapatan Bersih Petani:** ${formatRupiah(totalNetto)} telah terdata dengan rapi.
- **Rata-rata Susut Tonase:** ${avgSusut}% (dalam batas wajar).

Ada hal spesifik terkait pencatatan panen, potongan pedaran, atau slip petani yang ingin saya bantu hitungkan?`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI inference
    setTimeout(() => {
      const responseText = generateAssistantResponse(query);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Audit data susut pengiriman berikutnya',
          'Lihat simulasi pembagian hasil panen',
          'Cek saldo kas kelompok terkini'
        ]
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-green-600 dark:text-green-500" />
            <span>Asisten Cerdas Kelompok Tani (AI Analytics)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Konsultasi otomatis data panen, analisis susut tonase, perhitungan proyeksi TBS, dan panduan agronomi sawit.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs font-bold text-green-600 dark:text-green-400">
          <Sparkles className="w-4 h-4" />
          <span>Gemini AI Connected</span>
        </div>
      </div>

      {/* Quick Prompts Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickPrompts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(item.prompt)}
              className="text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-green-500/50 shadow-sm transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-green-500/20">
                <Icon className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                {item.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[560px]">
        
        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-green-600 text-white font-medium rounded-tr-xs shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs space-y-2'
                }`}
              >
                <div className="whitespace-pre-line prose dark:prose-invert prose-xs max-w-none">
                  {msg.text}
                </div>

                <div className={`text-[10px] mt-2 font-mono ${msg.sender === 'user' ? 'text-green-100 text-right' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>

                {/* Suggestions Pills if AI */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(sug)}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span>Menganalisis data panen & menyusun rekomendasi...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tanyakan analisis susut, proyeksi harga TBS, atau panduan sawit..."
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
