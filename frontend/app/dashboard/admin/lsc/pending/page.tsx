// frontend\app\dashboard\admin\lsc\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

/* Updated Typing */
type LSC = {
  id: string;
  lsc_name: string;
  is_active: boolean;
  applicationCode: string;
  status: string;
  district: { name: string } | null;
  block: { name: string } | null;
};

export default function LSCListPage() {
  const router = useRouter();
  const [lscs, setLscs] = useState<LSC[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [selectedLsc, setSelectedLsc] = useState<LSC | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadLSCs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lscs')
      .select(`
        id,
        lsc_name,
        is_active,
        applicationCode,
        status,
        district:district_id ( name ),
        block:block_id ( name )
      `)
      .eq('status', 'PENDING') 
      .order('lsc_name');

    if (error) {
      console.error('Failed to load LSCs:', error);
    } else {
      setLscs((data as unknown as LSC[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLSCs();
  }, []);

  /* Corrected Update Status Handler */
  const handleUpdateStatus = async (newStatus: 'APPROVED' | 'REJECTED') => {
    if (!selectedLsc) return;
    
    setUpdating(true);
    const { error } = await supabase
      .from('lscs')
      .update({ 
        status: newStatus,
        is_active: newStatus === 'APPROVED' // Approving activates the account
      })
      .eq('id', selectedLsc.id);

    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      // Refresh list (removes processed item from view) and close modal
      await loadLSCs();
      setSelectedLsc(null);
    }
    setUpdating(false);
  };

  if (loading) {
    return <p className="p-6 text-slate-700 font-medium">Loading LSC profiles...</p>;
  }

  return (
    <div className="space-y-6 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LSC Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reviewing <span className="font-bold text-blue-600">{lscs.length}</span> pending applications
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">LSC Details</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">District / Block</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-700">Current Status</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-700">Review</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {lscs.map((lsc) => (
                <tr key={lsc.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {lsc.lsc_name}
                    </div>
                    <div className="text-[11px] mt-0.5 text-slate-400 font-mono tracking-tighter">
                      APPLICATION-CODE: {lsc.applicationCode}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="font-medium">{lsc.district?.name || '—'}</div>
                    <div className="text-xs text-slate-400">{lsc.block?.name || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                      {lsc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedLsc(lsc)}
                      className="px-4 py-2 text-blue-700 font-bold rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 text-xs shadow-sm active:scale-95"
                    >
                      Approve / Reject
                    </button>
                  </td>
                </tr>
              ))}

              {lscs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="text-slate-300 text-5xl mb-4"></div>
                    <p className="text-slate-500 font-medium italic">All caught up! No pending applications.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTION MODAL */}
      {selectedLsc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Review Application</h3>
              <button 
                onClick={() => setSelectedLsc(null)} 
                className="text-slate-400 hover:text-red-500 transition-colors text-3xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl mb-6 shadow-inner">
              <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest mb-1">Target Center</p>
              <p className="font-bold text-slate-900 text-xl leading-tight">{selectedLsc.lsc_name}</p>
              <p className="text-xs font-mono text-blue-600 mt-2 bg-white inline-block px-2 py-0.5 rounded border border-blue-100">
                #{selectedLsc.applicationCode}
              </p>
            </div>

            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Updating this record will move it out of the pending queue. Approving grants the center full access to the MIS platform.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus('APPROVED')}
                className="bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Approve'}
              </button>
              
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus('REJECTED')}
                className="bg-white border-2 border-red-100 text-red-600 py-3.5 rounded-xl font-bold hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
            
            <button 
              onClick={() => setSelectedLsc(null)}
              className="w-full mt-6 text-slate-400 text-[11px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancel and Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}