import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { getPlatformStats } from '../services/adminService';
import { PlatformStats } from '../types';
import {
  Users, Shield, BarChart3, AlertTriangle, Video, Settings, Activity, Eye,
  UserCheck, UserX, Crown, Trash2, Edit, CheckCircle, XCircle, Clock, Sliders,
  Search, ChevronDown, ChevronUp, Star, MessageSquare, FileText, Bell, 
  HardDrive, Flag, Heart, MessageCircle, BookOpen, Award, Zap, Globe,
  Database, Palette, Music, Camera, Code, ArrowRight, Plus, TrendingUp, UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// Import admin page components
import UserManagement from './admin/UserManagement';
import ContentManagement from './admin/ContentManagement';
import CommunityModeration from './admin/CommunityModeration';
import ReportsManagement from './admin/ReportsManagement';
import CommunicationManagement from './admin/CommunicationManagement';
import AnalyticsDashboard from './admin/AnalyticsDashboard';
import AdminSettings from './admin/AdminSettings';

// Admin Dashboard Overview Component
const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSkills, setTotalSkills] = useState<number>(0);
  const [approvedSkills, setApprovedSkills] = useState<number>(0);

  useEffect(() => {
    // Real-time listener for skills collection
    const unsubscribe = onSnapshot(collection(db, 'skills'), async (snapshot) => {
      setTotalSkills(snapshot.size);
      setApprovedSkills(snapshot.docs.filter(doc => doc.data().isApproved).length);
      // Optionally, you can also update stats here if you want other stats to be real-time
    });
    loadStats();
    return () => unsubscribe();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await getPlatformStats();
      setStats(statsData);
      setTotalSkills(statsData.totalSkills);
      setApprovedSkills(statsData.approvedSkills);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
        <button
          onClick={loadStats}
          className="btn-secondary flex items-center space-x-2"
        >
          <Activity className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500">{stats.activeUsers} active</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Skills</p>
                <p className="text-2xl font-semibold text-gray-900">{totalSkills}</p>
                <p className="text-xs text-gray-500">{approvedSkills} approved</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingReports}</p>
                <p className="text-xs text-gray-500">Need attention</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages}</p>
                <p className="text-xs text-gray-500">Platform activity</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/admin/users"
              className="flex items-center space-x-3 p-3 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
            >
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Manage Users</span>
            </Link>
            <Link
              to="/admin/content"
              className="flex items-center space-x-3 p-3 bg-green-50 rounded hover:bg-green-100 transition-colors"
            >
              <BookOpen className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Content Management</span>
            </Link>
            <Link
              to="/admin/moderation"
              className="flex items-center space-x-3 p-3 bg-yellow-50 rounded hover:bg-yellow-100 transition-colors"
            >
              <Shield className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Community Moderation</span>
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center space-x-3 p-3 bg-red-50 rounded hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Reports Management</span>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Database</span>
              </div>
              <span className="text-xs text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Authentication</span>
              </div>
              <span className="text-xs text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">File Storage</span>
              </div>
              <span className="text-xs text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">API Services</span>
              </div>
              <span className="text-xs text-green-600">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      if (userProfile) {
        const adminStatus = userProfile.email === 'admin@gmail.com' && userProfile.role === 'super_admin';
        setIsAdmin(adminStatus);
        setLoading(false);
        
        if (!adminStatus) {
          navigate('/dashboard');
        }
      }
    };
    
    checkAdminStatus();
  }, [currentUser, userProfile, navigate]);

  const adminNavItems = [
    { path: '/admin', label: 'Overview', icon: BarChart3 },
    { path: '/admin/users', label: 'User Management', icon: Users },
    { path: '/admin/content', label: 'Content Management', icon: BookOpen },
    { path: '/admin/moderation', label: 'Community Moderation', icon: Shield },
    { path: '/admin/reports', label: 'Reports Management', icon: AlertTriangle },
    { path: '/admin/announcements', label: 'Communication', icon: Bell },
    { path: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/admin/skills', label: 'Skills Management', icon: Award },
    { path: '/admin/reviews', label: 'Reviews Management', icon: Star },
    { path: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Shield className="h-8 w-8 mr-3 text-primary-600" />
          Admin Dashboard
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Crown className="h-3 w-3 mr-1" /> Super Admin
            </span>
        </h1>
        <p className="text-gray-600 mt-2">Manage the entire SkillSwap platform</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-1 overflow-x-auto pb-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Route Content */}
      <Routes>
        <Route path="/" element={<AdminOverview />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/content" element={<ContentManagement />} />
        <Route path="/moderation" element={<CommunityModeration />} />
        <Route path="/reports" element={<ReportsManagement />} />
        <Route path="/announcements" element={<CommunicationManagement />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="*" element={<AdminOverview />} />
      </Routes>
    </div>
  );
};

export default AdminDashboard;