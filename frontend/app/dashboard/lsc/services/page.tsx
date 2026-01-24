'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ServiceItem = {
  id: string;
  name: string;
};

type ServiceTxn = {
  id: string;
  service_start_date: string;
  service_end_date: string | null;
  beneficiary_name: string;
  beneficiary_address: string | null;
  amount_collected: number;
  service_name: string;
};

export default function LSCServiceHistory() {
  const [lscId, setLscId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [transactions, setTransactions] = useState<ServiceTxn[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    serviceId: '',
  });

  /* LOAD INITIAL DATA */
  useEffect(() => {
    const loadData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // 1. Get LSC ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('lsc_id')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.lsc_id) return;

      setLscId(profile.lsc_id);

      // 2. Load services offered by LSC (for filter dropdown)
      const { data: lscServiceRows } = await supabase
        .from('lsc_services')
        .select('service_item_id')
        .eq('lsc_id', profile.lsc_id)
        .eq('is_available', true);

      const serviceIds =
        lscServiceRows?.map((r) => r.service_item_id) || [];

      if (serviceIds.length > 0) {
        const { data: serviceItems } = await supabase
          .from('service_items')
          .select('id, name')
          .in('id', serviceIds);

        setServices(serviceItems || []);
      }

      // 3. Load transactions
      await fetchTransactions(profile.lsc_id, filters);

      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* FETCH TRANSACTIONS WITH FILTERS */
  const fetchTransactions = async (
    lscId: string,
    f: typeof filters
  ) => {
    let query = supabase
      .from('service_transactions')
      .select(`
        id,
        service_item_id,
        service_start_date,
        service_end_date,
        beneficiary_name,
        beneficiary_address,
        amount_collected
      `)
      .eq('lsc_id', lscId)
      .order('service_start_date', { ascending: false });

    if (f.fromDate) {
      query = query.gte('service_start_date', f.fromDate);
    }

    if (f.toDate) {
      query = query.lte('service_start_date', f.toDate);
    }

    if (f.serviceId) {
      query = query.eq('service_item_id', f.serviceId);
    }

    const { data: txnData } = await query;

    if (!txnData || txnData.length === 0) {
      setTransactions([]);
      return;
    }

    // Fetch service names separately
    const serviceIds = Array.from(
      new Set(txnData.map((t) => t.service_item_id))
    );

    const { data: serviceItems } = await supabase
      .from('service_items')
      .select('id, name')
      .in('id', serviceIds);

    const serviceMap = new Map(
      (serviceItems || []).map((s) => [s.id, s.name])
    );

    const normalizedTxns: ServiceTxn[] = txnData.map((t) => ({
      id: t.id,
      service_start_date: t.service_start_date,
      service_end_date: t.service_end_date,
      beneficiary_name: t.beneficiary_name,
      beneficiary_address: t.beneficiary_address,
      amount_collected: t.amount_collected,
      service_name:
        serviceMap.get(t.service_item_id) || 'Unknown',
    }));

    setTransactions(normalizedTxns);
  };

  /* HANDLE FILTER CHANGE */
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  /* APPLY FILTERS */
  const applyFilters = () => {
    if (lscId) {
      fetchTransactions(lscId, filters);
    }
  };

  if (loading) {
    return <p className="p-6">Loading service records…</p>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-bold">Service History</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm block mb-1">
              From Date
            </label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">
              To Date
            </label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleFilterChange}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">
              Service
            </label>
            <select
              name="serviceId"
              value={filters.serviceId}
              onChange={handleFilterChange}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">All</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {transactions.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            No service records found.
          </p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Service</th>
                <th className="text-left px-3 py-2">
                  Beneficiary
                </th>
                <th className="text-right px-3 py-2">
                  Amount (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2">
                    {t.service_start_date}
                  </td>
                  <td className="px-3 py-2">
                    {t.service_name}
                  </td>
                  <td className="px-3 py-2">
                    {t.beneficiary_name}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    ₹{t.amount_collected}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
