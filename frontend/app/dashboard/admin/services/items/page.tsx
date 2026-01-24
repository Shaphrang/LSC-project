//frontend\app\dashboard\admin\services\items\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Category = {
  id: string;
  name: string;
};

type ServiceItem = {
  id: string;
  name: string;
  is_active: boolean;
  category_id: string;
  service_categories: {
    id: string;
    name: string;
  } | null; // ✅ OBJECT, not array
};

export default function ServiceItemsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [form, setForm] = useState({ name: '', category_id: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);

    const { data: catData } = await supabase
      .from('service_categories')
      .select('id, name')
      .order('name');

      const { data: itemData, error } = await supabase
        .from('service_items')
        .select(`
          id,
          name,
          is_active,
          category_id,
          service_categories (
            id,
            name
          )
        `)
        .order('name');

        console.log(itemData);


    setCategories(catData || []);
    setItems(itemData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ADD */
  const addItem = async () => {
    if (!form.name.trim() || !form.category_id) return;

    const { error } = await supabase.from('service_items').insert({
      name: form.name.trim(),
      category_id: form.category_id,
      is_active: true,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setForm({ name: '', category_id: '' });
    loadData();
  };

  /* UPDATE NAME */
  const saveEdit = async (id: string) => {
    if (!editingName.trim()) return;

    const { error } = await supabase
      .from('service_items')
      .update({ name: editingName.trim() })
      .eq('id', id);

    if (error) {
      setError(error.message);
      return;
    }

    setEditingId(null);
    setEditingName('');
    loadData();
  };

  /* TOGGLE ACTIVE */
  const toggleStatus = async (id: string, is_active: boolean) => {
    await supabase
      .from('service_items')
      .update({ is_active: !is_active })
      .eq('id', id);

    loadData();
  };

  /* DELETE (SAFE) */
  const deleteItem = async (id: string) => {
    const confirm = window.confirm(
      'Delete this service item? This cannot be undone.'
    );
    if (!confirm) return;

    const { error } = await supabase
      .from('service_items')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Cannot delete service item. It may be in use.');
      return;
    }

    loadData();
  };

  if (loading) {
    return <p className="p-6">Loading service items…</p>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow space-y-4">
      <h1 className="text-2xl font-bold">Service Items</h1>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border p-3 rounded">
          {error}
        </p>
      )}

      {/* ADD ITEM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="Service item name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          className="border rounded px-3 py-2"
        />

        <select
          value={form.category_id}
          onChange={(e) =>
            setForm({ ...form, category_id: e.target.value })
          }
          className="border rounded px-3 py-2"
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={addItem}
          className="bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add Service
        </button>
      </div>

      {/* LIST */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Service</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-3 py-2">
                  {editingId === i.id ? (
                    <input
                      value={editingName}
                      onChange={(e) =>
                        setEditingName(e.target.value)
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    <span className="font-medium">{i.name}</span>
                  )}
                </td>

                <td className="px-3 py-2">
                  {i.service_categories?.name || '—'}
                </td>

                <td className="px-3 py-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      i.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {i.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td className="px-3 py-2 text-right space-x-2">
                  {editingId === i.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(i.id)}
                        className="text-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(i.id);
                          setEditingName(i.name);
                        }}
                        className="text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          toggleStatus(i.id, i.is_active)
                        }
                        className="text-indigo-600"
                      >
                        {i.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteItem(i.id)}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-gray-500"
                >
                  No service items defined.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
