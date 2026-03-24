import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { MembershipApplication } from './components/MembershipApplication';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminSettings } from './components/AdminSettings';
import { Chat } from './components/Chat';
import { LogOut, Settings, Users, Eye } from 'lucide-react';
import { useState } from 'react';

type PreviewPage =
  | 'live'
  | 'login'
  | 'register'
  | 'membership-application'
  | 'pending-approval'
  | 'pending-payment'
  | 'active-chat'
  | 'expired-membership'
  | 'admin-dashboard'
  | 'admin-settings';

function App() {
  const { user, profile, membership, appSettings, signOut, loading } = useAuth();
  const [adminView, setAdminView] = useState<'dashboard' | 'settings' | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewPage>('live');

  const primaryColor = appSettings?.primary_color || '#2563eb';
  const appName = appSettings?.app_name || 'Racehorse Chat';

  const pageOptions: { value: PreviewPage; label: string }[] = [
    { value: 'live', label: '🔴 Live (Current State)' },
    { value: 'login', label: '🔐 Login Page' },
    { value: 'register', label: '📝 Registration Page' },
    { value: 'membership-application', label: '💳 Membership Application' },
    { value: 'pending-approval', label: '⏳ Pending Approval (Paid)' },
    { value: 'pending-payment', label: '💰 Pending Payment' },
    { value: 'active-chat', label: '💬 Active Chat' },
    { value: 'expired-membership', label: '⚠️ Expired Membership' },
    { value: 'admin-dashboard', label: '👥 Admin Dashboard' },
    { value: 'admin-settings', label: '⚙️ Admin Settings' },
  ];

  const renderPreviewContent = () => {
    switch (previewMode) {
      case 'login':
        return <AuthForm />;
      case 'register':
        return <AuthForm />;
      case 'membership-application':
        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    {appSettings?.logo_url ? (
                      <img src={appSettings.logo_url} alt={appName} className="h-10 w-auto" />
                    ) : (
                      <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{appName}</h1>
                    )}
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <MembershipApplication />
            </main>
          </div>
        );
      case 'pending-approval':
        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    {appSettings?.logo_url ? (
                      <img src={appSettings.logo_url} alt={appName} className="h-10 w-auto" />
                    ) : (
                      <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{appName}</h1>
                    )}
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Membership Pending</h2>
                <p className="text-gray-600 mb-4">
                  Your membership application is awaiting admin approval.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Membership Type:</span> <span className="capitalize">Annual</span>
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Amount:</span> £5.00
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Payment Status:</span> <span className="capitalize">Paid</span>
                  </p>
                </div>
              </div>
            </main>
          </div>
        );
      case 'pending-payment':
        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    {appSettings?.logo_url ? (
                      <img src={appSettings.logo_url} alt={appName} className="h-10 w-auto" />
                    ) : (
                      <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{appName}</h1>
                    )}
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Membership Pending</h2>
                <p className="text-gray-600 mb-4">
                  Your membership application is awaiting admin approval.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Membership Type:</span> <span className="capitalize">Annual</span>
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Amount:</span> £5.00
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Payment Status:</span> <span className="capitalize">Unpaid</span>
                  </p>
                </div>
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-medium mb-2">Payment Required</p>
                  <p className="text-sm text-gray-600">
                    Please arrange payment of £5.00 to complete your membership.
                    Contact an administrator for payment details.
                  </p>
                </div>
              </div>
            </main>
          </div>
        );
      case 'active-chat':
        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    {appSettings?.logo_url ? (
                      <img src={appSettings.logo_url} alt={appName} className="h-10 w-auto" />
                    ) : (
                      <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{appName}</h1>
                    )}
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Membership Status</p>
                    <p className="font-semibold text-green-600">Active</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold text-gray-900 capitalize">Annual</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expires</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="max-w-4xl mx-auto">
                <Chat />
              </div>
            </main>
          </div>
        );
      case 'expired-membership':
        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    {appSettings?.logo_url ? (
                      <img src={appSettings.logo_url} alt={appName} className="h-10 w-auto" />
                    ) : (
                      <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{appName}</h1>
                    )}
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Membership Expired</h2>
                <p className="text-gray-600 mb-6">
                  Your membership has expired. Please renew to continue accessing the chat.
                </p>
                <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium">
                  Renew Membership
                </button>
              </div>
            </main>
          </div>
        );
      case 'admin-dashboard':
        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    {appSettings?.logo_url ? (
                      <img src={appSettings.logo_url} alt={appName} className="h-10 w-auto" />
                    ) : (
                      <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{appName}</h1>
                    )}
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AdminDashboard />
            </main>
          </div>
        );
      case 'admin-settings':
        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    {appSettings?.logo_url ? (
                      <img src={appSettings.logo_url} alt={appName} className="h-10 w-auto" />
                    ) : (
                      <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{appName}</h1>
                    )}
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AdminSettings />
            </main>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (previewMode !== 'live') {
    return (
      <div>
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5" />
              <span className="font-semibold">Preview Mode</span>
            </div>
            <select
              value={previewMode}
              onChange={(e) => setPreviewMode(e.target.value as PreviewPage)}
              className="px-4 py-2 rounded-lg bg-white text-gray-900 font-medium shadow-md focus:ring-2 focus:ring-white focus:outline-none"
            >
              {pageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="pt-14">
          {renderPreviewContent()}
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div>
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5" />
              <span className="font-semibold">Preview Mode</span>
            </div>
            <select
              value={previewMode}
              onChange={(e) => setPreviewMode(e.target.value as PreviewPage)}
              className="px-4 py-2 rounded-lg bg-white text-gray-900 font-medium shadow-md focus:ring-2 focus:ring-white focus:outline-none"
            >
              {pageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="pt-14">
          <AuthForm />
        </div>
      </div>
    );
  }

  const hasActiveMembership = membership?.status === 'active' &&
    (!membership.expires_at || new Date(membership.expires_at) > new Date());

  const hasPendingMembership = membership?.status === 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-green-50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5" />
            <span className="font-semibold">Preview Mode</span>
          </div>
          <select
            value={previewMode}
            onChange={(e) => setPreviewMode(e.target.value as PreviewPage)}
            className="px-4 py-2 rounded-lg bg-white text-gray-900 font-medium shadow-md focus:ring-2 focus:ring-white focus:outline-none"
          >
            {pageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-14">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                {appSettings?.logo_url ? (
                  <img src={appSettings.logo_url} alt={appName} className="h-10 w-auto" />
                ) : (
                  <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>{appName}</h1>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{profile.role.replace('_', ' ')}</p>
                </div>

                {profile.is_admin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAdminView(adminView === 'dashboard' ? null : 'dashboard')}
                      className={`p-2 transition-colors ${adminView === 'dashboard' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                      title="Admin Dashboard"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setAdminView(adminView === 'settings' ? null : 'settings')}
                      className={`p-2 transition-colors ${adminView === 'settings' ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
                      title="App Settings"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {profile.is_admin && adminView === 'dashboard' ? (
            <AdminDashboard />
          ) : profile.is_admin && adminView === 'settings' ? (
            <AdminSettings />
          ) : !membership ? (
            <MembershipApplication />
          ) : hasPendingMembership ? (
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Membership Pending</h2>
              <p className="text-gray-600 mb-4">
                Your membership application is awaiting admin approval.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Membership Type:</span>{' '}
                  <span className="capitalize">{membership.membership_type}</span>
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Amount:</span> £{membership.amount_paid.toFixed(2)}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Payment Status:</span>{' '}
                  <span className="capitalize">{membership.payment_status}</span>
                </p>
              </div>
              {membership.payment_status === 'unpaid' && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-medium mb-2">Payment Required</p>
                  <p className="text-sm text-gray-600">
                    Please arrange payment of £{membership.amount_paid.toFixed(2)} to complete your membership.
                    Contact an administrator for payment details.
                  </p>
                </div>
              )}
            </div>
          ) : hasActiveMembership ? (
            <div>
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Membership Status</p>
                    <p className="font-semibold text-green-600">Active</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{membership.membership_type}</p>
                  </div>
                  {membership.expires_at && (
                    <div>
                      <p className="text-sm text-gray-600">Expires</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(membership.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="max-w-4xl mx-auto">
                <Chat />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Membership Expired</h2>
              <p className="text-gray-600 mb-6">
                Your membership has expired. Please renew to continue accessing the chat.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Renew Membership
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
