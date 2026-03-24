import { useState, useEffect } from 'react';
import { Users, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function MemberDirectory() {
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    if (showModal) {
      loadMembers();
    }
  }, [showModal]);

  const loadMembers = async () => {
    setLoading(true);

    const { data: activeMemberships } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('status', 'active');

    if (activeMemberships) {
      const userIds = activeMemberships.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
        .order('full_name');

      if (profiles) {
        setMembers(profiles);
      }
    }

    setLoading(false);
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const groupedMembers = {
    owner: filteredMembers.filter((m) => m.role === 'owner'),
    shareholder: filteredMembers.filter((m) => m.role === 'shareholder'),
    syndicate_partner: filteredMembers.filter((m) => m.role === 'syndicate_partner'),
    trainer: filteredMembers.filter((m) => m.role === 'trainer'),
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owners';
      case 'shareholder':
        return 'Shareholders';
      case 'syndicate_partner':
        return 'Syndicate Partners';
      case 'trainer':
        return 'Trainers';
      default:
        return role;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Users className="w-5 h-5 text-gray-600" />
        <span className="font-medium">Members</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Member Directory</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search members by name or role..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setRoleFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      roleFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({members.length})
                  </button>
                  <button
                    onClick={() => setRoleFilter('owner')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      roleFilter === 'owner'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Owners ({groupedMembers.owner.length})
                  </button>
                  <button
                    onClick={() => setRoleFilter('shareholder')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      roleFilter === 'shareholder'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Shareholders ({groupedMembers.shareholder.length})
                  </button>
                  <button
                    onClick={() => setRoleFilter('syndicate_partner')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      roleFilter === 'syndicate_partner'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Syndicate ({groupedMembers.syndicate_partner.length})
                  </button>
                  <button
                    onClick={() => setRoleFilter('trainer')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      roleFilter === 'trainer'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Trainers ({groupedMembers.trainer.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <p className="text-center text-gray-500">Loading members...</p>
              ) : filteredMembers.length === 0 ? (
                <p className="text-center text-gray-500">No members found</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedMembers).map(([role, roleMembers]) => {
                    if (roleMembers.length === 0 || (roleFilter !== 'all' && roleFilter !== role))
                      return null;

                    return (
                      <div key={role}>
                        <h4 className="font-semibold text-lg mb-3 text-gray-700 capitalize">
                          {getRoleLabel(role)}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {roleMembers.map((member) => (
                            <div
                              key={member.id}
                              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900">
                                    {member.full_name}
                                  </h5>
                                  <p className="text-sm text-gray-600 capitalize mt-1">
                                    {member.role.replace('_', ' ')}
                                  </p>
                                  {member.is_admin && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
