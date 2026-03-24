import { useState, useEffect } from 'react';
import { BarChart3, Users, MessageSquare, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
  totalMembers: number;
  activeMembers: number;
  pendingApplications: number;
  totalMessages: number;
  messagesLast7Days: number;
  chatRooms: number;
  membersByRole: {
    owner: number;
    shareholder: number;
    syndicate_partner: number;
    trainer: number;
  };
  recentActivity: {
    date: string;
    messages: number;
  }[];
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);

    const [
      membershipsResult,
      messagesResult,
      roomsResult,
      profilesResult,
      recentMessagesResult,
    ] = await Promise.all([
      supabase.from('memberships').select('status'),
      supabase.from('chat_messages').select('created_at').eq('is_deleted', false),
      supabase.from('chat_rooms').select('id').eq('is_active', true),
      supabase.from('profiles').select('role'),
      supabase
        .from('chat_messages')
        .select('created_at')
        .eq('is_deleted', false)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const activeMembers = membershipsResult.data?.filter((m) => m.status === 'active').length || 0;
    const pendingApplications =
      membershipsResult.data?.filter((m) => m.status === 'pending').length || 0;

    const membersByRole = {
      owner: profilesResult.data?.filter((p) => p.role === 'owner').length || 0,
      shareholder: profilesResult.data?.filter((p) => p.role === 'shareholder').length || 0,
      syndicate_partner:
        profilesResult.data?.filter((p) => p.role === 'syndicate_partner').length || 0,
      trainer: profilesResult.data?.filter((p) => p.role === 'trainer').length || 0,
    };

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const recentActivity = last7Days.map((date) => ({
      date,
      messages:
        recentMessagesResult.data?.filter((m) => m.created_at.startsWith(date)).length || 0,
    }));

    setAnalytics({
      totalMembers: membershipsResult.data?.length || 0,
      activeMembers,
      pendingApplications,
      totalMessages: messagesResult.data?.length || 0,
      messagesLast7Days: recentMessagesResult.data?.length || 0,
      chatRooms: roomsResult.data?.length || 0,
      membersByRole,
      recentActivity,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <p className="text-center text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Active</span>
          </div>
          <p className="text-3xl font-bold">{analytics.activeMembers}</p>
          <p className="text-sm opacity-80">Active Members</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Pending</span>
          </div>
          <p className="text-3xl font-bold">{analytics.pendingApplications}</p>
          <p className="text-sm opacity-80">Applications</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Total</span>
          </div>
          <p className="text-3xl font-bold">{analytics.totalMessages}</p>
          <p className="text-sm opacity-80">Messages Sent</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Last 7 days</span>
          </div>
          <p className="text-3xl font-bold">{analytics.messagesLast7Days}</p>
          <p className="text-sm opacity-80">Recent Messages</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Members by Role</h3>
          <div className="space-y-3">
            {Object.entries(analytics.membersByRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">{role.replace('_', ' ')}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(count / analytics.activeMembers) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="font-semibold text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Message Activity (Last 7 Days)</h3>
          <div className="space-y-2">
            {analytics.recentActivity.map((day) => {
              const maxMessages = Math.max(...analytics.recentActivity.map((d) => d.messages));
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-16">
                    {dayName} {dateStr}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-green-500 h-6 rounded-full flex items-center justify-end px-2"
                      style={{
                        width: maxMessages > 0 ? `${(day.messages / maxMessages) * 100}%` : '0%',
                        minWidth: day.messages > 0 ? '24px' : '0',
                      }}
                    >
                      {day.messages > 0 && (
                        <span className="text-xs font-semibold text-white">{day.messages}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{analytics.chatRooms}</p>
            <p className="text-sm text-gray-600 mt-1">Active Chat Rooms</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{analytics.totalMembers}</p>
            <p className="text-sm text-gray-600 mt-1">Total Applications</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {analytics.activeMembers > 0
                ? Math.round((analytics.messagesLast7Days / analytics.activeMembers) * 10) / 10
                : 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Avg Messages/Member</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {analytics.totalMembers > 0
                ? Math.round((analytics.activeMembers / analytics.totalMembers) * 100)
                : 0}
              %
            </p>
            <p className="text-sm text-gray-600 mt-1">Approval Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
