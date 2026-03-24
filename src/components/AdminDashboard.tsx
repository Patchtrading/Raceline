import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { Users, Key, CheckCircle, XCircle } from 'lucide-react';

type Membership = Database['public']['Tables']['memberships']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type AdminCode = Database['public']['Tables']['admin_codes']['Row'];

type MembershipWithProfile = Membership & { profiles: Profile };

export function AdminDashboard() {
  const { profile } = useAuth();
  const [pendingMemberships, setPendingMemberships] = useState<MembershipWithProfile[]>([]);
  const [adminCodes, setAdminCodes] = useState<AdminCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(1);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.is_admin) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);

    const [membershipsResult, codesResult] = await Promise.all([
      supabase
        .from('memberships')
        .select('*, profiles(*)')
        .eq('status', 'pending')
        .order('applied_at', { ascending: true }),
      supabase
        .from('admin_codes')
        .select('*')
        .order('created_at', { ascending: false })
    ]);

    if (membershipsResult.data) {
      setPendingMemberships(membershipsResult.data as MembershipWithProfile[]);
    }

    if (codesResult.data) {
      setAdminCodes(codesResult.data);
    }

    setLoading(false);
  };

  const handleApprove = async (membershipId: string, membershipType: string) => {
    if (!profile) return;

    const expiresAt = membershipType === 'annual'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('memberships')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: profile.id,
        expires_at: expiresAt,
      })
      .eq('id', membershipId);

    if (!error) {
      await loadData();
    }
  };

  const handleReject = async (membershipId: string) => {
    if (!profile) return;

    const { error } = await supabase
      .from('memberships')
      .update({
        status: 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: profile.id,
      })
      .eq('id', membershipId);

    if (!error) {
      await loadData();
    }
  };

  const generateAdminCode = async () => {
    if (!profile) return;

    const { data: code, error: codeError } = await supabase
      .rpc('generate_next_admin_code');

    if (codeError || !code) {
      console.error('Error generating code:', codeError);
      return;
    }

    const { error } = await supabase
      .from('admin_codes')
      .insert({
        code,
        created_by: profile.id,
        max_uses: newCodeMaxUses,
      });

    if (!error) {
      setGeneratedCode(code);
      await loadData();
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <p className="text-center text-gray-600">You do not have admin permissions.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 max-w-6xl mx-auto">
        <p className="text-center text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Key className="w-6 h-6 text-orange-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Generate Admin Code</h2>
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Uses
            </label>
            <input
              type="number"
              min="1"
              value={newCodeMaxUses}
              onChange={(e) => setNewCodeMaxUses(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={generateAdminCode}
            className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-2 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all font-medium shadow-md hover:shadow-lg"
          >
            Generate Code
          </button>
        </div>

        {generatedCode && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">New code generated:</p>
            <p className="text-2xl font-mono font-bold text-green-700">{generatedCode}</p>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Codes</h3>
          <div className="space-y-2">
            {adminCodes.filter(c => c.is_active).map((code) => (
              <div key={code.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-mono font-semibold text-gray-900">{code.code}</span>
                <span className="text-sm text-gray-600">
                  Used {code.times_used} / {code.max_uses || '∞'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Users className="w-6 h-6 text-orange-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Pending Memberships</h2>
        </div>

        {pendingMemberships.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No pending membership applications</p>
        ) : (
          <div className="space-y-4">
            {pendingMemberships.map((membership) => (
              <div key={membership.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{membership.profiles.full_name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{membership.profiles.role.replace('_', ' ')}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Type:</span>{' '}
                        <span className="capitalize">{membership.membership_type}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Amount:</span> £{membership.amount_paid.toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Applied:</span>{' '}
                        {new Date(membership.applied_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Payment Status:</span>{' '}
                        <span className="capitalize">{membership.payment_status}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(membership.id, membership.membership_type)}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(membership.id)}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
