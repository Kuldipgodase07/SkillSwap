import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MessageSquare, BookOpen, Star, Plus, Search, Users, Clock, TrendingUp, UserPlus, Bell, Shield } from 'lucide-react';
import { User as UserType, Skill, ConnectionRequest, Message, Conversation } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { getMatchingConfig, MatchingConfig } from '../services/matchingConfigService';


const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [totalMessagesCount, setTotalMessagesCount] = useState(0);
  const [skillMatchesCount, setSkillMatchesCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [skillRecommendations, setSkillRecommendations] = useState<Skill[]>([]);
  const [connectionSuggestions, setConnectionSuggestions] = useState<UserType[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    // Real-time listener for user profile
    const unsub = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (userDoc) => {
        try {
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserType;
            setUserProfile(userData);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoading(false);
        }
      }
    );
    return () => unsub();
  }, [currentUser]);

  // Real-time listeners for connections count and pending requests
  useEffect(() => {
    if (!currentUser) return;

    const sentQuery = query(
      collection(db, 'connectionRequests'),
      where('fromUserId', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );
    const receivedQuery = query(
      collection(db, 'connectionRequests'),
      where('toUserId', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );
    const pendingReceivedQuery = query(
      collection(db, 'connectionRequests'),
      where('toUserId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    let sentCount = 0;
    let receivedCount = 0;
    let pendingCount = 0;

    const updateCounts = () => {
      setConnectionsCount(sentCount + receivedCount);
      setPendingRequestsCount(pendingCount);
    };

    const unsubSent = onSnapshot(sentQuery, (snapshot) => {
      sentCount = snapshot.size;
      updateCounts();
    });
    const unsubReceived = onSnapshot(receivedQuery, (snapshot) => {
      receivedCount = snapshot.size;
      updateCounts();
    });
    const unsubPending = onSnapshot(pendingReceivedQuery, (snapshot) => {
      pendingCount = snapshot.size;
      updateCounts();
    });

    return () => {
      unsubSent();
      unsubReceived();
      unsubPending();
    };
  }, [currentUser]);

  // Fetch recent messages and total messages count
  useEffect(() => {
    if (!currentUser) return;

    const fetchRecentMessages = async () => {
      try {
        // Get user's conversations
        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', currentUser.uid),
          orderBy('updatedAt', 'desc'),
          limit(5)
        );

        const conversationsSnapshot = await getDocs(conversationsQuery);
        const recentMessagesData: Message[] = [];
        let totalMessages = 0;

        for (const convDoc of conversationsSnapshot.docs) {
          const conversation = convDoc.data() as Conversation;
          if (conversation.lastMessage) {
            recentMessagesData.push(conversation.lastMessage);
          }
          // Count messages in this conversation
          const messagesQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', convDoc.id)
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          totalMessages += messagesSnapshot.size;
        }

        setRecentMessages(recentMessagesData.slice(0, 3));
        setTotalMessagesCount(totalMessages);
      } catch (error) {
        console.error('Error fetching recent messages:', error);
      }
    };

    fetchRecentMessages();
  }, [currentUser]);

  // Fetch pending connection requests
  useEffect(() => {
    if (!currentUser) return;

    const pendingQuery = query(
      collection(db, 'connectionRequests'),
      where('toUserId', '==', currentUser.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(pendingQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConnectionRequest));
      setPendingRequests(requests);
    });

    return () => unsub();
  }, [currentUser]);

  // Helper: Skill level order
  const skillLevelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
  // Helper: Calculate distance (Haversine, dummy for now)
  function getDistanceKm(loc1: string, loc2: string): number {
    if (!loc1 || !loc2) return 1000;
    return loc1 === loc2 ? 0 : 100;
  }
  // Helper: Calculate match score
  function calculateMatchScore(user: UserType, userProfile: UserType, config: MatchingConfig): number {
    const skillOverlap = user.skillsToTeach?.filter(teachSkill =>
      userProfile.skillsToLearn?.some(learnSkill => learnSkill.name === teachSkill.name &&
        skillLevelOrder[teachSkill.level] >= skillLevelOrder[config.minSkillLevel])
    ).length || 0;
    const skillScore = skillOverlap > 0 ? 1 : 0;
    const distance = getDistanceKm(user.location || '', userProfile.location || '');
    const locationScore = distance <= config.maxDistanceKm ? 1 : 0;
    const ratingScore = user.rating ? user.rating / 5 : 0;
    return (
      config.skillMatchWeight * skillScore +
      config.locationWeight * locationScore +
      config.ratingWeight * ratingScore
    );
  }

  // Fetch skill recommendations and connection suggestions
  useEffect(() => {
    if (!userProfile) return;

    const fetchRecommendations = async () => {
      try {
        // Get all users to find skill matches
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const allUsers = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserType));

        // Fetch matching config
        const config: MatchingConfig = await getMatchingConfig();

        // Filter and score users
        const potentialMatches = allUsers.filter(user =>
          user.uid !== currentUser?.uid &&
          user.skillsToTeach?.some(teachSkill =>
            userProfile.skillsToLearn?.some(learnSkill => learnSkill.name === teachSkill.name &&
              skillLevelOrder[teachSkill.level] >= skillLevelOrder[config.minSkillLevel])
          )
        ).map(user => ({ ...user, matchScore: calculateMatchScore(user, userProfile, config) }));

        // Filter by min score (optional, here just sort)
        const sortedMatches = potentialMatches
          .filter(u => u.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore);

        setConnectionSuggestions(sortedMatches.slice(0, 5));
        setSkillMatchesCount(sortedMatches.length);

        // Skill recommendations (unchanged)
        const allSkills = allUsers.flatMap(user => user.skillsToTeach || []);
        const skillCounts = allSkills.reduce((acc, skill) => {
          acc[skill.name] = (acc[skill.name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const popularSkills = Object.entries(skillCounts)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([skillName]) => ({
            id: skillName,
            name: skillName,
            category: 'Popular',
            description: 'Popular skill in the community',
            level: 'beginner' as const,
            tags: [skillName]
          }));
        setSkillRecommendations(popularSkills);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    fetchRecommendations();
  }, [userProfile, currentUser]);

  // Generate recent activity
  useEffect(() => {
    if (!userProfile || !currentUser) return;

    const activities = [];

    // Helper function to convert Firestore timestamp to Date
    const convertTimestamp = (timestamp: any): Date => {
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      if (timestamp instanceof Date) {
        return timestamp;
      }
      if (typeof timestamp === 'string') {
        return new Date(timestamp);
      }
      if (typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      return new Date();
    };

    // Add recent messages as activities
    recentMessages.forEach(message => {
      const messageDate = convertTimestamp(message.timestamp);
      activities.push({
        type: 'message',
        content: 'New message in conversation',
        timestamp: messageDate,
        icon: <MessageSquare className="h-4 w-4" />
      });
    });

    // Add pending requests as activities
    pendingRequests.forEach(request => {
      const requestDate = convertTimestamp(request.createdAt);
      activities.push({
        type: 'request',
        content: 'New connection request',
        timestamp: requestDate,
        icon: <UserPlus className="h-4 w-4" />
      });
    });

    // Add profile updates as activities
    if (userProfile.updatedAt) {
      const profileDate = convertTimestamp(userProfile.updatedAt);
      activities.push({
        type: 'profile',
        content: 'Profile updated',
        timestamp: profileDate,
        icon: <BookOpen className="h-4 w-4" />
      });
    }

    // Sort by timestamp and take recent 5
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    setRecentActivity(sortedActivities);
  }, [userProfile, recentMessages, pendingRequests, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (userProfile && userProfile.role === 'super_admin') {
    window.location.href = '/admin';
    return null;
  }

  // Get skill counts from user's actual data
  const skillsToTeachCount = userProfile && Array.isArray(userProfile.skillsToTeach) ? userProfile.skillsToTeach.length : 0;
  const skillsToLearnCount = userProfile && Array.isArray(userProfile.skillsToLearn) ? userProfile.skillsToLearn.length : 0;

  const stats = [
    {
      title: 'Skills to Teach',
      value: skillsToTeachCount,
      icon: <BookOpen className="h-6 w-6" />,
      color: 'bg-blue-100 text-blue-600',
      description: 'Expertise you can share'
    },
    {
      title: 'Skills to Learn',
      value: skillsToLearnCount,
      icon: <Search className="h-6 w-6" />,
      color: 'bg-green-100 text-green-600',
      description: 'Skills you want to acquire'
    },
    {
      title: 'Connections',
      value: connectionsCount,
      icon: <Users className="h-6 w-6" />,
      color: 'bg-purple-100 text-purple-600',
      description: 'Active connections'
    },
    {
      title: 'Total Messages',
      value: totalMessagesCount,
      icon: <MessageSquare className="h-6 w-6" />,
      color: 'bg-indigo-100 text-indigo-600',
      description: 'All conversations'
    },
    {
      title: 'Skill Matches',
      value: skillMatchesCount,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-teal-100 text-teal-600',
      description: 'Potential exchanges'
    },
    {
      title: 'Rating',
      value: userProfile?.rating ? `${userProfile.rating.toFixed(1)}/5` : 'No ratings',
      icon: <Star className="h-6 w-6" />,
      color: 'bg-yellow-100 text-yellow-600',
      description: `${userProfile?.totalRatings || 0} total ratings`
    }
  ];

  const quickActions = [
    {
      title: 'Add Skills to Teach',
      description: 'Share your expertise with others',
      icon: <Plus className="h-8 w-8" />,
      link: '/skills',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Find Skills to Learn',
      description: 'Discover new skills from the community',
      icon: <Search className="h-8 w-8" />,
      link: '/skills',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'View Connections',
      description: 'See your skill exchange connections',
      icon: <Users className="h-8 w-8" />,
      link: '/connections',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'View Messages',
      description: 'Check your conversations',
      icon: <MessageSquare className="h-8 w-8" />,
      link: '/messages',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {userProfile?.displayName || 'User'}!
        </h1>
        <p className="text-gray-600">
          Ready to share your skills and learn something new?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-orange-500" />
              Pending Requests ({pendingRequests.length})
            </h2>
            <Link to="/requests" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="card">
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">New connection request</p>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          try {
                            if (!request.createdAt) return 'Just now';
                            const date = request.createdAt && typeof request.createdAt.toDate === 'function'
                              ? request.createdAt.toDate()
                              : new Date(request.createdAt);
                            return formatDistanceToNow(date, { addSuffix: true });
                          } catch (error) {
                            console.error('Error formatting timestamp:', error);
                            return 'Just now';
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                  <Link to="/requests" className="btn-primary text-sm">
                    Respond
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg text-white ${action.color}`}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-gray-600">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="card">
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="text-blue-500">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{activity.content}</p>
                    <p className="text-sm text-gray-500">
                      {(() => {
                        try {
                          if (!activity.timestamp) return 'Just now';
                          return formatDistanceToNow(activity.timestamp, { addSuffix: true });
                        } catch (error) {
                          console.error('Error formatting activity timestamp:', error);
                          return 'Just now';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activity yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Start by adding your skills or browsing the community
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Connection Suggestions */}
      {connectionSuggestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
            Suggested Connections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectionSuggestions.map((user) => (
              <div key={user.uid} className="card">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-600">
                      {user.displayName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{user.displayName}</h3>
                    <p className="text-sm text-gray-600">
                      {user.skillsToTeach?.length || 0} skills to teach
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Link
                    to={`/profile/${user.uid}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Recommendations */}
      {skillRecommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Skills</h2>
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillRecommendations.map((skill) => (
                <div key={skill.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <h3 className="font-medium text-gray-900 mb-2">{skill.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {skill.category}
                    </span>
                    <Link to="/skills" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Learn More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile Completion */}
      {userProfile && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Complete Your Profile</h2>
          <div className="space-y-4">
            {!userProfile.bio && (
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Add a bio</p>
                  <p className="text-sm text-gray-600">Tell others about yourself</p>
                </div>
                <Link to="/profile" className="btn-primary">
                  Add Bio
                </Link>
              </div>
            )}
            {!userProfile.location && (
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Add location</p>
                  <p className="text-sm text-gray-600">Help others find you</p>
                </div>
                <Link to="/profile" className="btn-primary">
                  Add Location
                </Link>
              </div>
            )}
            {(!Array.isArray(userProfile.skillsToTeach) || userProfile.skillsToTeach.length === 0) && (
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Add skills to teach</p>
                  <p className="text-sm text-gray-600">Share your expertise with others</p>
                </div>
                <Link to="/skills" className="btn-primary">
                  Add Skills
                </Link>
              </div>
            )}
            {(!Array.isArray(userProfile.skillsToLearn) || userProfile.skillsToLearn.length === 0) && (
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Add skills to learn</p>
                  <p className="text-sm text-gray-600">Find people to learn from</p>
                </div>
                <Link to="/skills" className="btn-primary">
                  Add Skills
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;