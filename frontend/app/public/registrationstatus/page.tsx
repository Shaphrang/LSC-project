'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AddLSCPage() {
   const router = useRouter();
  const [searchCode, setSearchCode] = useState('');
  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchCode) return;
    setLoading(true);
    setSearchError(null);
    setApplication(null);

    
    const { data, error } = await supabase
      .from('lscs')
      .select('*')
      .eq('applicationCode', searchCode)
      .single();

    if (error || !data) {
      setSearchError("No application found with that code.");
    } else {
      setApplication(data);
    }
    setLoading(false);
  };

  const handleCreateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // send to server to create user Credential
      const response = await fetch('/api/public/createlcsccredential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          lsc_id: application.id,
          applicationCode: application.applicationCode,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed");

      alert("Credentials created successfully!");
      setApplication(null);
      setSearchCode('');
      setEmail('');
      setPassword('');

      router.push('/login');
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-md rounded-xl border border-gray-100">

      <div className="flex justify-end">
        <Link
          href="/login"
          className="text-blue-600 hover:text-blue-800  font-bold font-medium transition-colors "
        >
          Login
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Track My Application</h1>

      {/* 1. SEARCH SECTION (Hide when an APPROVED application is found) */}
      {(!application || application.status !== 'APPROVED') && (
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium text-gray-600">Verification Code *</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter Application Code *"
              required
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          {searchError && <p className="text-red-500 text-sm">{searchError}</p>}
        </div>
      )}

      {/* 2. STATUS FEEDBACK (For Pending or Rejected) */}
      {application && application.status === 'PENDING' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <p className="font-bold">Status: Pending</p>
          <p className="text-sm">Your application ({application.applicationCode}) is still being reviewed. Please check back later.</p>
          
        </div>
      )}

      {application && application.status === 'REJECTED' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <p className="font-bold">Status: Rejected</p>
          <p className="text-sm">Unfortunately, this application has been Rejected .</p>
        </div>
      )}

      {/* 3. CREDENTIAL FORM (Only for Approved) */}
      {application && application.status === 'APPROVED' && (
        <div className="animate-in slide-in-from-top duration-300">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6 flex justify-between items-center">
            <div>
              <p className="text-green-800 text-xs uppercase font-bold tracking-wider">Application Approved</p>
              <p className="text-green-900 font-mono">{application.applicationCode}</p>
            </div>
            {/* <button onClick={() => setApplication(null)} className="text-green-600 hover:underline text-sm">Cancel</button> */}
          </div>

          <form onSubmit={handleCreateCredentials} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Set Login Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" required className="w-full border p-2 rounded-lg mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Set Password</label>
              <input type="password" required className="w-full border p-2 rounded-lg mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
            <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white p-3 rounded-lg font-semibold hover:bg-gray-800">
              {isSubmitting ? 'Creating Account...' : 'Finish Registration'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}