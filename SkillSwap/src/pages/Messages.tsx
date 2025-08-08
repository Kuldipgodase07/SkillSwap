import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, addDoc, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Conversation, Message, User, VideoSession } from '../types';
import { MessageSquare, Send, User as UserIcon, Search, Video, Plus } from 'lucide-react';
import { getConnectionRequestStatus } from '../firebase/connectionRequests';
import VideoSessionModal from '../components/VideoSessionModal';
import VideoSessionList from '../components/VideoSessionList';
import VideoSessionMessage from '../components/VideoSessionMessage';
import WebRTCVideoCall from '../components/WebRTCVideoCall';

const Messages: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [canChat, setCanChat] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [conversationUsers, setConversationUsers] = useState<{ [key: string]: User }>({});
  const [showVideoSessionModal, setShowVideoSessionModal] = useState(false);
  const [showVideoSessions, setShowVideoSessions] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [callRoomId, setCallRoomId] = useState<string | null>(null);

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Function to get conversation display name
  const getConversationDisplayName = (conversation: Conversation): string => {
    if (!currentUser) return 'Unknown User';

    const otherUserId = conversation.participants.find(p => p !== currentUser.uid);
    if (!otherUserId) return 'Unknown User';

    const otherUser = conversationUsers[otherUserId];
    if (otherUser) {
      return otherUser.displayName || otherUser.email || 'Unknown User';
    }

    return 'Loading...';
  };

  // Function to format timestamp
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Function to format message timestamp
  const formatMessageTimestamp = (timestamp: any): string => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;

    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const conversationsData: Conversation[] = [];
        const usersToFetch: string[] = [];

        querySnapshot.forEach((doc) => {
          const conversation = { id: doc.id, ...doc.data() } as Conversation;
          conversationsData.push(conversation);

          // Collect user IDs to fetch
          conversation.participants.forEach(participantId => {
            if (participantId !== currentUser.uid && !usersToFetch.includes(participantId)) {
              usersToFetch.push(participantId);
            }
          });
        });

        setConversations(conversationsData);

        // Fetch user profiles for all conversations
        const userProfiles: { [key: string]: User } = {};
        for (const userId of usersToFetch) {
          const userProfile = await fetchUserProfile(userId);
          if (userProfile) {
            userProfiles[userId] = userProfile;
          }
        }
        setConversationUsers(userProfiles);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      console.log('Fetching conversations for user:', currentUser.uid);
      fetchConversations();

      // Fetch current user profile
      const fetchCurrentUserProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setCurrentUserProfile(userData);
            console.log('Fetched current user profile:', userData);
          } else {
            console.log('No user profile found for:', currentUser.uid);
          }
        } catch (error) {
          console.error('Error fetching current user profile:', error);
        }
      };
      fetchCurrentUserProfile();
    } else {
      console.log('No currentUser, not fetching conversations.');
    }
  }, [currentUser, fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    const checkConnection = async () => {
      if (!currentUser || !selectedConversation) return;
      setChatLoading(true);
      setChatError(null);
      const otherUserId = selectedConversation.participants.find(p => p !== currentUser.uid);
      if (!otherUserId) {
        setChatError('No other user found in conversation.');
        setChatLoading(false);
        console.error('No other user found in conversation:', selectedConversation);
        return;
      }
      let timeout: NodeJS.Timeout | null = null;
      try {
        timeout = setTimeout(() => {
          setChatError('Connection check timed out (5s).');
          setChatLoading(false);
          console.error('Connection check timed out (5s)');
        }, 5000);
        console.log('Checking connection status between', currentUser.uid, 'and', otherUserId);
        const status = await getConnectionRequestStatus(currentUser.uid, otherUserId);
        setCanChat(status === 'accepted');
        console.log('Connection status:', status);
        // Fetch other user profile
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setOtherUser(userData);
          console.log('✅ Fetched other user successfully:', {
            uid: userData.uid,
            displayName: userData.displayName,
            email: userData.email
          });
        } else {
          setOtherUser(null);
          console.warn('❌ Other user profile not found:', otherUserId);
        }
        setChatLoading(false);
        if (timeout) clearTimeout(timeout);
      } catch (err) {
        setChatError('Failed to check connection or fetch user.');
        setChatLoading(false);
        if (timeout) clearTimeout(timeout);
        console.error('Error in checkConnection:', err);
      }
    };
    if (selectedConversation) {
      console.log('Selected conversation:', selectedConversation.id);
      checkConnection();
    }
  }, [selectedConversation, currentUser]);

  const fetchMessages = async (conversationId: string) => {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesData: Message[] = [];
        querySnapshot.forEach((doc) => {
          messagesData.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(messagesData);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentUser || !selectedConversation || !newMessage.trim()) return;

    try {
      const messageData = {
        senderId: currentUser.uid,
        receiverId: selectedConversation.participants.find(p => p !== currentUser.uid) || '',
        content: newMessage.trim(),
        timestamp: new Date(),
        read: false
      };

      await addDoc(
        collection(db, 'messages'),
        messageData
      );

      // Update conversation's last message
      // This would typically be done in a Cloud Function for better performance

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSessionCreated = (session: VideoSession) => {
    // You could send a system message about the new session
    console.log('Video session created:', session);
  };

  const filteredConversations = conversations.filter(conversation => {
    const displayName = getConversationDisplayName(conversation).toLowerCase();
    return displayName.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">You must be logged in to view messages.</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No conversations yet</p>
        <p className="text-sm text-gray-500 mt-2">
          Start by connecting with other users and accepting connection requests.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex flex-col lg:flex-row transition-all duration-500">
      {/* Conversation List */}
      <div className="w-full lg:w-1/3 p-4 flex flex-col">
        <div className="backdrop-blur-md bg-white/80 rounded-2xl shadow-xl border border-gray-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 tracking-wide">Chats</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-300 border-none outline-none text-gray-800 placeholder-gray-400 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-2 divide-y divide-gray-100">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => {
                const otherUserId = conversation.participants.find(p => p !== currentUser?.uid);
                const isSelected = selectedConversation?.id === conversation.id;
                const initials = getConversationDisplayName(conversation).split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-gray-100 border-l-4 border-blue-500 shadow-md' : 'hover:bg-gray-50'} group`}
                    style={{ borderRadius: isSelected ? '0 1rem 1rem 0' : '1rem' }}
                  >
                    <div className="relative w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full text-gray-500 font-bold text-lg select-none">
                      {initials}
                      {/* Online dot (simulate online for demo) */}
                      <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-green-400 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{getConversationDisplayName(conversation)}</p>
                      {conversation.lastMessage && (
                        <p className="text-xs text-gray-400 truncate">{conversation.lastMessage.content}</p>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-300">{formatTimestamp(conversation.lastMessage.timestamp)}</span>
                        {/* Unread badge (simulate unread for demo) */}
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mt-1" />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400">No conversations found</p>
                <p className="text-sm text-gray-300 mt-2">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Chat Area */}
      <div className="w-full lg:w-2/3 flex flex-col p-4">
        <div className="backdrop-blur-md bg-white/90 rounded-2xl shadow-xl border border-gray-200 flex-1 flex flex-col overflow-hidden relative">
          {selectedConversation ? (
            chatLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400"></div>
                <span className="ml-4 text-gray-400">Loading chat...</span>
              </div>
            ) : chatError ? (
              <div className="flex-1 flex items-center justify-center text-red-500">{chatError}</div>
            ) : (
              <>
                {/* Sticky Chat Header */}
                <div className="sticky top-0 z-10 bg-white/95 border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-base select-none">
                      {(otherUser?.displayName || otherUser?.email || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{otherUser?.displayName || otherUser?.email || 'User'}</p>
                      <p className="text-xs text-gray-400">{otherUser?.email}</p>
                      <span className={`inline-block w-2 h-2 rounded-full ${canChat ? 'bg-green-400' : 'bg-gray-300'} ml-1`} />
                      <span className="text-xs ml-2 text-gray-400">{canChat ? 'Connected' : 'Not Connected'}</span>
                    </div>
                  </div>
                  {canChat && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowVideoSessions(!showVideoSessions)}
                        className="rounded-full bg-gray-100 hover:bg-blue-100 text-blue-600 px-3 py-1 flex items-center gap-1 font-medium shadow-sm transition-all text-xs"
                      >
                        <Video className="h-4 w-4" /> Sessions
                      </button>
                      <button
                        onClick={() => setShowVideoSessionModal(true)}
                        className="rounded-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 flex items-center gap-1 font-medium shadow-sm transition-all text-xs"
                      >
                        <Plus className="h-4 w-4" /> Schedule
                      </button>
                    </div>
                  )}
                </div>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar bg-gradient-to-br from-white via-gray-50 to-gray-100">
                  {showVideoSessions ? (
                    <VideoSessionList
                      conversationId={selectedConversation.id}
                      currentUser={currentUserProfile}
                      otherUser={otherUser}
                    />
                  ) : (
                    <div className="space-y-4">
                      {messages.length > 0 ? (
                        messages.map((msg, idx) => {
                          const isOwn = msg.senderId === currentUser?.uid;
                          return (
                            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end group transition-all duration-300`}> 
                              {!isOwn && (
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-gray-500 font-bold text-xs select-none">
                                  {(otherUser?.displayName || otherUser?.email || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                                </div>
                              )}
                              <div className={`relative max-w-[70%] px-4 py-2 rounded-xl shadow transition-all duration-300 ${isOwn ? 'bg-blue-50 text-blue-900 rounded-br-md' : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'}`}
                                style={{ animation: 'fadeInUp 0.3s' }}>
                                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                                <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                  <span className={`text-xs ${isOwn ? 'text-blue-300' : 'text-gray-400'}`}>{formatMessageTimestamp(msg.timestamp)}</span>
                                  {isOwn && <span className="ml-1 text-xs text-green-400">✓✓</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-400">No messages yet</p>
                          <p className="text-sm text-gray-300 mt-2">Start the conversation!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Flat Message Input Bar */}
                {canChat ? (
                  <div className="sticky bottom-0 z-10 bg-white px-6 py-3 border-t border-gray-100 flex items-center gap-2 rounded-b-2xl shadow">
                    {/* Emoji and file buttons (subtle) */}
                    <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 shadow-sm transition-all" title="Emoji (coming soon)">
                      <span role="img" aria-label="emoji">😊</span>
                    </button>
                    <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 shadow-sm transition-all" title="Attach file (coming soon)">
                      <span role="img" aria-label="attach">📎</span>
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-300 border-none outline-none text-gray-800 placeholder-gray-400 transition-all shadow-sm"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="rounded-full bg-blue-500 hover:bg-blue-600 text-white p-3 shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label="Send message"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="sticky bottom-0 z-10 bg-white px-6 py-3 border-t border-gray-100 text-center text-gray-400 rounded-b-2xl shadow">
                    You must be connected to chat. Accept the connection request first.
                  </div>
                )}
                {/* Floating Video Call Button */}
                {canChat && (
                  <button
                    className="fixed bottom-24 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center focus:ring-4 focus:ring-blue-200"
                    onClick={() => { setCallRoomId(selectedConversation.id); setShowCall(true); }}
                    title="Start Video Call"
                    aria-label="Start Video Call"
                  >
                    <Video className="h-6 w-6" />
                  </button>
                )}
              </>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400">Select a conversation</p>
                <p className="text-sm text-gray-300 mt-2">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Video Session Modal and WebRTC Call (unchanged) */}
      {selectedConversation && (
        <VideoSessionModal
          isOpen={showVideoSessionModal}
          onClose={() => setShowVideoSessionModal(false)}
          conversationId={selectedConversation.id}
          otherUser={otherUser}
          currentUser={currentUserProfile}
          onSessionCreated={handleSessionCreated}
        />
      )}
      {showCall && callRoomId && selectedConversation && otherUser && currentUserProfile && (
        <WebRTCVideoCall
          roomId={callRoomId}
          currentUserId={currentUserProfile.uid}
          otherUserId={otherUser.uid}
          onClose={() => { setShowCall(false); setCallRoomId(null); }}
        />
      )}
    </div>
  );
};

export default Messages; 