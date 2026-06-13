import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

import bgImage from '@/assets/images/xiao_yan_watermark_1781186004452.jpg';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, signOut } = useAuth();
  const [instansi, setInstansi] = useState<any>(null);

  useEffect(() => {
    async function loadInstansi() {
      const { data } = await supabase.from('pengaturan_instansi').select('*').eq('id', 1).maybeSingle();
      if (data) {
        setInstansi(data);
      }
    }
    loadInstansi();
  }, []);

  const isCurrentAction = (path: string) => location.pathname.startsWith(path);
  
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="h-screen bg-slate-50 font-sans flex text-slate-900 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 flex flex-col shrink-0 hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            {instansi?.logo_kiri_url ? (
              <img src={instansi.logo_kiri_url} alt="Logo" className="w-8 h-8 object-contain shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
            )}
            <div className="text-white overflow-hidden">
              <h1 className="text-xs font-bold tracking-widest uppercase opacity-60 truncate">MediSign Elite</h1>
              <p className="text-[10px] text-slate-400 truncate">{instansi?.nama_instansi || 'Memuat...'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-2 tracking-wider">Layanan Surat</div>
          {[
            { id: 'skd', label: 'SKD (Sehat)', icon: '📄' },
            { id: 'ski', label: 'SKI (Istirahat)', icon: '🛌' },
            { id: 'skb', label: 'SKB (Berobat)', icon: '🏥' },
            { id: 'catin', label: 'CATIN (Nikah)', icon: '💍' },
            { id: 'skbn', label: 'SKBN (Narkoba)', icon: '🧪' },
            { id: 'skh', label: 'SKH (Hamil)', icon: '🤰' },
            { id: 'sksh', label: 'SKSH (Haji)', icon: '🕋' },
            { id: 'skv', label: 'SKV (Vaksin)', icon: '💉' }
          ].map((type) => {
            const path = `/surat/${type.id}`;
            const active = isCurrentAction(path);
            return (
              <button 
                key={type.id}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 border-l-4 border-transparent hover:bg-slate-800 hover:text-white'}`}
              >
                <span className="w-5 text-center">{type.icon}</span> {type.label}
              </button>
            );
          })}
          
          <div className="pt-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-2 tracking-wider">Administrasi</div>
            <button
               onClick={() => navigate('/dashboard')}
               className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium ${location.pathname === '/dashboard' ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 border-l-4 border-transparent hover:bg-slate-800 hover:text-white'}`}
            >
              <span className="w-5 text-center">📊</span> Dashboard Terpadu
            </button>
            <button
               onClick={() => navigate('/history')}
               className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium ${location.pathname === '/history' ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 border-l-4 border-transparent hover:bg-slate-800 hover:text-white'}`}
            >
              <span className="w-5 text-center">⏱️</span> Riwayat Entry
            </button>
            <button
               onClick={() => navigate('/kasir')}
               className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium ${location.pathname === '/kasir' ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 border-l-4 border-transparent hover:bg-slate-800 hover:text-white'}`}
            >
              <span className="w-5 text-center">🧾</span> Antrean Kasir
            </button>
            <button
               onClick={() => navigate('/tarif')}
               className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium ${location.pathname === '/tarif' ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 border-l-4 border-transparent hover:bg-slate-800 hover:text-white'}`}
            >
              <span className="w-5 text-center">💰</span> Tarif Layanan
            </button>
            
            {profile?.role === 'SuperAdmin' && (
              <button
                 onClick={() => navigate('/pengguna')}
                 className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium ${location.pathname === '/pengguna' ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 border-l-4 border-transparent hover:bg-slate-800 hover:text-white'}`}
              >
                <span className="w-5 text-center">👥</span> Manajemen Akun
              </button>
            )}
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 uppercase">
              {profile?.nama_lengkap ? profile.nama_lengkap.substring(0, 2) : 'US'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">{profile?.nama_lengkap || session?.user?.email || 'Pengguna'}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{profile?.role || 'Guest'}</p>
            </div>
            <button className="text-slate-500 hover:text-white ml-auto" onClick={handleLogout} title="Logout">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-slate-50">
        <div 
          className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="relative z-10 flex-1 flex flex-col overflow-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
