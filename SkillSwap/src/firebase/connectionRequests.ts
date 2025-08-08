import { db } from './config';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ConnectionRequest } from '../types';

export const sendConnectionRequest = async (fromUserId: string, toUserId: string) => {
  // Check if a request already exists
  const q = query(
    collection(db, 'connectionRequests'),
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', toUserId)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return { status: 'already_sent' };
  }
  await addDoc(collection(db, 'connectionRequests'), {
    fromUserId,
    toUserId,
    status: 'pending',
    createdAt: new Date(),
  });
  return { status: 'sent' };
};

export const getConnectionRequestStatus = async (userA: string, userB: string): Promise<'none' | 'pending' | 'accepted' | 'rejected'> => {
  // Check both directions
  const q = query(
    collection(db, 'connectionRequests'),
    where('fromUserId', 'in', [userA, userB]),
    where('toUserId', 'in', [userA, userB])
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return 'none';
  const req = snapshot.docs[0].data() as ConnectionRequest;
  return req.status;
};

export const getIncomingRequests = async (userId: string): Promise<ConnectionRequest[]> => {
  const q = query(
    collection(db, 'connectionRequests'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ConnectionRequest));
};

export const acceptConnectionRequest = async (requestId: string) => {
  await updateDoc(doc(db, 'connectionRequests', requestId), {
    status: 'accepted',
    respondedAt: new Date(),
  });
};

export const rejectConnectionRequest = async (requestId: string) => {
  await updateDoc(doc(db, 'connectionRequests', requestId), {
    status: 'rejected',
    respondedAt: new Date(),
  });
};