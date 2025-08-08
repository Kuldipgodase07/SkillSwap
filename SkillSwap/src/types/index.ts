export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  skillsToTeach: Skill[];
  skillsToLearn: Skill[];
  rating?: number;
  totalRatings?: number;
  // Only 'user' and 'super_admin' are valid. Only 'admin@gmail.com' can be 'super_admin'.
  role: 'user' | 'super_admin';
  isActive: boolean;
  createdAt: any; // Firestore timestamp or Date
  updatedAt: any; // Firestore timestamp or Date
}

export interface Skill {
  id: string;
  name: string;
  title?: string;
  category: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  userId?: string;
  isApproved?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface SkillListing {
  id: string;
  userId: string;
  skill: Skill;
  type: 'teach' | 'learn';
  description: string;
  availability: string;
  preferredExchange?: string;
  createdAt: any; // Firestore timestamp or Date
  updatedAt: any; // Firestore timestamp or Date
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: any; // Firestore timestamp or Date
  read: boolean;
  type?: 'text' | 'video-session-invite' | 'video-session-join' | 'video-session-end';
  sessionId?: string;
  sessionData?: {
    title: string;
    scheduledAt: any;
    duration: number;
    meetingUrl?: string;
  };
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: any; // Firestore timestamp or Date
}

export interface SkillMatch {
  id: string;
  user1Id: string;
  user2Id: string;
  user1Skill: Skill;
  user2Skill: Skill;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any; // Firestore timestamp or Date
  updatedAt: any; // Firestore timestamp or Date
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewedUserId: string;
  skillId: string;
  rating: number;
  comment: string;
  createdAt: any; // Firestore timestamp or Date
}

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any; // Firestore timestamp or Date
  respondedAt?: any; // Firestore timestamp or Date
}

export interface VideoSession {
  id: string;
  conversationId: string;
  teacherId: string;
  learnerId: string;
  skillId: string;
  skillName: string;
  title: string;
  description: string;
  scheduledAt: any; // Firestore timestamp or Date
  duration: number; // in minutes
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  notes?: string;
  createdAt: any; // Firestore timestamp or Date
  updatedAt: any; // Firestore timestamp or Date
}

export interface VideoSessionMessage extends Message {
  type: 'text' | 'video-session-invite' | 'video-session-join' | 'video-session-end';
  sessionId?: string;
  sessionData?: {
    title: string;
    scheduledAt: any;
    duration: number;
    meetingUrl?: string;
  };
}

export interface AdminAction {
  id: string;
  adminId: string;
  action: 'user_suspended' | 'user_activated' | 'skill_approved' | 'skill_rejected' | 'session_cancelled' | 'report_resolved';
  targetId: string; // User ID, Skill ID, or Session ID
  targetType: 'user' | 'skill' | 'session' | 'report';
  description: string;
  createdAt: any; // Firestore timestamp or Date
}

export interface PlatformReport {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedSkillId?: string;
  reportedSessionId?: string;
  reportType: 'inappropriate_behavior' | 'spam' | 'fake_profile' | 'inappropriate_content' | 'technical_issue' | 'other';
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: any; // Firestore timestamp or Date
  updatedAt: any; // Firestore timestamp or Date
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  completedSessions: number;
  totalSkills: number;
  approvedSkills: number;
  pendingReports: number;
  totalConnections: number;
  totalMessages: number;
  averageRating: number;
  lastUpdated: any; // Firestore timestamp or Date
} 