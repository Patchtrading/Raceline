import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { Send, Trash2, Search, Paperclip, X, Download, Image as ImageIcon } from 'lucide-react';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type UploadedFile = Database['public']['Tables']['uploaded_files']['Row'];

type MessageWithProfile = ChatMessage & {
  profiles: Profile;
  uploaded_files?: UploadedFile[];
};

interface EnhancedChatProps {
  roomId: string;
  roomName: string;
}

export function EnhancedChat({ roomId, roomName }: EnhancedChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    updateLastRead();

    const channel = supabase
      .channel(`chat_messages_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateLastRead = async () => {
    if (!user) return;

    await supabase
      .from('chat_room_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', user.id);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, profiles(*)')
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const messagesWithFiles = await Promise.all(
        data.map(async (msg) => {
          if (msg.file_attachments && msg.file_attachments.length > 0) {
            const { data: files } = await supabase
              .from('uploaded_files')
              .select('*')
              .in('id', msg.file_attachments);

            return { ...msg, uploaded_files: files || [] } as MessageWithProfile;
          }
          return msg as MessageWithProfile;
        })
      );

      setMessages(messagesWithFiles);
    }
    setLoading(false);
  };

  const checkRateLimit = async (): Promise<boolean> => {
    if (!user) return false;

    const { data: rateLimit } = await supabase
      .from('message_rate_limit')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    if (!rateLimit) {
      await supabase.from('message_rate_limit').insert({
        user_id: user.id,
        message_count: 1,
        window_start: now.toISOString(),
      });
      return true;
    }

    const windowStart = new Date(rateLimit.window_start);

    if (windowStart < oneMinuteAgo) {
      await supabase
        .from('message_rate_limit')
        .update({
          message_count: 1,
          window_start: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('user_id', user.id);
      return true;
    }

    if (rateLimit.message_count >= 10) {
      alert('You are sending messages too quickly. Please wait a moment.');
      return false;
    }

    await supabase
      .from('message_rate_limit')
      .update({
        message_count: rateLimit.message_count + 1,
        updated_at: now.toISOString(),
      })
      .eq('user_id', user.id);

    return true;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    const canSend = await checkRateLimit();
    if (!canSend) return;

    const { error } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      message: newMessage.trim(),
      room_id: roomId,
    });

    if (!error) {
      setNewMessage('');
      updateLastRead();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);

    try {
      const uploadedFileIds: string[] = [];

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Max size is 10MB.`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${roomId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: fileRecord } = await supabase
          .from('uploaded_files')
          .insert({
            room_id: roomId,
            uploaded_by: user.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
          })
          .select()
          .single();

        if (fileRecord) {
          uploadedFileIds.push(fileRecord.id);
        }
      }

      if (uploadedFileIds.length > 0) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          message: 'Shared file(s)',
          room_id: roomId,
          file_attachments: uploadedFileIds,
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_deleted: true })
      .eq('id', messageId);

    if (!error) {
      loadMessages();
    }
  };

  const downloadFile = async (file: UploadedFile) => {
    const { data } = await supabase.storage
      .from('chat-files')
      .download(file.file_path);

    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter(
        (msg) =>
          msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <p className="text-center text-gray-600">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col" style={{ height: '600px' }}>
      <div className="bg-gradient-to-r from-orange-600 via-blue-600 to-green-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{roomName}</h2>
            <p className="text-sm text-orange-100">Chat with your group</p>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-white/20 rounded transition-colors"
            aria-label="Search messages"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {showSearch && (
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-10 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:bg-white/30 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            {searchQuery ? 'No messages found' : 'No messages yet. Start the conversation!'}
          </p>
        ) : (
          filteredMessages.map((message) => {
            const isOwnMessage = message.user_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        isOwnMessage ? 'text-orange-100' : 'text-gray-600'
                      }`}
                    >
                      {message.profiles.full_name}
                    </span>
                    {isOwnMessage && (
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="ml-2 text-orange-200 hover:text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm break-words">{message.message}</p>

                  {message.uploaded_files && message.uploaded_files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.uploaded_files.map((file) => (
                        <button
                          key={file.id}
                          onClick={() => downloadFile(file)}
                          className={`flex items-center gap-2 w-full p-2 rounded ${
                            isOwnMessage
                              ? 'bg-white/20 hover:bg-white/30'
                              : 'bg-gray-200 hover:bg-gray-300'
                          } transition-colors`}
                        >
                          {file.file_type.startsWith('image/') ? (
                            <ImageIcon className="w-4 h-4" />
                          ) : (
                            <Paperclip className="w-4 h-4" />
                          )}
                          <span className="text-xs truncate flex-1 text-left">
                            {file.file_name}
                          </span>
                          <Download className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className={`text-xs ${
                      isOwnMessage ? 'text-orange-200' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={uploading ? 'Uploading files...' : 'Type your message...'}
            disabled={uploading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || uploading}
            className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-2 rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
