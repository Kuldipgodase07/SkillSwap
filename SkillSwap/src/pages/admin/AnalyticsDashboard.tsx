import React, { useState, useEffect } from 'react';
import { 
  getPlatformStats, 
  getAdminLogs,
  exportUserData,
  exportSkillData,
  logAdminAction,
  getDailyActiveUsers
} from '../../services/adminService';
import {
  BarChart3, TrendingUp, Users, BookOpen, MessageSquare, AlertTriangle,
  Download, Activity, Eye, Filter, Calendar, Star, Heart, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [engagementData, setEngagementData] = useState<{ date: string, activeUsers: number }[]>([]);
  const [engagementLoading, setEngagementLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  useEffect(() => {
    const fetchEngagement = async () => {
      setEngagementLoading(true);
      try {
        const data = await getDailyActiveUsers(7);
        setEngagementData(data.map(d => ({
          date: format(new Date(d.date), 'MMM dd'),
          activeUsers: d.activeUsers
        })));
      } catch (e) {
        setEngagementData([]);
      } finally {
        setEngagementLoading(false);
      }
    };
    fetchEngagement();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [statsData, logsData] = await Promise.all([
        getPlatformStats(),
        getAdminLogs()
      ]);
      setStats(statsData);
      setAdminLogs(logsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    if (!currentUser) return;

    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'users':
          data = await exportUserData();
          filename = 'users_export.csv';
          break;
        case 'skills':
          data = await exportSkillData();
          filename = 'skills_export.csv';
          break;
        default:
          return;
      }

      // Convert to CSV
      const csvContent = [
        Object.keys(data[0] || {}),
        ...data.map(row => Object.values(row))
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      await logAdminAction('data_exported', currentUser.uid, {
        dataType: type,
        recordCount: data.length
      });
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const getActionIcon = (action: string) => {
    const icons: { [key: string]: any } = {
      user_suspended: Users,
      user_activated: Users,
      user_deleted: Users,
      skill_approved: BookOpen,
      skill_rejected: BookOpen,
      skill_deleted: BookOpen,
      report_resolved: AlertTriangle,
      report_dismissed: AlertTriangle,
      announcement_sent: MessageSquare,
      data_exported: Download
    };
    return icons[action] || Activity;
  };

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      user_suspended: 'text-red-600',
      user_activated: 'text-green-600',
      user_deleted: 'text-red-600',
      skill_approved: 'text-green-600',
      skill_rejected: 'text-yellow-600',
      skill_deleted: 'text-red-600',
      report_resolved: 'text-green-600',
      report_dismissed: 'text-gray-600',
      announcement_sent: 'text-blue-600',
      data_exported: 'text-purple-600'
    };
    return colors[action] || 'text-gray-600';
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
      {/* User Engagement Chart */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement (Last 7 Days)</h3>
        {engagementLoading ? (
          <div className="flex items-center justify-center h-72">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="activeUsers" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      {/* Key Metrics */}
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
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSkills}</p>
                <p className="text-xs text-gray-500">{stats.approvedSkills} approved</p>
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
        {/* Data Export */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h3>
          <div className="space-y-3">
            <button
              onClick={() => exportData('users')}
              className="w-full flex items-center justify-between p-3 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Export User Data</span>
              </div>
              <Download className="h-4 w-4 text-blue-600" />
            </button>
            
            <button
              onClick={() => exportData('skills')}
              className="w-full flex items-center justify-between p-3 bg-green-50 rounded hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Export Skill Data</span>
              </div>
              <Download className="h-4 w-4 text-green-600" />
            </button>
            
            <button
              onClick={() => exportData('reports')}
              className="w-full flex items-center justify-between p-3 bg-yellow-50 rounded hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Export Report Data</span>
              </div>
              <Download className="h-4 w-4 text-yellow-600" />
            </button>
            
            <button
              onClick={() => exportData('analytics')}
              className="w-full flex items-center justify-between p-3 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Export Analytics Data</span>
              </div>
              <Download className="h-4 w-4 text-purple-600" />
            </button>
          </div>
        </div>

        {/* Platform Insights */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Growth Rate</span>
              </div>
              <span className="text-sm text-green-600">+12.5%</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Avg Rating</span>
              </div>
              <span className="text-sm text-yellow-600">4.5/5.0</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Engagement Rate</span>
              </div>
              <span className="text-sm text-red-600">78.3%</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Security Score</span>
              </div>
              <span className="text-sm text-blue-600">95/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Activity Logs */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Admin Activity</h3>
        <div className="space-y-3">
          {adminLogs.length > 0 ? (
            adminLogs.slice(0, 10).map((log) => {
              const ActionIcon = getActionIcon(log.action);
              return (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <ActionIcon className={`h-4 w-4 ${getActionColor(log.action)}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.details && typeof log.details === 'object' 
                          ? Object.entries(log.details).map(([key, value]) => `${key}: ${value}`).join(', ')
                          : log.details || 'No details'
                        }
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(log.createdAt?.toDate ? log.createdAt.toDate() : new Date(log.createdAt), 'MMM dd, HH:mm')}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No admin activity logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
