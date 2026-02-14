//frontend\app\dashboard\admin\lsc\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

/* ✅ FINAL correct typing */
type LSC = {
  id: string;
  lsc_name: string;
  is_active: boolean;
  district: { name: string } | null;
  block: { name: string } | null;
};


export default function LSCListPage() {
  const router = useRouter();
  const [lscs, setLscs] = useState<LSC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLSCs = async () => {
      const { data, error } = await supabase
        .from('lscs')
        .select(`
          id,
          lsc_name,
          is_active,
          district:district_id ( name ),
          block:block_id ( name )
        `)
        .eq('status', 'APPROVED')
        .order('lsc_name');
        console.log('RAW LSC DATA 👉', data);

      if (error) {
        console.error('Failed to load LSCs:', error);
        setLoading(false);
        return;
      }

setLscs((data as unknown as LSC[]) || []);
      setLoading(false);
    };

    loadLSCs();
  }, []);

  if (loading) {
    return (
      <p className="text-slate-700">
        Loading LSC profiles…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            LSC Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Livelihood Service Centres master list
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                LSC Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                District
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Block
              </th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">
                Status
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {lscs.map((lsc) => {
const districtName = lsc.district?.name || '—';
const blockName = lsc.block?.name || '—';


              return (
                <tr
                  key={lsc.id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {lsc.lsc_name}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {districtName}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {blockName}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        lsc.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {lsc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/admin/lsc/${lsc.id}`
                        )
                      }
                      className="px-4 py-2 text-blue-700 font-bold rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 text-xs shadow-sm active:scale-95"
                    >
                      View / Edit
                    </button>
                  </td>
                </tr>
              );
            })}

            {lscs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-500"
                >
                  No LSCs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
