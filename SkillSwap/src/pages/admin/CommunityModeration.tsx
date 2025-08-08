import React, { useState, useEffect } from 'react';
import { 
  getAllReports, 
  updateReportStatus, 
  warnUser, 
  muteUser,
  logAdminAction 
} from '../../services/adminService';
import { PlatformReport } from '../../types';
import {
  AlertTriangle, Eye, Edit, CheckCircle, XCircle, Clock, Search, Activity,
  Ban, MessageSquare, Shield, Users, Download, Filter, X, VolumeX, Volume2
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const CommunityModeration: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<PlatformReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<PlatformReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedReport, setSelectedReport] = useState<PlatformReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionDetails, setActionDetails] = useState({
    reason: '',
    duration: 24,
    warning: ''
  });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, filterStatus, filterType]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsData = await getAllReports();
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let result = reports;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(report =>
        report.description?.toLowerCase().includes(term) ||
        report.reportType?.toLowerCase().includes(term) ||
        report.reporterId?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(report => report.status === filterStatus);
    }

    if (filterType !== 'all') {
      result = result.filter(report => report.reportType === filterType);
    }

    setFilteredReports(result);
  };

  const handleReportAction = async () => {
    if (!selectedReport || !currentUser) return;

    try {
      switch (actionType) {
        case 'investigate':
          await updateReportStatus(selectedReport.id, 'investigating', currentUser.uid, 'Report under investigation');
          await logAdminAction('report_investigating', currentUser.uid, {
            reportId: selectedReport.id,
            reportType: selectedReport.reportType
          });
          break;
        case 'resolve':
          await updateReportStatus(selectedReport.id, 'resolved', currentUser.uid, actionDetails.reason);
          await logAdminAction('report_resolved', currentUser.uid, {
            reportId: selectedReport.id,
            reportType: selectedReport.reportType,
            reason: actionDetails.reason
          });
          break;
        case 'dismiss':
          await updateReportStatus(selectedReport.id, 'dismissed', currentUser.uid, actionDetails.reason);
          await logAdminAction('report_dismissed', currentUser.uid, {
            reportId: selectedReport.id,
            reportType: selectedReport.reportType,
            reason: actionDetails.reason
          });
          break;
        case 'warn':
          await warnUser(selectedReport.reportedUserId, currentUser.uid, actionDetails.warning);
          await logAdminAction('user_warned', currentUser.uid, {
            targetUserId: selectedReport.reportedUserId,
            warning: actionDetails.warning,
            reportId: selectedReport.id
          });
          break;
        case 'mute':
          await muteUser(selectedReport.reportedUserId, currentUser.uid, actionDetails.duration, actionDetails.reason);
          await logAdminAction('user_muted', currentUser.uid, {
            targetUserId: selectedReport.reportedUserId,
            duration: actionDetails.duration,
            reason: actionDetails.reason,
            reportId: selectedReport.id
          });
          break;
      }
      
      setShowActionModal(false);
      setActionDetails({ reason: '', duration: 24, warning: '' });
      loadReports();
    } catch (error) {
      console.error('Error performing report action:', error);
    }
  };

  const getReportStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</span>;
      case 'investigating':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Eye className="h-3 w-3 mr-1" />Investigating</span>;
      case 'resolved':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Resolved</span>;
      case 'dismissed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />Dismissed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const getReportTypeBadge = (type: string) => {
    const colors = {
      inappropriate_content: 'bg-red-100 text-red-800',
      spam: 'bg-yellow-100 text-yellow-800',
      harassment: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        {type.replace('_', ' ')}
      </span>
    );
  };

  const exportReports = () => {
    const csvContent = [
      ['Report Type', 'Status', 'Description', 'Reporter ID', 'Reported User ID', 'Created Date'],
      ...filteredReports.map(report => [
        report.reportType || 'N/A',
        report.status || 'N/A',
        report.description || 'N/A',
        report.reporterId || 'N/A',
        report.reportedUserId || 'N/A',
        report.createdAt?.toDate ? format(report.createdAt.toDate(), 'MMM dd, yyyy HH:mm') : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reports_export.csv';
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
        <h2 className="text-2xl font-bold text-gray-900">Community Moderation</h2>
        <div className="flex space-x-2">
          <button
            onClick={exportReports}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={loadReports}
            className="btn-secondary flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="relative flex-grow sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search reports..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="inappropriate_content">Inappropriate Content</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getReportTypeBadge(report.reportType)}
                    <span className="text-sm font-medium text-gray-900">
                      Report #{report.id.slice(-8)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getReportStatusBadge(report.status)}
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowReportModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowActionModal(true);
                      }}
                      className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                      title="Take Action"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                <div className="text-xs text-gray-500">
                  Reported on {format(report.createdAt?.toDate ? report.createdAt.toDate() : new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}
                  {report.reporterId && ` • Reporter: ${report.reporterId}`}
                  {report.reportedUserId && ` • Reported User: ${report.reportedUserId}`}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No reports found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Report Details</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Report ID</label>
                  <p className="text-sm text-gray-900">{selectedReport.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{selectedReport.reportType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{selectedReport.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">
                    {format(selectedReport.createdAt?.toDate ? selectedReport.createdAt.toDate() : new Date(selectedReport.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reporter ID</label>
                  <p className="text-sm text-gray-900">{selectedReport.reporterId || 'Anonymous'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reported User ID</label>
                  <p className="text-sm text-gray-900">{selectedReport.reportedUserId || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900">{selectedReport.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Take Action</h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select action</option>
                  <option value="investigate">Investigate</option>
                  <option value="resolve">Resolve</option>
                  <option value="dismiss">Dismiss</option>
                  <option value="warn">Warn User</option>
                  <option value="mute">Mute User</option>
                </select>
              </div>
              
              {actionType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason/Notes</label>
                  <textarea
                    value={actionDetails.reason}
                    onChange={(e) => setActionDetails({ ...actionDetails, reason: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Enter reason or notes..."
                  />
                </div>
              )}
              
              {actionType === 'warn' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Warning Message</label>
                  <textarea
                    value={actionDetails.warning}
                    onChange={(e) => setActionDetails({ ...actionDetails, warning: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Enter warning message for the user..."
                  />
                </div>
              )}
              
              {actionType === 'mute' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mute Duration (hours)</label>
                  <input
                    type="number"
                    value={actionDetails.duration}
                    onChange={(e) => setActionDetails({ ...actionDetails, duration: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                    max="168"
                  />
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportAction}
                  className="btn-primary flex-1"
                  disabled={!actionType}
                >
                  {actionType === 'investigate' && 'Start Investigation'}
                  {actionType === 'resolve' && 'Resolve Report'}
                  {actionType === 'dismiss' && 'Dismiss Report'}
                  {actionType === 'warn' && 'Send Warning'}
                  {actionType === 'mute' && 'Mute User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityModeration;
