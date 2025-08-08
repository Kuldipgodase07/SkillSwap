import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getIncomingRequests, acceptConnectionRequest, rejectConnectionRequest } from '../firebase/connectionRequests';
import { ConnectionRequest, User } from '../types';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const Requests: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState<Record<string, User>>({});

  useEffect(() => {
    if (!currentUser) return;
    const fetchRequests = async () => {
      setLoading(true);
      const reqs = await getIncomingRequests(currentUser.uid);
      setRequests(reqs);
      // Fetch user info for each request
      const users: Record<string, User> = {};
      for (const req of reqs) {
        if (!users[req.fromUserId]) {
          const userDoc = await getDoc(doc(db, 'users', req.fromUserId));
          if (userDoc.exists()) users[req.fromUserId] = userDoc.data() as User;
        }
      }
      setUserMap(users);
      setLoading(false);
    };
    fetchRequests();
  }, [currentUser]);

  const handleAccept = async (req: ConnectionRequest) => {
    await acceptConnectionRequest(req.id);
    setRequests(requests.filter(r => r.id !== req.id));
  };
  const handleReject = async (req: ConnectionRequest) => {
    await rejectConnectionRequest(req.id);
    setRequests(requests.filter(r => r.id !== req.id));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Connection Requests</h1>
      {requests.length === 0 ? (
        <div className="text-center text-gray-500">No incoming requests.</div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="card flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{userMap[req.fromUserId]?.displayName || 'User'}</div>
                <div className="text-gray-600 text-sm">{userMap[req.fromUserId]?.email}</div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleAccept(req)} className="btn-primary">Accept</button>
                <button onClick={() => handleReject(req)} className="btn-secondary">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requests;