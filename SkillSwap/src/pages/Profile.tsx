import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User as UserType } from '../types';
import { Edit, Save, X, User, MapPin, FileText, Star } from 'lucide-react';

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserType;
            setUserProfile(data);
            setFormData({
              displayName: data.displayName,
              bio: data.bio || '',
              location: data.location || ''
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        updatedAt: new Date()
      });

      setUserProfile(prev => prev ? {
        ...prev,
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location
      } : null);

      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: userProfile?.displayName || '',
      bio: userProfile?.bio || '',
      location: userProfile?.location || ''
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-10 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header Card */}
        <div className="relative bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100 p-8 flex flex-col sm:flex-row items-center gap-8 mb-10">
          <div className="flex-shrink-0 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-green-300 flex items-center justify-center text-white text-4xl font-extrabold shadow-lg mb-3">
              {userProfile.displayName?.charAt(0) || 'U'}
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{userProfile.location || 'No location added yet'}</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center sm:items-start gap-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              {userProfile.displayName}
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold ml-2">
                <User className="h-4 w-4" />
                Learner
              </span>
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold text-lg">{userProfile.rating || 0}</span>
                <span className="text-xs">({userProfile.totalRatings || 0} reviews)</span>
              </span>
              <span className="hidden sm:inline-block">|</span>
              <span className="text-xs sm:text-sm">Member since: <span className="font-semibold">{userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}</span></span>
            </div>
            <div className="w-full flex justify-end">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Main Info and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-8 mb-8">
              <h2 className="text-xl font-bold text-blue-900 mb-6">Basic Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="input-field"
                      placeholder="Enter your display name"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900 font-semibold">{userProfile.displayName}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  {editing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="input-field"
                      rows={4}
                      placeholder="Tell others about yourself..."
                    />
                  ) : (
                    <div className="flex items-start space-x-2">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <span className="text-gray-900">
                        {userProfile.bio || 'No bio added yet'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="input-field"
                      placeholder="Enter your location"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">
                        {userProfile.location || 'No location added yet'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 font-semibold">{userProfile.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-8">
              <h3 className="text-lg font-bold text-blue-900 mb-4">Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{userProfile.rating || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Skills to Teach</span>
                  <span className="font-semibold">{Array.isArray(userProfile.skillsToTeach) ? userProfile.skillsToTeach.length : 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Skills to Learn</span>
                  <span className="font-semibold">{Array.isArray(userProfile.skillsToLearn) ? userProfile.skillsToLearn.length : 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold">
                    {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-blue-100 p-8">
              <h3 className="text-lg font-bold text-blue-900 mb-4">Skills</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Teaching</h4>
                  {Array.isArray(userProfile.skillsToTeach) && userProfile.skillsToTeach.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skillsToTeach.map((skill, index) => (
                        <div key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold shadow">
                          {skill.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No skills added yet</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-green-900 mb-2">Learning</h4>
                  {Array.isArray(userProfile.skillsToLearn) && userProfile.skillsToLearn.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skillsToLearn.map((skill, index) => (
                        <div key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold shadow">
                          {skill.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No skills added yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 