'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type ServiceItem = {
  id: string;
  name: string;
};

export default function AddServiceEntry() {
  const router = useRouter();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [lscId, setLscId] = useState<string | null>(null);

  const [form, setForm] = useState({
    service_item_id: '',
    service_start_date: '',
    service_end_date: '',
    beneficiary_name: '',
    beneficiary_address: '',
    beneficiary_phone: '',
    amount_collected: '',
  });

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* LOAD LSC + SERVICES */
  useEffect(() => {
    const loadInitialData = async () => {
      setPageLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setPageLoading(false);
        return;
      }

      // 1. Get LSC ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('lsc_id')
        .eq('user_id', session.user.id)
        .single();

      if (profileError || !profile?.lsc_id) {
        setError('Unable to determine LSC.');
        setPageLoading(false);
        return;
      }

      setLscId(profile.lsc_id);

      // 2. Get service_item_ids for this LSC
      const { data: lscServiceRows, error: lscServiceError } =
        await supabase
          .from('lsc_services')
          .select('service_item_id')
          .eq('lsc_id', profile.lsc_id)
          .eq('is_available', true);

      if (lscServiceError) {
        setError('Failed to load LSC services.');
        setPageLoading(false);
        return;
      }

      const serviceIds =
        lscServiceRows?.map((r) => r.service_item_id) || [];

      if (serviceIds.length === 0) {
        setServices([]);
        setPageLoading(false);
        return;
      }

      // 3. Fetch service item details
      const { data: serviceItems, error: serviceError } =
        await supabase
          .from('service_items')
          .select('id, name')
          .in('id', serviceIds)
          .order('name');

      if (serviceError) {
        setError('Failed to load service list.');
      } else {
        setServices(serviceItems || []);
      }

      setPageLoading(false);
    };

    loadInitialData();
  }, []);

  /* HANDLE FORM CHANGE */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* SUBMIT FORM */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!lscId) {
      setError('LSC not found.');
      return;
    }

    if (
      !form.service_item_id ||
      !form.service_start_date ||
      !form.beneficiary_name ||
      !form.amount_collected
    ) {
      setError('Please fill all required fields.');
      return;
    }

    const amount = Number(form.amount_collected);
    if (isNaN(amount) || amount < 0) {
      setError('Invalid amount.');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('service_transactions')
      .insert({
        lsc_id: lscId,
        service_item_id: form.service_item_id,
        service_start_date: form.service_start_date,
        service_end_date: form.service_end_date || null,
        beneficiary_name: form.beneficiary_name,
        beneficiary_address: form.beneficiary_address || null,
        beneficiary_phone: form.beneficiary_phone || null,
        amount_collected: amount,
      });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard/lsc');
    }
  };

  if (pageLoading) {
    return <p className="p-6">Loading form…</p>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <h1 className="text-xl font-bold mb-4">
        Add Service Entry
      </h1>

      {error && (
        <p className="text-red-600 text-sm mb-3">{error}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-4 rounded-lg shadow"
      >
        {/* Service */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Service
          </label>
          <select
            name="service_item_id"
            required
            value={form.service_item_id}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {services.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              No services configured for this LSC.
            </p>
          )}
        </div>

        {/* Dates */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Service Start Date
          </label>
          <input
            type="date"
            name="service_start_date"
            required
            value={form.service_start_date}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Service End / Return Date (optional)
          </label>
          <input
            type="date"
            name="service_end_date"
            value={form.service_end_date}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Beneficiary */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Beneficiary Name
          </label>
          <input
            type="text"
            name="beneficiary_name"
            required
            value={form.beneficiary_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Beneficiary Address
          </label>
          <input
            type="text"
            name="beneficiary_address"
            value={form.beneficiary_address}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Beneficiary Phone
          </label>
          <input
            type="tel"
            name="beneficiary_phone"
            value={form.beneficiary_phone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Amount Collected (₹)
          </label>
          <input
            type="number"
            name="amount_collected"
            required
            value={form.amount_collected}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="border px-5 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
