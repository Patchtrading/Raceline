import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function MembershipApplication() {
  const { user, appSettings, refreshMembership } = useAuth();
  const [membershipType, setMembershipType] = useState<'annual' | 'lifetime'>('annual');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const annualPrice = appSettings?.annual_price || 5.00;
  const lifetimePrice = appSettings?.lifetime_price || 10.00;
  const primaryColor = appSettings?.primary_color || '#2563eb';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const amount = membershipType === 'annual' ? annualPrice : lifetimePrice;
      let codeId: string | null = null;
      let paymentStatus: 'unpaid' | 'waived' = 'unpaid';
      let status: 'pending' | 'active' = 'pending';

      if (adminCode.trim()) {
        const { data: validationData, error: validationError } = await supabase
          .rpc('validate_admin_code', { code_input: adminCode.trim() });

        if (validationError) {
          setError('Invalid or expired admin code');
          setLoading(false);
          return;
        }

        if (validationData) {
          codeId = validationData;
          paymentStatus = 'waived';
          status = 'active';
        } else {
          setError('Invalid or expired admin code');
          setLoading(false);
          return;
        }
      }

      const expiresAt = membershipType === 'annual' && status === 'active'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: insertError } = await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          membership_type: membershipType,
          amount_paid: amount,
          payment_status: paymentStatus,
          status: status,
          admin_code_used: codeId,
          expires_at: expiresAt,
          approved_at: status === 'active' ? new Date().toISOString() : null,
        });

      if (insertError) throw insertError;

      setSuccess(true);
      await refreshMembership();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {adminCode ? 'Membership Activated!' : 'Application Submitted!'}
          </h2>
          <p className="text-gray-600">
            {adminCode
              ? 'Your membership is now active. You can start chatting with other members.'
              : 'Your membership application has been submitted. An admin will review it shortly.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for Membership</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Membership Type
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                   style={{ borderColor: membershipType === 'annual' ? primaryColor : '#e5e7eb' }}>
              <input
                type="radio"
                name="membershipType"
                value="annual"
                checked={membershipType === 'annual'}
                onChange={(e) => setMembershipType(e.target.value as 'annual')}
                className="w-4 h-4 text-orange-600"
              />
              <span className="ml-3 flex-1">
                <span className="block font-medium text-gray-900">Annual Membership</span>
                <span className="block text-sm text-gray-600">£{annualPrice.toFixed(2)} per year</span>
              </span>
            </label>

            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                   style={{ borderColor: membershipType === 'lifetime' ? primaryColor : '#e5e7eb' }}>
              <input
                type="radio"
                name="membershipType"
                value="lifetime"
                checked={membershipType === 'lifetime'}
                onChange={(e) => setMembershipType(e.target.value as 'lifetime')}
                className="w-4 h-4 text-orange-600"
              />
              <span className="ml-3 flex-1">
                <span className="block font-medium text-gray-900">Lifetime Membership</span>
                <span className="block text-sm text-gray-600">£{lifetimePrice.toFixed(2)} one-time payment</span>
              </span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700 mb-2">
            Admin Code (Optional)
          </label>
          <input
            type="text"
            id="adminCode"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            placeholder="Enter code to skip payment"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            If you have an admin code, your membership will be activated immediately without payment.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

{adminCode ? (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-4 rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-all shadow-md hover:shadow-lg"
          >
            {loading ? 'Submitting...' : 'Activate Membership'}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 text-center">Choose your payment option:</p>
            <a
              href={membershipType === 'annual' ? 'https://pay.tide.co/productsraceline-ap-I9x5JV0r' : 'https://pay.tide.co/products/raceline-ap-gDe5hte7'}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-4 rounded-lg hover:from-orange-700 hover:to-orange-800 font-medium transition-all shadow-md hover:shadow-lg text-center"
            >
              Pay £{membershipType === 'annual' ? annualPrice.toFixed(2) : lifetimePrice.toFixed(2)} Now
            </a>
            <p className="text-sm text-gray-600 text-center">
              Click to complete your payment securely via Tide
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
