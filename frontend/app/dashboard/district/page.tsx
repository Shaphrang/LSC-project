'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Block = {
  id: string;
  name: string;
};

type LSC = {
  id: string;
  block_id: string;
};

type ServiceTxn = {
  lsc_id: string;
  amount_collected: number;
  beneficiary_name: string;
};

export default function DistrictDashboard() {
  const [districtName, setDistrictName] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [lscs, setLscs] = useState<LSC[]>([]);
  const [transactions, setTransactions] = useState<ServiceTxn[]>([]);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState({
    totalBlocks: 0,
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

      // 1. Get district_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('district_id')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.district_id) return;

      // 2. Get district name
      const { data: district } = await supabase
        .from('districts')
        .select('name')
        .eq('id', profile.district_id)
        .single();

      setDistrictName(district?.name || '');

      // 3. Get blocks under district
      const { data: blockData } = await supabase
        .from('blocks')
        .select('id, name')
        .eq('district_id', profile.district_id)
        .order('name');

      setBlocks(blockData || []);

      // 4. Get LSCs under those blocks
      const blockIds = (blockData || []).map((b) => b.id);

      const { data: lscData } = await supabase
        .from('lscs')
        .select('id, block_id')
        .in('block_id', blockIds)
        .eq('is_active', true);

      setLscs(lscData || []);

      // 5. Get transactions under those LSCs
      const lscIds = (lscData || []).map((l) => l.id);

      const { data: txnData } = await supabase
        .from('service_transactions')
        .select('lsc_id, amount_collected, beneficiary_name')
        .in('lsc_id', lscIds);

      setTransactions(txnData || []);

      // 6. Compute summary
      const totalCollection = (txnData || []).reduce(
        (sum, t) => sum + t.amount_collected,
        0
      );

      const beneficiaryCount = new Set(
        (txnData || []).map((t) => t.beneficiary_name)
      ).size;

      setSummary({
        totalBlocks: blockData?.length || 0,
        totalLSCs: lscData?.length || 0,
        totalServices: txnData?.length || 0,
        totalBeneficiaries: beneficiaryCount,
        totalCollection,
      });

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <p className="p-6">Loading district dashboard…</p>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* District Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <h1 className="text-xl font-bold">
          {districtName} District
        </h1>
        <p className="text-sm text-gray-600">
          District Performance Overview
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Blocks" value={summary.totalBlocks} />
        <StatCard label="LSCs" value={summary.totalLSCs} />
        <StatCard label="Services" value={summary.totalServices} />
        <StatCard
          label="Beneficiaries"
          value={summary.totalBeneficiaries}
        />
        <StatCard
          label="Collection"
          value={`₹${summary.totalCollection}`}
        />
      </div>

      {/* Block-wise Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <h2 className="text-lg font-semibold p-4">
          Block-wise Performance
        </h2>

        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-3 py-2">Block</th>
              <th className="text-right px-3 py-2">LSCs</th>
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
            {blocks.map((block) => {
              const blockLscs = lscs.filter(
                (l) => l.block_id === block.id
              );

              const blockLscIds = blockLscs.map(
                (l) => l.id
              );

              const blockTxns = transactions.filter(
                (t) => blockLscIds.includes(t.lsc_id)
              );

              const collection = blockTxns.reduce(
                (sum, t) => sum + t.amount_collected,
                0
              );

              const beneficiaries = new Set(
                blockTxns.map((t) => t.beneficiary_name)
              ).size;

              return (
                <tr key={block.id} className="border-t">
                  <td className="px-3 py-2 font-medium">
                    {block.name}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {blockLscs.length}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {blockTxns.length}
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

/* Reusable Stat Card */
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
