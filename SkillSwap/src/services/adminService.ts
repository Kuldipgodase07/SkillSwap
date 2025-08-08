import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, PlatformReport, Skill, Message, Conversation, PlatformStats } from '../types';

// User Management
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const updateUserRole = async (userId: string, newRole: string, adminId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
      updatedBy: adminId
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const suspendUser = async (userId: string, adminId: string, reason: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: false,
      suspendedAt: serverTimestamp(),
      suspendedBy: adminId,
      suspensionReason: reason
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

export const activateUser = async (userId: string, adminId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: true,
      activatedAt: serverTimestamp(),
      activatedBy: adminId,
      suspensionReason: null
    });
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string, adminId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Delete user document
    const userRef = doc(db, 'users', userId);
    batch.delete(userRef);
    
    // Delete user's skills
    const skillsRef = collection(db, 'skills');
    const skillsQuery = query(skillsRef, where('userId', '==', userId));
    const skillsSnapshot = await getDocs(skillsQuery);
    skillsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's messages
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(messagesRef, where('senderId', '==', userId));
    const messagesSnapshot = await getDocs(messagesQuery);
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Content Management
export const getAllSkills = async (): Promise<Skill[]> => {
  try {
    const skillsRef = collection(db, 'skills');
    const snapshot = await getDocs(skillsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));
  } catch (error) {
    console.error('Error fetching skills:', error);
    throw error;
  }
};

export const approveSkill = async (skillId: string, adminId: string): Promise<void> => {
  try {
    const skillRef = doc(db, 'skills', skillId);
    await updateDoc(skillRef, {
      isApproved: true,
      approvedAt: serverTimestamp(),
      approvedBy: adminId
    });
  } catch (error) {
    console.error('Error approving skill:', error);
    throw error;
  }
};

export const rejectSkill = async (skillId: string, adminId: string, reason: string): Promise<void> => {
  try {
    const skillRef = doc(db, 'skills', skillId);
    await updateDoc(skillRef, {
      isApproved: false,
      rejectedAt: serverTimestamp(),
      rejectedBy: adminId,
      rejectionReason: reason
    });
  } catch (error) {
    console.error('Error rejecting skill:', error);
    throw error;
  }
};

export const deleteSkill = async (skillId: string, adminId: string): Promise<void> => {
  try {
    const skillRef = doc(db, 'skills', skillId);
    await deleteDoc(skillRef);
  } catch (error) {
    console.error('Error deleting skill:', error);
    throw error;
  }
};

// Community Moderation
export const getAllReports = async (): Promise<PlatformReport[]> => {
  try {
    const reportsRef = collection(db, 'reports');
    const snapshot = await getDocs(reportsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlatformReport));
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const updateReportStatus = async (reportId: string, status: string, adminId: string, action?: string): Promise<void> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
      action
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
};

export const warnUser = async (userId: string, adminId: string, warning: string): Promise<void> => {
  try {
    const warningRef = collection(db, 'warnings');
    await addDoc(warningRef, {
      userId,
      adminId,
      warning,
      createdAt: serverTimestamp(),
      isActive: true
    });
  } catch (error) {
    console.error('Error creating warning:', error);
    throw error;
  }
};

export const muteUser = async (userId: string, adminId: string, duration: number, reason: string): Promise<void> => {
  try {
    const muteRef = collection(db, 'mutes');
    await addDoc(muteRef, {
      userId,
      adminId,
      reason,
      duration,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error('Error muting user:', error);
    throw error;
  }
};

// Site Settings and Configuration
export const updateSiteSettings = async (settings: any, adminId: string): Promise<void> => {
  try {
    const settingsRef = doc(db, 'settings', 'site');
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: adminId
    });
  } catch (error) {
    console.error('Error updating site settings:', error);
    throw error;
  }
};

export const getSiteSettings = async (): Promise<any> => {
  try {
    const settingsRef = doc(db, 'settings', 'site');
    const settingsDoc = await getDoc(settingsRef);
    if (settingsDoc.exists()) {
      return settingsDoc.data();
    }
    return {};
  } catch (error) {
    console.error('Error fetching site settings:', error);
    throw error;
  }
};

