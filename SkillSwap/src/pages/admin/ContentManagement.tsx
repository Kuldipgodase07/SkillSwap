import React, { useState, useEffect } from 'react';
import { 
  getAllSkills, 
  approveSkill, 
  rejectSkill, 
  deleteSkill,
  logAdminAction 
} from '../../services/adminService';
import { Skill } from '../../types';
import {
  BookOpen, CheckCircle, XCircle, Trash2, Eye, Edit, Search, Activity,
  Filter, Download, AlertTriangle, Star, Users, Calendar, Tag, X
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const ContentManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    loadSkills();
  }, []);

  useEffect(() => {
    filterSkills();
  }, [skills, searchTerm, filterStatus, filterCategory]);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const skillsData = await getAllSkills();
      setSkills(skillsData);
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSkills = () => {
    let result = skills;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(skill =>
        skill.title?.toLowerCase().includes(term) ||
        skill.description?.toLowerCase().includes(term) ||
        skill.category?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(skill => {
        if (filterStatus === 'approved') return skill.isApproved === true;
        if (filterStatus === 'pending') return skill.isApproved === undefined || skill.isApproved === null;
        if (filterStatus === 'rejected') return skill.isApproved === false;
        return true;
      });
    }

    if (filterCategory !== 'all') {
      result = result.filter(skill => skill.category === filterCategory);
    }

    setFilteredSkills(result);
  };

  const handleSkillAction = async () => {
    if (!selectedSkill || !currentUser) return;

    try {
      switch (actionType) {
        case 'approve':
          await approveSkill(selectedSkill.id, currentUser.uid);
          await logAdminAction('skill_approved', currentUser.uid, {
            skillId: selectedSkill.id,
            skillTitle: selectedSkill.title
          });
          break;
        case 'reject':
          await rejectSkill(selectedSkill.id, currentUser.uid, actionReason);
          await logAdminAction('skill_rejected', currentUser.uid, {
            skillId: selectedSkill.id,
            skillTitle: selectedSkill.title,
            reason: actionReason
          });
          break;
        case 'delete':
          await deleteSkill(selectedSkill.id, currentUser.uid);
          await logAdminAction('skill_deleted', currentUser.uid, {
            skillId: selectedSkill.id,
            skillTitle: selectedSkill.title,
            reason: actionReason
          });
          break;
      }
      
      setShowActionModal(false);
      setActionReason('');
      loadSkills();
    } catch (error) {
      console.error('Error performing skill action:', error);
    }
  };

  const getStatusBadge = (isApproved: boolean | undefined) => {
    if (isApproved === true) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</span>;
    } else if (isApproved === false) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</span>;
    } else {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Pending</span>;
    }
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      beginner: 'bg-blue-100 text-blue-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const exportSkills = () => {
    const csvContent = [
      ['Title', 'Category', 'Level', 'Status', 'Created Date', 'Description'],
      ...filteredSkills.map(skill => [
        skill.title || 'N/A',
        skill.category || 'N/A',
        skill.level || 'N/A',
        skill.isApproved === true ? 'Approved' : skill.isApproved === false ? 'Rejected' : 'Pending',
        skill.createdAt?.toDate ? format(skill.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A',
        skill.description || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skills_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCategories = () => {
    const categories = Array.from(new Set(skills.map(skill => skill.category).filter(Boolean)));
    return categories;
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
        <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={exportSkills}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={loadSkills}
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
              placeholder="Search skills..."
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
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {getCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSkills.length > 0 ? (
                filteredSkills.map((skill) => (
                  <tr key={skill.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{skill.title}</div>
                          <div className="text-sm text-gray-500">{skill.description?.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Tag className="h-3 w-3 mr-1" />
                        {skill.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLevelBadge(skill.level)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(skill.isApproved)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(skill.createdAt?.toDate ? skill.createdAt.toDate() : new Date(skill.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSkill(skill);
                            setShowSkillModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {skill.isApproved !== true && (
                          <button
                            onClick={() => {
                              setSelectedSkill(skill);
                              setActionType('approve');
                              setShowActionModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Approve Skill"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {skill.isApproved !== false && (
                          <button
                            onClick={() => {
                              setSelectedSkill(skill);
                              setActionType('reject');
                              setShowActionModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                            title="Reject Skill"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSkill(skill);
                            setActionType('delete');
                            setShowActionModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete Skill"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No skills found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Skill Details Modal */}
      {showSkillModal && selectedSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Skill Details</h3>
              <button
                onClick={() => setShowSkillModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="text-sm text-gray-900">{selectedSkill.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900">{selectedSkill.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Level</label>
                  <p className="text-sm text-gray-900">{selectedSkill.level}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">
                    {selectedSkill.isApproved === true ? 'Approved' : 
                     selectedSkill.isApproved === false ? 'Rejected' : 'Pending'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">
                    {format(selectedSkill.createdAt?.toDate ? selectedSkill.createdAt.toDate() : new Date(selectedSkill.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="text-sm text-gray-900">{selectedSkill.userId}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900">{selectedSkill.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {actionType === 'approve' && 'Approve Skill'}
                {actionType === 'reject' && 'Reject Skill'}
                {actionType === 'delete' && 'Delete Skill'}
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {actionType === 'approve' && `Are you sure you want to approve "${selectedSkill.title}"?`}
                {actionType === 'reject' && `Are you sure you want to reject "${selectedSkill.title}"?`}
                {actionType === 'delete' && `Are you sure you want to delete "${selectedSkill.title}"? This action cannot be undone.`}
              </p>
              
              {(actionType === 'reject' || actionType === 'delete') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Enter reason..."
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
                  onClick={handleSkillAction}
                  className={`btn-primary flex-1 ${
                    actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''
                  }`}
                >
                  {actionType === 'approve' && 'Approve'}
                  {actionType === 'reject' && 'Reject'}
                  {actionType === 'delete' && 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
