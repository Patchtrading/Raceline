import { useState, useEffect } from 'react';
import { Plus, Users, X, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface GroupChatManagerProps {
  onRoomSelect: (roomId: string) => void;
  currentRoomId: string | null;
}

export function GroupChatManager({ onRoomSelect, currentRoomId }: GroupChatManagerProps) {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [allMembers, setAllMembers] = useState<Profile[]>([]);
  const [roomMembers, setRoomMembers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    loadRooms();
    loadAllMembers();

    const channel = supabase
      .channel('chat_rooms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
        },
        () => {
          loadRooms();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_room_members',
        },
        () => {
          loadRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadRooms = async () => {
    const { data } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setRooms(data);
    }
  };

  const loadAllMembers = async () => {
    const { data: activeProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id',
        (await supabase
          .from('memberships')
          .select('user_id')
          .eq('status', 'active')
        ).data?.map(m => m.user_id) || []
      );

    if (activeProfiles) {
      setAllMembers(activeProfiles);
    }
  };

  const loadRoomMembers = async (roomId: string) => {
    const { data } = await supabase
      .from('chat_room_members')
      .select('user_id')
      .eq('room_id', roomId);

    if (data) {
      const memberIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberIds);

      if (profiles) {
        setRoomMembers(profiles);
      }
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !user) return;

    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({
        name: newRoomName,
        description: newRoomDescription,
        room_type: 'horse_group',
        created_by: user.id,
      })
      .select()
      .single();

    if (room && !error) {
      const memberInserts = Array.from(selectedMembers).map(memberId => ({
        room_id: room.id,
        user_id: memberId,
      }));

      memberInserts.push({
        room_id: room.id,
        user_id: user.id,
      });

      await supabase.from('chat_room_members').insert(memberInserts);

      for (const memberId of selectedMembers) {
        await supabase.from('notifications').insert({
          user_id: memberId,
          type: 'added_to_room',
          title: 'Added to Group Chat',
          message: `You've been added to the group chat: ${newRoomName}`,
          link: `/chat/${room.id}`,
        });
      }

      setNewRoomName('');
      setNewRoomDescription('');
      setSelectedMembers(new Set());
      setShowCreateModal(false);
      loadRooms();
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this chat room?')) return;

    await supabase
      .from('chat_rooms')
      .update({ is_active: false })
      .eq('id', roomId);

    loadRooms();
  };

  const addMemberToRoom = async (memberId: string) => {
    if (!selectedRoom) return;

    await supabase.from('chat_room_members').insert({
      room_id: selectedRoom.id,
      user_id: memberId,
    });

    await supabase.from('notifications').insert({
      user_id: memberId,
      type: 'added_to_room',
      title: 'Added to Group Chat',
      message: `You've been added to the group chat: ${selectedRoom.name}`,
      link: `/chat/${selectedRoom.id}`,
    });

    loadRoomMembers(selectedRoom.id);
  };

  const removeMemberFromRoom = async (memberId: string) => {
    if (!selectedRoom) return;

    await supabase
      .from('chat_room_members')
      .delete()
      .eq('room_id', selectedRoom.id)
      .eq('user_id', memberId);

    loadRoomMembers(selectedRoom.id);
  };

  const openMembersModal = (room: ChatRoom) => {
    setSelectedRoom(room);
    loadRoomMembers(room.id);
    setShowMembersModal(true);
  };

  const filteredMembers = allMembers.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableMembers = filteredMembers.filter(
    (member) => !roomMembers.some((rm) => rm.id === member.id)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Chat Rooms</h3>
        {profile?.role === 'trainer' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Room
          </button>
        )}
      </div>

      <div className="space-y-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
              currentRoomId === room.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1" onClick={() => onRoomSelect(room.id)}>
                <h4 className="font-semibold">{room.name}</h4>
                {room.description && (
                  <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {room.room_type === 'general' ? 'General Chat' : 'Horse Group'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openMembersModal(room)}
                  className="p-2 hover:bg-gray-100 rounded"
                  aria-label="Manage members"
                >
                  <Users className="w-4 h-4 text-gray-600" />
                </button>
                {profile?.role === 'trainer' && room.created_by === user?.id && room.room_type !== 'general' && (
                  <button
                    onClick={() => deleteRoom(room.id)}
                    className="p-2 hover:bg-red-50 rounded"
                    aria-label="Delete room"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Create Group Chat</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g., Thunder Bay Owners"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    placeholder="What is this group chat for?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Members
                  </label>
                  <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                    {filteredMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.has(member.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedMembers);
                            if (e.target.checked) {
                              newSelected.add(member.id);
                            } else {
                              newSelected.delete(member.id);
                            }
                            setSelectedMembers(newSelected);
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={createRoom}
                    disabled={!newRoomName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Room
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMembersModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Manage Members - {selectedRoom.name}</h3>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search members..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Current Members ({roomMembers.length})</h4>
                  <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    {roomMembers.length === 0 ? (
                      <p className="p-4 text-gray-500 text-center">No members yet</p>
                    ) : (
                      roomMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 border-b last:border-b-0"
                        >
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                          </div>
                          {profile?.role === 'trainer' &&
                            selectedRoom.created_by === user?.id &&
                            member.id !== user?.id && (
                              <button
                                onClick={() => removeMemberFromRoom(member.id)}
                                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                              >
                                Remove
                              </button>
                            )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {profile?.role === 'trainer' && selectedRoom.created_by === user?.id && (
                  <div>
                    <h4 className="font-semibold mb-2">Add Members</h4>
                    <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                      {availableMembers.length === 0 ? (
                        <p className="p-4 text-gray-500 text-center">
                          All members have been added
                        </p>
                      ) : (
                        availableMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 border-b last:border-b-0"
                          >
                            <div>
                              <p className="font-medium">{member.full_name}</p>
                              <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                            </div>
                            <button
                              onClick={() => addMemberToRoom(member.id)}
                              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                            >
                              Add
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
