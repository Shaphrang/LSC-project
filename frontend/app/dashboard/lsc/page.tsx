'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type LSC = {
  id: string;
  lsc_name: string;
  village: string | null;
  gp: string | null;
  clf_name: string | null;
  blocks: { name: string }[];
  districts: { name: string }[];
};

type ServiceTxn = {
  id: string;
  service_start_date: string;
  amount_collected: number;
  beneficiary_name: string;
  service_items: { name: string }[];
};


export default function LSCDashboard() {
  const [lsc, setLsc] = useState<LSC | null>(null);
  const [recentTxns, setRecentTxns] = useState<ServiceTxn[]>([]);
  const [stats, setStats] = useState({
    services: 0,
    beneficiaries: 0,
    collection: 0,
    topService: '-',
  });

  useEffect(() => {
    const loadData = async () => {
      // 1. Get logged-in user
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // 2. Get LSC ID from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('lsc_id')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.lsc_id) return;

      // 3. Fetch LSC details
      const { data: lscData } = await supabase
        .from('lscs')
        .select(`
          id,
          lsc_name,
          village,
          gp,
          clf_name,
          blocks ( name ),
          districts ( name )
        `)
        .eq('id', profile.lsc_id)
        .single();

        setLsc(lscData);


      // 4. Fetch recent transactions
      const { data: txns } = await supabase
        .from('service_transactions')
        .select(`
          id,
          service_start_date,
          amount_collected,
          beneficiary_name,
          service_items ( name )
        `)
        .eq('lsc_id', profile.lsc_id)
        .order('service_start_date', { ascending: false })
        .limit(5);

      setRecentTxns(txns || []);

      // 5. Fetch aggregate stats
      const { data: allTxns } = await supabase
        .from('service_transactions')
        .select('amount_collected, beneficiary_name, service_item_id')
        .eq('lsc_id', profile.lsc_id);

      if (allTxns) {
        const totalCollection = allTxns.reduce(
          (sum, t) => sum + t.amount_collected,
          0
        );

        const serviceCount = allTxns.length;
        const beneficiaryCount = new Set(
          allTxns.map((t) => t.beneficiary_name)
        ).size;

        setStats({
          services: serviceCount,
          beneficiaries: beneficiaryCount,
          collection: totalCollection,
          topService: '—', // we’ll enhance this later
        });
      }
    };

    loadData();
  }, []);

  if (!lsc) {
    return <p className="p-6">Loading LSC data…</p>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* LSC Identity Card */}
      <div className="bg-white rounded-lg shadow p-4">
        <h1 className="text-xl md:text-2xl font-bold">
          {lsc.lsc_name}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {lsc.blocks[0]?.name} Block, {lsc.districts[0]?.name}
        </p>

        <p className="text-sm text-gray-500 mt-2">
          Village: {lsc.village || '—'} | CLF: {lsc.clf_name || '—'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Services" value={stats.services} />
        <StatCard label="Beneficiaries" value={stats.beneficiaries} />
        <StatCard
          label="Collection"
          value={`₹${stats.collection}`}
        />
        <StatCard label="Top Service" value={stats.topService} />
      </div>

      {/* Primary Action */}
      <div className="flex justify-center md:justify-start">
        <a
        href="/dashboard/lsc/add-service"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
        + Add Service Entry
        </a>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">
          Recent Activity
        </h2>

        {recentTxns.length === 0 ? (
          <p className="text-sm text-gray-500">
            No services recorded yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentTxns.map((txn) => (
              <li
                key={txn.id}
                className="flex justify-between text-sm border-b pb-1"
              >
                <div>
                  <p className="font-medium">
                    {txn.service_items[0]?.name}
                  </p>
                  <p className="text-gray-500">
                    {txn.beneficiary_name} •{' '}
                    {txn.service_start_date}
                  </p>
                </div>
                <div className="font-semibold">
                  ₹{txn.amount_collected}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* Small reusable stat card */
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
