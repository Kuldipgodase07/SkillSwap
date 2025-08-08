import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, addDoc, where, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SkillListing, Skill, Conversation, Message } from '../types';
import { Plus, Search, Filter, BookOpen, Users, X, Send, Trash2, UserCheck } from 'lucide-react';
import {
  sendConnectionRequest,
  getConnectionRequestStatus
} from '../firebase/connectionRequests';

const SkillListings: React.FC = () => {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState<SkillListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'teach' | 'learn'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<SkillListing | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, 'none' | 'pending' | 'accepted' | 'rejected'>>({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<SkillListing | null>(null);

  const [newSkill, setNewSkill] = useState({
    name: '',
    category: '',
    description: '',
    level: 'beginner' as const,
    tags: [] as string[],
    type: 'teach' as const,
    availability: '',
    preferredExchange: ''
  });

  const categories = [
    'Programming', 'Design', 'Photography', 'Music', 'Language', 
    'Cooking', 'Fitness', 'Art', 'Business', 'Technology'
  ];

  const levels = ['beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchStatuses = async () => {
      setStatusLoading(true);
      const statuses: Record<string, 'none' | 'pending' | 'accepted' | 'rejected'> = {};
      for (const listing of listings) {
        if (listing.userId === currentUser.uid) continue;
        const status = await getConnectionRequestStatus(currentUser.uid, listing.userId);
        statuses[listing.id] = status;
      }
      setConnectionStatuses(statuses);
      setStatusLoading(false);
    };
    fetchStatuses();
  }, [listings, currentUser]);

  const fetchListings = async () => {
    try {
      const listingsRef = collection(db, 'skillListings');
      const q = query(listingsRef);
      const querySnapshot = await getDocs(q);
      
      const listingsData: SkillListing[] = [];
      querySnapshot.forEach((doc) => {
        listingsData.push({ id: doc.id, ...doc.data() } as SkillListing);
      });
      
      setListings(listingsData);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const skill: Skill = {
        id: Date.now().toString(),
        name: newSkill.name,
        category: newSkill.category,
        description: newSkill.description,
        level: newSkill.level,
        tags: newSkill.tags
      };

      const listing: Omit<SkillListing, 'id'> = {
        userId: currentUser.uid,
        skill,
        type: newSkill.type,
        description: newSkill.description,
        availability: newSkill.availability,
        preferredExchange: newSkill.preferredExchange,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to skill listings collection
      await addDoc(collection(db, 'skillListings'), listing);
      
             // Update user's profile document with the new skill
       const userRef = doc(db, 'users', currentUser.uid);
       const userDoc = await getDoc(userRef);
       
       if (userDoc.exists()) {
         const userData = userDoc.data();
         console.log('🔍 SkillListings - Current user data:', userData);
         console.log('🔍 SkillListings - Current skillsToTeach:', userData.skillsToTeach);
         console.log('🔍 SkillListings - Current skillsToLearn:', userData.skillsToLearn);
         
         const updateData: any = {
           updatedAt: new Date()
         };
         
         if (newSkill.type === 'teach') {
           const existingSkillsToTeach = Array.isArray(userData.skillsToTeach) ? userData.skillsToTeach : [];
           // Check if skill already exists to avoid duplicates
           const skillExists = existingSkillsToTeach.some((existingSkill: Skill) => 
             existingSkill.name === skill.name
           );
           if (!skillExists) {
             updateData.skillsToTeach = [...existingSkillsToTeach, skill];
           }
         } else {
           const existingSkillsToLearn = Array.isArray(userData.skillsToLearn) ? userData.skillsToLearn : [];
           // Check if skill already exists to avoid duplicates
           const skillExists = existingSkillsToLearn.some((existingSkill: Skill) => 
             existingSkill.name === skill.name
           );
           if (!skillExists) {
             updateData.skillsToLearn = [...existingSkillsToLearn, skill];
           }
         }
         
         // Always update if we have skills to add
         if (updateData.skillsToTeach || updateData.skillsToLearn) {
           console.log('🔄 SkillListings - About to update user profile with:', updateData, 'at:', new Date().toISOString());
           await updateDoc(userRef, updateData);
           console.log('✅ User profile updated with new skill at:', new Date().toISOString());
           console.log('📝 Updated data:', updateData);
         } else {
           console.log('⚠️ Skill already exists or no changes needed');
         }
       } else {
         console.error('❌ User document not found');
       }
      
      // Show success message
      setSuccessMessage('Skill added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset form
      setNewSkill({
        name: '',
        category: '',
        description: '',
        level: 'beginner',
        tags: [],
        type: 'teach',
        availability: '',
        preferredExchange: ''
      });
      
      setShowAddForm(false);
      fetchListings();
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  const handleContact = (listing: SkillListing) => {
    setSelectedListing(listing);
    setShowContactModal(true);
    setContactMessage('');
  };

  const handleSendRequest = async (listing: SkillListing) => {
    if (!currentUser) return;
    setStatusLoading(true);
    await sendConnectionRequest(currentUser.uid, listing.userId);
    // Refresh statuses
    const status = await getConnectionRequestStatus(currentUser.uid, listing.userId);
    setConnectionStatuses(prev => ({ ...prev, [listing.id]: status }));
    setStatusLoading(false);
    setSuccessMessage('Connection request sent!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteSkill = (listing: SkillListing) => {
    setSkillToDelete(listing);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSkill = async () => {
    if (!currentUser || !skillToDelete || skillToDelete.userId !== currentUser.uid) return;
    
    try {
      // Delete from skill listings collection
      await deleteDoc(doc(db, 'skillListings', skillToDelete.id));
      
      // Update user's profile document to remove the skill
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updateData: any = {
          updatedAt: new Date()
        };
        
                 if (skillToDelete.type === 'teach') {
           const existingSkillsToTeach = Array.isArray(userData.skillsToTeach) ? userData.skillsToTeach : [];
           updateData.skillsToTeach = existingSkillsToTeach.filter(
             (skill: Skill) => skill.name !== skillToDelete.skill.name
           );
         } else {
           const existingSkillsToLearn = Array.isArray(userData.skillsToLearn) ? userData.skillsToLearn : [];
           updateData.skillsToLearn = existingSkillsToLearn.filter(
             (skill: Skill) => skill.name !== skillToDelete.skill.name
           );
         }
        
        await updateDoc(userRef, updateData);
        console.log('✅ User profile updated after skill deletion');
        console.log('📝 Updated data after deletion:', updateData);
      }
      
      setSuccessMessage('Skill removed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchListings();
    } catch (error) {
      console.error('Error deleting skill:', error);
    } finally {
      setShowDeleteConfirm(false);
      setSkillToDelete(null);
    }
  };

  const sendContactMessage = async () => {
    if (!currentUser || !selectedListing || !contactMessage.trim()) return;

    setContactLoading(true);
    try {
      // Check if conversation already exists
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let conversationId = '';
      let foundExisting = false;
      
      for (const docSnapshot of querySnapshot.docs) {
        const conversation = docSnapshot.data() as Conversation;
        if (conversation.participants.includes(selectedListing.userId)) {
          conversationId = docSnapshot.id;
          foundExisting = true;
          break;
        }
      }

      if (!foundExisting) {
        // Create new conversation
        const conversationData: Omit<Conversation, 'id'> = {
          participants: [currentUser.uid, selectedListing.userId],
          updatedAt: new Date()
        };
        
        const conversationDoc = await addDoc(collection(db, 'conversations'), conversationData);
        conversationId = conversationDoc.id;
      }

      // Send message
      const messageData: Omit<Message, 'id'> = {
        senderId: currentUser.uid,
        receiverId: selectedListing.userId,
        content: contactMessage.trim(),
        timestamp: new Date(),
        read: false
      };

      await addDoc(
        collection(db, 'messages'),
        messageData
      );

      // Update conversation's last message
      const conversationRef = doc(db, 'conversations', conversationId);
      await getDoc(conversationRef); // This ensures the document exists

      setContactMessage('');
      setShowContactModal(false);
      setSelectedListing(null);
      
      // Show success message
      setSuccessMessage('Message sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setContactLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.skill.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || listing.type === filterType;
    const matchesCategory = filterCategory === 'all' || listing.skill.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white min-h-screen px-2 sm:px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Skills</h1>
          <div className="flex items-center space-x-3">
            <Link
              to="/connections"
              className="btn-secondary flex items-center space-x-2"
            >
              <UserCheck className="h-4 w-4" />
              <span>My Connections</span>
            </Link>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Skill</span>
            </button>
          </div>
        </div>
        {successMessage && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}
      </div>
      {/* Search and Filters */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="input-field"
          >
            <option value="all">All Types</option>
            <option value="teach">Teaching</option>
            <option value="learn">Learning</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            {filteredListings.length} results
          </div>
        </div>
      </div>
      {/* Add Skill Form */}
      {showAddForm && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Skill</h2>
          <form onSubmit={handleAddSkill} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., JavaScript, Photography"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  required
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  required
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as any })}
                  className="input-field"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  required
                  value={newSkill.type}
                  onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value as any })}
                  className="input-field"
                >
                  <option value="teach">I want to teach this</option>
                  <option value="learn">I want to learn this</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                required
                value={newSkill.description}
                onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Describe your skill or what you want to learn..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <input
                type="text"
                value={newSkill.availability}
                onChange={(e) => setNewSkill({ ...newSkill, availability: e.target.value })}
                className="input-field"
                placeholder="e.g., Weekends, Evenings, Flexible"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Exchange (Optional)
              </label>
              <input
                type="text"
                value={newSkill.preferredExchange}
                onChange={(e) => setNewSkill({ ...newSkill, preferredExchange: e.target.value })}
                className="input-field"
                placeholder="e.g., I'll teach you coding in exchange for photography lessons"
              />
            </div>
            
            <div className="flex space-x-4">
              <button type="submit" className="btn-primary">
                Add Skill
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredListings.map((listing) => (
          <div
            key={listing.id}
            className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col justify-between transition-all duration-300 group overflow-hidden before:content-[''] before:absolute before:inset-0 before:rounded-2xl before:z-0 before:bg-gradient-to-br before:from-blue-300 before:via-purple-200 before:to-green-200 before:blur-2xl before:opacity-0 before:transition-all before:duration-300 hover:before:opacity-80"
            style={{ minHeight: '320px' }}
          >
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{listing.skill.name}</h3>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{listing.skill.category}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${
                  listing.type === 'teach'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {listing.type === 'teach' ? 'Teaching' : 'Learning'}
                </div>
              </div>
              <p className="text-gray-700 mb-4 line-clamp-3 text-sm">{listing.skill.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span className="capitalize font-medium">{listing.skill.level}</span>
                <span>{listing.availability}</span>
              </div>
              {listing.preferredExchange && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-xs text-gray-700 font-medium">
                  <span className="font-semibold">Exchange:</span> {listing.preferredExchange}
                </div>
              )}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>User</span>
                </div>
                {listing.userId === currentUser?.uid ? (
                  <button
                    onClick={() => handleDeleteSkill(listing)}
                    className="btn-secondary text-xs text-red-600 hover:text-red-800 flex items-center space-x-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove</span>
                  </button>
                ) : statusLoading ? (
                  <button className="btn-secondary text-xs opacity-50 cursor-not-allowed" disabled>Loading...</button>
                ) : connectionStatuses[listing.id] === 'none' ? (
                  <button
                    onClick={() => handleSendRequest(listing)}
                    className="btn-primary text-xs"
                  >
                    Send Connection Request
                  </button>
                ) : connectionStatuses[listing.id] === 'pending' ? (
                  <button className="btn-secondary text-xs opacity-50 cursor-not-allowed" disabled>Request Pending</button>
                ) : connectionStatuses[listing.id] === 'accepted' ? (
                  <button
                    onClick={() => handleContact(listing)}
                    className="btn-primary text-xs"
                  >
                    Message
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendRequest(listing)}
                    className="btn-primary text-xs"
                  >
                    Resend Request
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredListings.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No skills found</p>
          <p className="text-sm text-gray-500 mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      )}
      {/* Contact Modal */}
      {showContactModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Contact {selectedListing.skill.name} Owner
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Send a message to the owner of this skill listing:
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {selectedListing.skill.name} - {selectedListing.skill.category}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedListing.type === 'teach' ? 'Teaching' : 'Learning'} • {selectedListing.skill.level}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Hi! I'm interested in your skill. Can you tell me more about..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={sendContactMessage}
                disabled={!contactMessage.trim() || contactLoading}
                className="btn-primary flex-1 flex items-center justify-center"
              >
                {contactLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </button>
              <button
                onClick={() => setShowContactModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && skillToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Remove Skill
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to remove this skill?
              </p>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-gray-900">
                  {skillToDelete.skill.name} - {skillToDelete.skill.category}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {skillToDelete.type === 'teach' ? 'Teaching' : 'Learning'} • {skillToDelete.skill.level}
                </p>
              </div>
              <p className="text-xs text-red-600 mt-2">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteSkill}
                className="btn-primary bg-red-600 hover:bg-red-700 flex-1"
              >
                Remove Skill
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillListings; 