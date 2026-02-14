'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';


type LSC = {
  id: string;
  lsc_name: string;
  is_active: boolean;
  applicationCode: string;
  status: string;
  district: { name: string } | null;
  block: { name: string } | null;
};

export default function RejectedLSCPage() {
  const router = useRouter();
  const [lscs, setLscs] = useState<LSC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRejectedLSCs = async () => {
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
        .eq('status', 'REJECTED') // Specifically fetching rejected records
        .order('lsc_name');

      if (error) {
        console.error('Failed to load Rejected LSCs:', error);
      } else {
        setLscs((data as unknown as LSC[]) || []);
      }
      setLoading(false);
    };

    loadRejectedLSCs();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-slate-700 animate-pulse">
        Loading rejected profiles…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Rejected Applications
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            List of Livelihood Service Centres that were not approved
          </p>
        </div>
        <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100">
          <span className="text-red-700 font-bold text-sm">
            Total Rejected: {lscs.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-slate-700">
                LSC Name / Application Code
              </th>
              <th className="px-6 py-4 text-left font-semibold text-slate-700">
                District
              </th>
              <th className="px-6 py-4 text-left font-semibold text-slate-700">
                Block
              </th>
              <th className="px-6 py-4 text-center font-semibold text-slate-700">
                Status
              </th>
              <th className="px-6 py-4 text-right font-semibold text-slate-700">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {lscs.map((lsc) => {
              const districtName = lsc.district?.name || '—';
              const blockName = lsc.block?.name || '—';

              return (
                <tr
                  key={lsc.id}
                  className="hover:bg-red-50/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">
                      {lsc.lsc_name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono tracking-tighter">
                      #{lsc.applicationCode}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-700 font-medium">
                    {districtName}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {blockName}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 border border-red-200">
                      {lsc.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/admin/lsc/${lsc.id}`)
                      }
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wider"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}

            {lscs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-500 italic"
                >
                  No rejected applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}