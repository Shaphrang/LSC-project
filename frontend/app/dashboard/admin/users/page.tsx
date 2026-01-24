'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ---------- TYPES ---------- */

type UserProfile = {
  user_id: string;
  role: 'DISTRICT' | 'BLOCK';
  email: string;
  district: string | null;
  block: string | null;
};

/* ---------- PAGE ---------- */

export default function UserManagementPage() {
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /* ---------- LOAD USERS ---------- */
  const loadUsers = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data || []);
    } catch {
      setMessage('Failed to load users');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* ---------- RESET PASSWORD ---------- */
  const resetPassword = async (user_id: string) => {
    if (!newPassword) {
      alert('Enter a password');
      return;
    }

    setSaving(true);

    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        password: newPassword,
      }),
    });

    const result = await res.json();

    setSaving(false);

    if (!res.ok) {
      alert(result.error || 'Failed to reset password');
      return;
    }

    setResetFor(null);
    setNewPassword('');
    alert('Password updated successfully');
  };

  /* ---------- UI ---------- */

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            User Management
          </h1>
          <p className="text-sm text-slate-600">
            District & Block Administrator Accounts
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="border px-4 py-2 rounded text-slate-700 hover:bg-slate-50 w-fit"
        >
          ← Back
        </button>
      </div>

      {message && (
        <p className="text-sm text-red-600 bg-red-50 border p-3 rounded">
          {message}
        </p>
      )}

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">District</th>
              <th className="px-4 py-3 text-left">Block</th>
              <th className="px-4 py-3 text-right">Password</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center">
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className="border-t">
                  <td className="px-4 py-3">{u.email}</td>

                  <td className="px-4 py-3 font-medium">{u.role}</td>

                  <td className="px-4 py-3">{u.district || '—'}</td>

                  <td className="px-4 py-3">{u.block || '—'}</td>

                  <td className="px-4 py-3 text-right">
                    {resetFor === u.user_id ? (
                      <div className="flex justify-end gap-2">
                        <input
                          type="password"
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => resetPassword(u.user_id)}
                          disabled={saving}
                          className="bg-slate-800 text-white px-3 py-1 rounded text-sm"
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setResetFor(null);
                            setNewPassword('');
                          }}
                          className="text-slate-500 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResetFor(u.user_id)}
                        className="text-blue-700 hover:underline text-sm"
                      >
                        Reset
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-4">
        {users.map((u) => (
          <div key={u.user_id} className="bg-white border rounded-lg p-4">
            <p className="font-medium">{u.email}</p>
            <p className="text-sm">Role: {u.role}</p>
            <p className="text-sm">District: {u.district || '—'}</p>
            {u.block && <p className="text-sm">Block: {u.block}</p>}

            <button
              onClick={() => setResetFor(u.user_id)}
              className="text-blue-700 text-sm underline mt-2"
            >
              Reset Password
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
