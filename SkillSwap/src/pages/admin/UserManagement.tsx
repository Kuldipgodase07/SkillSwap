import React, { useState, useEffect } from 'react';
import { 
  getAllUsers, 
  updateUserRole, 
  suspendUser, 
  activateUser, 
  deleteUser,
  logAdminAction 
} from '../../services/adminService';
import { User } from '../../types';
import {
  Users, UserCheck, UserX, Crown, Shield, Eye, Edit, Trash2, Search, Activity,
  AlertTriangle, Ban, Unlock, Key, Download, Filter, MoreVertical, X
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let result = users;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user =>
        user.displayName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    }

    if (filterRole !== 'all') {
      result = result.filter(user => user.role === filterRole);
    }

    if (filterStatus !== 'all') {
      result = result.filter(user =>
        filterStatus === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(result);
  };

  const handleUserAction = async () => {
    if (!selectedUser || !currentUser) return;

    try {
      switch (actionType) {
        case 'suspend':
          await suspendUser(selectedUser.uid, currentUser.uid, actionReason);
          await logAdminAction('user_suspended', currentUser.uid, {
            targetUserId: selectedUser.uid,
            reason: actionReason
          });
          break;
        case 'activate':
          await activateUser(selectedUser.uid, currentUser.uid);
          await logAdminAction('user_activated', currentUser.uid, {
            targetUserId: selectedUser.uid
          });
          break;
        case 'delete':
          await deleteUser(selectedUser.uid, currentUser.uid);
          await logAdminAction('user_deleted', currentUser.uid, {
            targetUserId: selectedUser.uid,
            reason: actionReason
          });
          break;
        case 'role':
          await updateUserRole(selectedUser.uid, newRole, currentUser.uid);
          await logAdminAction('user_role_updated', currentUser.uid, {
            targetUserId: selectedUser.uid,
            newRole
          });
          break;
      }
      
      setShowActionModal(false);
      setActionReason('');
      setNewRole('');
      loadUsers();
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Crown className="h-3 w-3 mr-1" />Super Admin</span>;
      case 'admin':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Shield className="h-3 w-3 mr-1" />Admin</span>;
      case 'moderator':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><Shield className="h-3 w-3 mr-1" />Moderator</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><Users className="h-3 w-3 mr-1" />User</span>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />Active</span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><UserX className="h-3 w-3 mr-1" />Suspended</span>
    );
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'Joined Date', 'Skills to Teach', 'Skills to Learn'],
      ...filteredUsers.map(user => [
        user.displayName || 'N/A',
        user.email || 'N/A',
        user.role || 'user',
        user.isActive ? 'Active' : 'Suspended',
        user.createdAt?.toDate ? format(user.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A',
        Array.isArray(user.skillsToTeach) 
          ? user.skillsToTeach.length > 0 
            ? user.skillsToTeach.map(skill => typeof skill === 'string' ? skill : skill.name || skill.title || 'Unknown Skill').join(', ')
            : 'None'
          : 'None',
        Array.isArray(user.skillsToLearn) 
          ? user.skillsToLearn.length > 0 
            ? user.skillsToLearn.map(skill => typeof skill === 'string' ? skill : skill.name || skill.title || 'Unknown Skill').join(', ')
            : 'None'
          : 'None'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
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
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={exportUsers}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={loadUsers}
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
              placeholder="Search users..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType('role');
                            setShowActionModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                          title="Change Role"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        {user.isActive ? (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('suspend');
                              setShowActionModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                            title="Suspend User"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('activate');
                              setShowActionModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Activate User"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType('delete');
                            setShowActionModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No users found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedUser.displayName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="text-sm text-gray-900">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{selectedUser.isActive ? 'Active' : 'Suspended'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joined</label>
                  <p className="text-sm text-gray-900">
                    {format(selectedUser.createdAt?.toDate ? selectedUser.createdAt.toDate() : new Date(selectedUser.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="text-sm text-gray-900">{selectedUser.location || 'Not specified'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Skills to Teach</label>
                <p className="text-sm text-gray-900">
                  {Array.isArray(selectedUser.skillsToTeach) 
                    ? selectedUser.skillsToTeach.length > 0 
                      ? selectedUser.skillsToTeach.map(skill => typeof skill === 'string' ? skill : skill.name || skill.title || 'Unknown Skill').join(', ')
                      : 'None'
                    : 'None'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Skills to Learn</label>
                <p className="text-sm text-gray-900">
                  {Array.isArray(selectedUser.skillsToLearn) 
                    ? selectedUser.skillsToLearn.length > 0 
                      ? selectedUser.skillsToLearn.map(skill => typeof skill === 'string' ? skill : skill.name || skill.title || 'Unknown Skill').join(', ')
                      : 'None'
                    : 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {actionType === 'suspend' && 'Suspend User'}
                {actionType === 'activate' && 'Activate User'}
                {actionType === 'delete' && 'Delete User'}
                {actionType === 'role' && 'Change User Role'}
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
                {actionType === 'suspend' && `Are you sure you want to suspend ${selectedUser.displayName}?`}
                {actionType === 'activate' && `Are you sure you want to activate ${selectedUser.displayName}?`}
                {actionType === 'delete' && `Are you sure you want to delete ${selectedUser.displayName}? This action cannot be undone.`}
                {actionType === 'role' && `Change role for ${selectedUser.displayName}:`}
              </p>
              
              {actionType === 'role' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select role</option>
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              )}
              
              {(actionType === 'suspend' || actionType === 'delete') && (
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
                  onClick={handleUserAction}
                  className={`btn-primary flex-1 ${
                    actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''
                  }`}
                >
                  {actionType === 'suspend' && 'Suspend'}
                  {actionType === 'activate' && 'Activate'}
                  {actionType === 'delete' && 'Delete'}
                  {actionType === 'role' && 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
