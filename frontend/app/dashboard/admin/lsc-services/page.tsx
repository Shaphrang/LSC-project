'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type LSC = { id: string; lsc_name: string };
type Category = { id: string; name: string };
type ServiceItem = { id: string; name: string; category_id: string };

export default function LSCServiceMappingPage() {
  const router = useRouter();

  const [lscs, setLscs] = useState<LSC[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [mappedServices, setMappedServices] = useState<string[]>([]);
  const [initialMapped, setInitialMapped] = useState<string[]>([]);
  const [selectedLsc, setSelectedLsc] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Load masters */
  useEffect(() => {
    const load = async () => {
      const { data: l } = await supabase
        .from('lscs')
        .select('id,lsc_name')
        .eq('is_active', true)
        .order('lsc_name');

      const { data: c } = await supabase
        .from('service_categories')
        .select('id,name')
        .eq('is_active', true)
        .order('name');

      const { data: s } = await supabase
        .from('service_items')
        .select('id,name,category_id')
        .eq('is_active', true)
        .order('name');

      setLscs(l || []);
      setCategories(c || []);
      setServices(s || []);
    };

    load();
  }, []);

  /* Load mappings when LSC changes */
  useEffect(() => {
    if (!selectedLsc) {
      setMappedServices([]);
      setInitialMapped([]);
      return;
    }

    const loadMappings = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('lsc_services')
        .select('service_item_id')
        .eq('lsc_id', selectedLsc)
        .eq('is_available', true);

      if (error) {
        setError('Failed to load services.');
        setLoading(false);
        return;
      }

      const ids = (data || []).map(d => d.service_item_id);
      setMappedServices(ids);
      setInitialMapped(ids);
      setLoading(false);
    };

    loadMappings();
  }, [selectedLsc]);

  const toggle = (id: string) => {
    setMappedServices(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const hasChanges =
    mappedServices.sort().join(',') !==
    initialMapped.sort().join(',');

  const save = async () => {
    if (!selectedLsc || !hasChanges) return;

    setSaving(true);
    setError(null);

    const { error: delError } = await supabase
      .from('lsc_services')
      .delete()
      .eq('lsc_id', selectedLsc);

    if (delError) {
      setError('Failed to update services.');
      setSaving(false);
      return;
    }

    if (mappedServices.length > 0) {
      const { error: insError } = await supabase
        .from('lsc_services')
        .insert(
          mappedServices.map(s => ({
            lsc_id: selectedLsc,
            service_item_id: s,
            is_available: true,
          }))
        );

      if (insError) {
        setError('Failed to update services.');
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    router.push('/dashboard/admin');
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-1">
        Assign Services to LSC
      </h1>
      <p className="text-sm text-slate-600 mb-6">
        Select an LSC and assign the services it provides
      </p>

      {/* Select LSC */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-1 block">
          Livelihood Service Centre
        </label>
        <select
          className="w-full border rounded px-3 py-2"
          value={selectedLsc}
          onChange={(e) => setSelectedLsc(e.target.value)}
        >
          <option value="">Select LSC</option>
          {lscs.map(l => (
            <option key={l.id} value={l.id}>
              {l.lsc_name}
            </option>
          ))}
        </select>
      </div>

      {/* Errors */}
      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border p-3 rounded">
          {error}
        </p>
      )}

      {/* Services */}
      {selectedLsc && (
        <>
          {loading ? (
            <p className="text-slate-600">Loading services…</p>
          ) : (
            <div className="space-y-5">
              {categories.map(cat => {
                const items = services.filter(
                  s => s.category_id === cat.id
                );
                if (!items.length) return null;

                return (
                  <div
                    key={cat.id}
                    className="border rounded-lg p-4"
                  >
                    <h2 className="font-semibold mb-3">
                      {cat.name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {items.map(i => (
                        <label
                          key={i.id}
                          className="flex gap-2 items-center text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={mappedServices.includes(i.id)}
                            onChange={() => toggle(i.id)}
                          />
                          {i.name}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              {services.length === 0 && (
                <p className="text-sm text-slate-500">
                  No active services available.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Actions */}
      {selectedLsc && (
        <div className="flex justify-between mt-6">
          <button
            onClick={() => router.back()}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={saving || !hasChanges}
            className={`px-6 py-2 rounded text-white ${
              saving || !hasChanges
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {saving ? 'Saving…' : 'Save Services'}
          </button>
        </div>
      )}
    </div>
  );
}

