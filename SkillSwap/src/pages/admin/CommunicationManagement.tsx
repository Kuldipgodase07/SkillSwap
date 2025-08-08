import React, { useState, useEffect } from 'react';
import { 
  sendAnnouncement, 
  getAllAnnouncements,
  logAdminAction 
} from '../../services/adminService';
import {
  Bell, MessageSquare, Send, Edit, Trash2, Eye, Search, Activity,
  Download, Filter, X, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const CommunicationManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    targetAudience: 'all'
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const announcementsData = await getAllAnnouncements();
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!currentUser || !announcementData.title || !announcementData.message) return;

    try {
      await sendAnnouncement({
        ...announcementData,
        createdAt: new Date(),
        createdBy: currentUser.uid,
        isActive: true
      }, currentUser.uid);

      await logAdminAction('announcement_sent', currentUser.uid, {
        title: announcementData.title,
        type: announcementData.type,
        targetAudience: announcementData.targetAudience
      });

      setShowAnnouncementModal(false);
      setAnnouncementData({
        title: '',
        message: '',
        type: 'info',
        priority: 'normal',
        targetAudience: 'all'
      });
      loadAnnouncements();
    } catch (error) {
      console.error('Error sending announcement:', error);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      success: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-yellow-100 text-yellow-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const exportAnnouncements = () => {
    const csvContent = [
      ['Title', 'Type', 'Priority', 'Target Audience', 'Created Date', 'Message'],
      ...announcements.map(announcement => [
        announcement.title || 'N/A',
        announcement.type || 'N/A',
        announcement.priority || 'N/A',
        announcement.targetAudience || 'N/A',
        announcement.createdAt?.toDate ? format(announcement.createdAt.toDate(), 'MMM dd, yyyy HH:mm') : 'N/A',
        announcement.message || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'announcements_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
        <h2 className="text-2xl font-bold text-gray-900">Communication Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={exportAnnouncements}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAnnouncementModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Send Announcement</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
          <button
            onClick={loadAnnouncements}
            className="btn-secondary flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="space-y-4">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-primary-600" />
                    <span className="text-sm font-medium text-gray-900">{announcement.title}</span>
                    {getTypeBadge(announcement.type)}
                    {getPriorityBadge(announcement.priority)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {format(announcement.createdAt?.toDate ? announcement.createdAt.toDate() : new Date(announcement.createdAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                    <button
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{announcement.message}</p>
                <div className="text-xs text-gray-500">
                  Target: {announcement.targetAudience} • Status: {announcement.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No announcements found</p>
            </div>
          )}
        </div>
      </div>

      {/* Send Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Send Announcement</h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={announcementData.title}
                  onChange={(e) => setAnnouncementData({ ...announcementData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter announcement title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={announcementData.message}
                  onChange={(e) => setAnnouncementData({ ...announcementData, message: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="Enter announcement message..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={announcementData.type}
                    onChange={(e) => setAnnouncementData({ ...announcementData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="success">Success</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={announcementData.priority}
                    onChange={(e) => setAnnouncementData({ ...announcementData, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                  <select
                    value={announcementData.targetAudience}
                    onChange={(e) => setAnnouncementData({ ...announcementData, targetAudience: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Users</option>
                    <option value="new_users">New Users</option>
                    <option value="active_users">Active Users</option>
                    <option value="premium_users">Premium Users</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAnnouncement}
                  className="btn-primary flex-1"
                  disabled={!announcementData.title || !announcementData.message}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationManagement;
