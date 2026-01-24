//frontend\app\dashboard\admin\services\categories\page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Category = {
  id: string;
  name: string;
};

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_categories')
      .select('id, name')
      .order('name');

    if (error) setError(error.message);
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  /* ADD */
  const addCategory = async () => {
    if (!newName.trim()) return;

    const { error } = await supabase
      .from('service_categories')
      .insert({ name: newName.trim() });

    if (error) {
      setError(error.message);
      return;
    }

    setNewName('');
    loadCategories();
  };

  /* UPDATE */
  const saveEdit = async (id: string) => {
    if (!editingName.trim()) return;

    const { error } = await supabase
      .from('service_categories')
      .update({ name: editingName.trim() })
      .eq('id', id);

    if (error) {
      setError(error.message);
      return;
    }

    setEditingId(null);
    setEditingName('');
    loadCategories();
  };

  /* DELETE (SAFE) */
  const deleteCategory = async (id: string) => {
    const confirm = window.confirm(
      'Delete this category? This cannot be undone.'
    );
    if (!confirm) return;

    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Cannot delete category. It may be in use.');
      return;
    }

    loadCategories();
  };

  if (loading) {
    return <p className="p-6">Loading categories…</p>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow space-y-4">
      <h1 className="text-2xl font-bold">Service Categories</h1>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border p-3 rounded">
          {error}
        </p>
      )}

      {/* ADD */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          onClick={addCategory}
          className="bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      {/* LIST */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Category Name</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">
                  {editingId === c.id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    <span className="font-medium">{c.name}</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right space-x-2">
                  {editingId === c.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(c.id)}
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
                          setEditingId(c.id);
                          setEditingName(c.name);
                        }}
                        className="text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(c.id)}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {categories.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="px-3 py-4 text-center text-gray-500"
                >
                  No categories defined.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
