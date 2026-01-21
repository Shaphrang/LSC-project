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
  const [error, setError] = useState<string | null>(null);

  /* LOAD LSC + SERVICES */
  useEffect(() => {
    const loadInitialData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // Get LSC ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('lsc_id')
        .eq('user_id', session.user.id)
        .single();

      if (!profile?.lsc_id) return;

      setLscId(profile.lsc_id);

      // Get services offered by this LSC
      const { data: serviceData } = await supabase
        .from('lsc_services')
        .select(`
          service_items (
            id,
            name
          )
        `)
        .eq('lsc_id', profile.lsc_id)
        .eq('is_available', true);

      const items =
        serviceData?.map((s: any) => s.service_items[0]) || [];

      setServices(items);
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
    setLoading(true);
    setError(null);

    if (!lscId) {
      setError('LSC not found.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('service_transactions')
      .insert({
        lsc_id: lscId,
        service_item_id: form.service_item_id,
        service_start_date: form.service_start_date,
        service_end_date: form.service_end_date || null,
        beneficiary_name: form.beneficiary_name,
        beneficiary_address: form.beneficiary_address,
        beneficiary_phone: form.beneficiary_phone,
        amount_collected: Number(form.amount_collected),
      });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard/lsc');
    }
  };

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
