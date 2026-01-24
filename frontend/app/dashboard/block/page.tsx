'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type LSC = {
  id: string;
  lsc_name: string;
};

type ServiceTxn = {
  lsc_id: string;
  amount_collected: number;
  beneficiary_name: string;
};

export default function BlockDashboard() {
  const [blockInfo, setBlockInfo] = useState<{
    blockName: string;
    districtName: string;
  } | null>(null);

  const [lscs, setLscs] = useState<LSC[]>([]);
  const [transactions, setTransactions] = useState<ServiceTxn[]>([]);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState({
    totalLSCs: 0,
    totalServices: 0,
    totalBeneficiaries: 0,
    totalCollection: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // 1. Get block & district from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          block_id,
          district_id,
          blocks ( name ),
          districts ( name )
        `)
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.block_id) return;

      setBlockInfo({
        blockName: profile.blocks[0]?.name,
        districtName: profile.districts[0]?.name,
      });

      // 2. Get all LSCs under this block
      const { data: lscData } = await supabase
        .from('lscs')
        .select('id, lsc_name')
        .eq('block_id', profile.block_id)
        .eq('is_active', true);

      setLscs(lscData || []);

      // 3. Get all service transactions under this block
      const { data: txnData } = await supabase
        .from('service_transactions')
        .select('lsc_id, amount_collected, beneficiary_name')
        .in(
          'lsc_id',
          (lscData || []).map((l) => l.id)
        );

      setTransactions(txnData || []);

      // 4. Compute summary
      const totalCollection = (txnData || []).reduce(
        (sum, t) => sum + t.amount_collected,
        0
      );

      const beneficiaryCount = new Set(
        (txnData || []).map((t) => t.beneficiary_name)
      ).size;

      setSummary({
        totalLSCs: lscData?.length || 0,
        totalServices: txnData?.length || 0,
        totalBeneficiaries: beneficiaryCount,
        totalCollection,
      });

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading || !blockInfo) {
    return <p className="p-6">Loading block dashboard…</p>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Block Identity */}
      <div className="bg-white rounded-lg shadow p-4">
        <h1 className="text-xl font-bold">
          {blockInfo.blockName} Block
        </h1>
        <p className="text-sm text-gray-600">
          {blockInfo.districtName} District
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="LSCs" value={summary.totalLSCs} />
        <StatCard
          label="Services"
          value={summary.totalServices}
        />
        <StatCard
          label="Beneficiaries"
          value={summary.totalBeneficiaries}
        />
        <StatCard
          label="Collection"
          value={`₹${summary.totalCollection}`}
        />
      </div>

      {/* LSC Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <h2 className="text-lg font-semibold p-4">
          LSC-wise Performance
        </h2>

        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-3 py-2">LSC</th>
              <th className="text-right px-3 py-2">
                Services
              </th>
              <th className="text-right px-3 py-2">
                Beneficiaries
              </th>
              <th className="text-right px-3 py-2">
                Collection (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {lscs.map((lsc) => {
              const lscTxns = transactions.filter(
                (t) => t.lsc_id === lsc.id
              );

              const collection = lscTxns.reduce(
                (sum, t) => sum + t.amount_collected,
                0
              );

              const beneficiaries = new Set(
                lscTxns.map((t) => t.beneficiary_name)
              ).size;

              return (
                <tr key={lsc.id} className="border-t">
                  <td className="px-3 py-2 font-medium">
                    {lsc.lsc_name}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {lscTxns.length}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {beneficiaries}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    ₹{collection}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Reusable stat card */
function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4 text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
