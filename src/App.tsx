import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { MembershipApplication } from './components/MembershipApplication';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminSettings } from './components/AdminSettings';
import { EnhancedChat } from './components/EnhancedChat';
import { NotificationBell } from './components/NotificationBell';
import { GroupChatManager } from './components/GroupChatManager';
import { UserProfile } from './components/UserProfile';
import { MemberDirectory } from './components/MemberDirectory';
import { AdminAnalytics } from './components/AdminAnalytics';
import { LegalPages } from './components/LegalPages';
import { PasswordReset } from './components/PasswordReset';
import { LogOut, Settings, Users, BarChart3, MessageSquare, User, List } from 'lucide-react';
import { useState } from 'react';

type ViewType = 'chat' | 'profile' | 'directory' | 'admin-dashboard' | 'admin-settings' | 'admin-analytics';

function App() {
  const { user, profile, membership, appSettings, signOut, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>('00000000-0000-0000-0000-000000000001');

  const primaryColor = appSettings?.primary_color || '#dc2626';
  const appName = appSettings?.app_name || 'Raceline';
  const backgroundStyle = appSettings?.hero_image_url
    ? {
        backgroundImage: `url(${appSettings.hero_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }
    : {};

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={backgroundStyle}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: primaryColor }}
          ></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                {appSettings?.logo_url ? (
                  <img src={appSettings.logo_url} alt={appName} className="h-10 w-auto" />
                ) : (
                  <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {appName}
                  </h1>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AuthForm />
          <div className="text-center mt-4">
            <PasswordReset />
          </div>
        </main>
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <LegalPages />
          </div>
        </footer>
      </div>
    );
  }

  const hasActiveMembership =
    membership?.status === 'active' &&
    (!membership.expires_at || new Date(membership.expires_at) > new Date());

  const hasPendingMembership = membership?.status === 'pending';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {appSettings?.logo_url ? (
                <img src={appSettings.logo_url} alt={appName} className="h-12 w-auto" />
              ) : (
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {appName}
                </h1>
              )}
            </div>

            <div className="flex items-center gap-4">
              {hasActiveMembership && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentView('chat')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      currentView === 'chat'
                        ? 'text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={currentView === 'chat' ? { backgroundColor: primaryColor } : {}}
                    title="Chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Chat</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('directory')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      currentView === 'directory'
                        ? 'text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={currentView === 'directory' ? { backgroundColor: primaryColor } : {}}
                    title="Directory"
                  >
                    <List className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Directory</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('profile')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      currentView === 'profile'
                        ? 'text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={currentView === 'profile' ? { backgroundColor: primaryColor } : {}}
                    title="Profile"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">Profile</span>
                  </button>
                  <NotificationBell />
                </div>
              )}

              {profile.is_admin && (
                <div className="flex gap-2 border-l border-gray-300 pl-4 ml-2">
                  <button
                    onClick={() => setCurrentView('admin-dashboard')}
                    className={`p-2 rounded-lg transition-colors ${
                      currentView === 'admin-dashboard'
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={currentView === 'admin-dashboard' ? { backgroundColor: primaryColor } : {}}
                    title="Admin Dashboard"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentView('admin-analytics')}
                    className={`p-2 rounded-lg transition-colors ${
                      currentView === 'admin-analytics'
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={currentView === 'admin-analytics' ? { backgroundColor: primaryColor } : {}}
                    title="Analytics"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentView('admin-settings')}
                    className={`p-2 rounded-lg transition-colors ${
                      currentView === 'admin-settings'
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={currentView === 'admin-settings' ? { backgroundColor: primaryColor } : {}}
                    title="App Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              )}

              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 transition-colors border-l border-gray-300 pl-4 ml-2"
                style={{
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!membership ? (
          <MembershipApplication />
        ) : hasPendingMembership ? (
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Membership Pending</h2>
            <p className="text-gray-600 mb-4">
              Your membership application is awaiting admin approval. You will receive a
              notification when your application is reviewed.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
                  Please arrange payment of £{membership.amount_paid.toFixed(2)} to complete
                  your membership. Contact an administrator for payment details.
                </p>
              </div>
            )}
          </div>
        ) : hasActiveMembership ? (
          <>
            {currentView === 'admin-dashboard' ? (
              <AdminDashboard />
            ) : currentView === 'admin-settings' ? (
              <AdminSettings />
            ) : currentView === 'admin-analytics' ? (
              <AdminAnalytics />
            ) : currentView === 'profile' ? (
              <UserProfile />
            ) : currentView === 'directory' ? (
              <MemberDirectory />
            ) : currentView === 'chat' ? (
              <div>
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Membership Status</p>
                      <p className="font-semibold text-green-600">Active</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {membership.membership_type}
                      </p>
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

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1">
                    <GroupChatManager
                      onRoomSelect={setCurrentRoomId}
                      currentRoomId={currentRoomId}
                    />
                  </div>
                  <div className="lg:col-span-3">
                    {currentRoomId ? (
                      <EnhancedChat
                        key={currentRoomId}
                        roomId={currentRoomId}
                        roomName={
                          currentRoomId === '00000000-0000-0000-0000-000000000001'
                            ? 'General Chat'
                            : 'Group Chat'
                        }
                      />
                    ) : (
                      <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <p className="text-gray-500">Select a chat room to start messaging</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Membership Expired</h2>
            <p className="text-gray-600 mb-6">
              Your membership has expired. Please renew to continue accessing the chat.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Renew Membership
            </button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <LegalPages />
          <p className="text-sm text-gray-500 mt-4">
            {appSettings?.footer_text || 'Raceline'} © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
