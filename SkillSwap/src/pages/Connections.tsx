import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ConnectionRequest, User, Review } from '../types';
import { Users, Star, MessageSquare, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Connections: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (currentUser) fetchConnections();
  }, [currentUser]);

  const fetchConnections = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const sentQuery = query(collection(db, 'connectionRequests'), where('fromUserId', '==', currentUser.uid), where('status', '==', 'accepted'));
      const receivedQuery = query(collection(db, 'connectionRequests'), where('toUserId', '==', currentUser.uid), where('status', '==', 'accepted'));
      const [sentSnapshot, receivedSnapshot] = await Promise.all([getDocs(sentQuery), getDocs(receivedQuery)]);

      const connectionUserIds = new Set<string>();
      sentSnapshot.forEach(doc => connectionUserIds.add(doc.data().toUserId));
      receivedSnapshot.forEach(doc => connectionUserIds.add(doc.data().fromUserId));

      const usersData: User[] = [];
      for (const userId of Array.from(connectionUserIds)) {
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
        if (!userDoc.empty) usersData.push(userDoc.docs[0].data() as User);
      }
      setConnections(usersData);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = (user: User) => {
    setSelectedUser(user);
    setShowReviewModal(true);
    setReviewData({ rating: 5, comment: '' });
  };

  const submitReview = async () => {
    if (!currentUser || !selectedUser || !reviewData.comment.trim()) return;
    try {
      setReviewLoading(true);
      const review = {
        reviewerId: currentUser.uid,
        reviewedUserId: selectedUser.uid,
        skillId: '',
        rating: reviewData.rating,
        comment: reviewData.comment.trim(),
        createdAt: new Date()
      };
      await addDoc(collection(db, 'reviews'), review);

      const userRef = doc(db, 'users', selectedUser.uid);
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', selectedUser.uid)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data() as User;
        const currentRating = userData.rating || 0;
        const currentTotalRatings = userData.totalRatings || 0;
        const newTotalRatings = currentTotalRatings + 1;
        const newRating = ((currentRating * currentTotalRatings) + reviewData.rating) / newTotalRatings;
        await updateDoc(userRef, { rating: newRating, totalRatings: newTotalRatings });
      }
      setShowReviewModal(false);
      setSelectedUser(null);
      fetchConnections();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto bg-white min-h-screen px-2 sm:px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
          <Users className="h-8 w-8 mr-3 text-blue-600" />
          My Connections
        </h1>
        <p className="text-gray-600 mt-2">View and manage your skill exchange connections</p>
      </div>
      {connections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {connections.map((user) => (
            <div
              key={user.uid}
              className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col justify-between transition-all duration-300 group overflow-hidden before:content-[''] before:absolute before:inset-0 before:rounded-2xl before:z-0 before:bg-gradient-to-br before:from-blue-300 before:via-purple-200 before:to-green-200 before:blur-2xl before:opacity-0 before:transition-all before:duration-300 hover:before:opacity-80"
              style={{ minHeight: '320px' }}
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {user.displayName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{user.displayName}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= (user.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {user.rating ? user.rating.toFixed(1) : 'No'} ({user.totalRatings || 0} reviews)
                  </span>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills to Teach:</h4>
                  <div className="flex flex-wrap gap-1">
                    {user.skillsToTeach?.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {skill.name}
                      </span>
                    ))}
                    {user.skillsToTeach?.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{user.skillsToTeach.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills to Learn:</h4>
                  <div className="flex flex-wrap gap-1">
                    {user.skillsToLearn?.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {skill.name}
                      </span>
                    ))}
                    {user.skillsToLearn?.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{user.skillsToLearn.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 mt-auto">
                  <button
                    onClick={() => handleAddReview(user)}
                    className="flex-1 btn-primary text-sm flex items-center justify-center"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Add Review
                  </button>
                  <button className="btn-secondary text-sm flex items-center justify-center" onClick={() => navigate(`/messages?user=${user.uid}`)}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
          <p className="text-gray-600 mb-4">Start connecting with other users to exchange skills and knowledge</p>
          <button className="btn-primary">Browse Skills</button>
        </div>
      )}

      {showReviewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Review {selectedUser.displayName}</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star className={`h-6 w-6 ${star <= reviewData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                className="input-field"
                rows={4}
                placeholder="Share your experience with this user..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={submitReview}
                disabled={!reviewData.comment.trim() || reviewLoading}
                className="btn-primary flex-1"
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
              <button onClick={() => setShowReviewModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections; 