// Communication Management
export const sendAnnouncement = async (announcement: any, adminId: string): Promise<void> => {
  try {
    const announcementsRef = collection(db, 'announcements');
    await addDoc(announcementsRef, {
      ...announcement,
      createdBy: adminId,
      createdAt: serverTimestamp(),
      isActive: true
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    throw error;
  }
};

export const getAllAnnouncements = async (): Promise<any[]> => {
  try {
    const announcementsRef = collection(db, 'announcements');
    const snapshot = await getDocs(announcementsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
};

// Data Access and Analytics
export const getPlatformStats = async (): Promise<PlatformStats> => {
  try {
    const usersRef = collection(db, 'users');
    const skillsRef = collection(db, 'skills');
    const reportsRef = collection(db, 'reports');
    const messagesRef = collection(db, 'messages');

    const [usersSnapshot, skillsSnapshot, reportsSnapshot, messagesSnapshot] = await Promise.all([
      getDocs(usersRef),
      getDocs(skillsRef),
      getDocs(reportsRef),
      getDocs(messagesRef)
    ]);

    const totalUsers = usersSnapshot.size;
    const activeUsers = usersSnapshot.docs.filter(doc => doc.data().isActive).length;
    const totalSkills = skillsSnapshot.size;
    const approvedSkills = skillsSnapshot.docs.filter(doc => doc.data().isApproved).length;
    const pendingReports = reportsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const totalMessages = messagesSnapshot.size;

    return {
      totalUsers,
      activeUsers,
      totalSkills,
      approvedSkills,
      pendingReports,
      totalMessages,
      totalSessions: 150, // Placeholder
      completedSessions: 120, // Placeholder
      totalConnections: 75, // Placeholder
      averageRating: 4.5, // Placeholder
      lastUpdated: new Date() // Placeholder
    };
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    throw error;
  }
};

export const getDailyActiveUsers = async (days = 7) => {
  const ref = collection(db, 'analytics/dailyActiveUsers');
  const q = query(ref, orderBy('date', 'desc'), limit(days));
  const snapshot = await getDocs(q);
  // Reverse to get chronological order
  return snapshot.docs.map(doc => doc.data()).reverse();
};

// Security Controls
export const getAdminLogs = async (): Promise<any[]> => {
  try {
    const logsRef = collection(db, 'adminLogs');
    const logsQuery = query(logsRef, orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    throw error;
  }
};

export const logAdminAction = async (action: string, adminId: string, details: any): Promise<void> => {
  try {
    const logsRef = collection(db, 'adminLogs');
    await addDoc(logsRef, {
      action,
      adminId,
      details,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
    throw error;
  }
};

// Skill Verification
export const verifyUserSkill = async (userId: string, skillId: string, adminId: string, verification: any): Promise<void> => {
  try {
    const verificationRef = collection(db, 'skillVerifications');
    await addDoc(verificationRef, {
      userId,
      skillId,
      adminId,
      verification,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error verifying user skill:', error);
    throw error;
  }
};

export const assignBadge = async (userId: string, badgeType: string, adminId: string, reason: string): Promise<void> => {
  try {
    const badgesRef = collection(db, 'badges');
    await addDoc(badgesRef, {
      userId,
      badgeType,
      adminId,
      reason,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error assigning badge:', error);
    throw error;
  }
};

// Export data
export const exportUserData = async (): Promise<any[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
};

export const exportSkillData = async (): Promise<any[]> => {
  try {
    const skillsRef = collection(db, 'skills');
    const snapshot = await getDocs(skillsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error exporting skill data:', error);
    throw error;
  }
};

export default {
  getAllUsers,
  getUserById,
  updateUserRole,
  suspendUser,
  activateUser,
  deleteUser,
  getAllSkills,
  approveSkill,
  rejectSkill,
  deleteSkill,
  getAllReports,
  updateReportStatus,
  warnUser,
  muteUser,
  updateSiteSettings,
  getSiteSettings,
  sendAnnouncement,
  getAllAnnouncements,
  getPlatformStats,
  getAdminLogs,
  logAdminAction,
  verifyUserSkill,
  assignBadge,
  exportUserData,
  exportSkillData,
  getDailyActiveUsers
}; 