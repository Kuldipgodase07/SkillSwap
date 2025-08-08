import React, { useState, useEffect } from 'react';
import AdminService from '../../services/adminService';
import { PlatformReport } from '../../types';
import {
  AlertTriangle, Eye, Edit, CheckCircle, XCircle, Clock, Search, Activity
} from 'lucide-react';
import { format } from 'date-fns';

const ReportsManagement: React.FC = () => {
  const [reports, setReports] = useState<PlatformReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<PlatformReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, filterStatus, filterType]);

  const loadReports = async () => {
    try {
      const reportsData = await AdminService.getAllReports();
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
        report.reportType?.toLowerCase().includes(term)
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
        <h2 className="text-2xl font-bold text-gray-900">Reports Management</h2>
        <button
          onClick={loadReports}
          className="btn-secondary flex items-center space-x-2"
        >
          <Activity className="h-4 w-4" />
          <span>Refresh</span>
        </button>
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
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {report.reportType?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getReportStatusBadge(report.status)}
                    <button
                      className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                      title="Manage Report"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                <div className="text-xs text-gray-500">
                  Reported on {format(report.createdAt?.toDate ? report.createdAt.toDate() : new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No reports found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsManagement;
