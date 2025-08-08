import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { VideoSession, User } from '../types';
import { Video, Calendar, Clock, Users, ExternalLink, Play, CheckCircle, XCircle, Phone } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface VideoSessionListProps {
    conversationId: string;
    currentUser: any; // Firebase User or our custom User type
    otherUser: User | null;
}

const VideoSessionList: React.FC<VideoSessionListProps> = ({
    conversationId,
    currentUser,
    otherUser
}) => {
    console.log('🎥 VideoSessionList rendered with:', {
        conversationId,
        currentUser: currentUser?.uid,
        otherUser: otherUser?.uid,
        otherUserData: otherUser
    });
    const [sessions, setSessions] = useState<VideoSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!conversationId) return;

        const sessionsQuery = query(
            collection(db, 'videoSessions'),
            where('conversationId', '==', conversationId),
            orderBy('scheduledAt', 'asc')
        );

        const unsubscribe = onSnapshot(sessionsQuery, (querySnapshot) => {
            const sessionsData: VideoSession[] = [];
            querySnapshot.forEach((doc) => {
                sessionsData.push({ id: doc.id, ...doc.data() } as VideoSession);
            });
            setSessions(sessionsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [conversationId]);

    const formatSessionTime = (timestamp: any) => {
        if (!timestamp) return 'Unknown time';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'MMM dd, yyyy - HH:mm');
    };

    const isSessionUpcoming = (session: VideoSession) => {
        const now = new Date();
        const sessionTime = session.scheduledAt.toDate ? session.scheduledAt.toDate() : new Date(session.scheduledAt);
        return sessionTime > now && session.status === 'scheduled';
    };

    const isSessionInProgress = (session: VideoSession) => {
        const now = new Date();
        const sessionTime = session.scheduledAt.toDate ? session.scheduledAt.toDate() : new Date(session.scheduledAt);
        const endTime = new Date(sessionTime.getTime() + session.duration * 60000);
        return now >= sessionTime && now <= endTime && session.status === 'scheduled';
    };

    const canJoinSession = (session: VideoSession) => {
        if (!currentUser) return false;
        const currentUserId = (currentUser as any)?.uid;
        if (!currentUserId) return false;
        return (session.teacherId === currentUserId || session.learnerId === currentUserId) &&
            (isSessionInProgress(session) || isSessionUpcoming(session));
    };

    const handleJoinSession = async (session: VideoSession) => {
        try {
            // Check if we have the other user data
            if (!otherUser) {
                alert('Error: Other user data not available. Please try again.');
                console.error('Other user is null when trying to join session');
                return;
            }

            console.log('Joining Google Meet session:', session);

            // Show confirmation dialog
            const confirmed = window.confirm(
                `You're about to join a Google Meet session: "${session.title}"\n\n` +
                'This will open Google Meet in a new tab. Make sure you have:\n' +
                '• A Google account\n' +
                '• Camera and microphone permissions enabled\n' +
                '• A stable internet connection\n\n' +
                'Click OK to join the meeting.'
            );

            if (!confirmed) return;

            // Update session status to in-progress if it's starting
            if (isSessionInProgress(session) && session.status === 'scheduled') {
                await updateDoc(doc(db, 'videoSessions', session.id), {
                    status: 'in-progress',
                    updatedAt: new Date()
                });
            }

            // Open Google Meet in a new tab
            if (session.meetingUrl) {
                window.open(session.meetingUrl, '_blank', 'noopener,noreferrer');
            } else {
                alert('Error: Meeting URL not found. Please contact the session organizer.');
            }
        } catch (error) {
            console.error('Error joining session:', error);
            alert('Error joining the session. Please try again.');
        }
    };

    const getStatusBadge = (session: VideoSession) => {
        const now = new Date();
        const sessionTime = session.scheduledAt.toDate ? session.scheduledAt.toDate() : new Date(session.scheduledAt);
        const endTime = new Date(sessionTime.getTime() + session.duration * 60000);

        if (session.status === 'completed') {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                </span>
            );
        }

        if (session.status === 'cancelled') {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Cancelled
                </span>
            );
        }

        if (isSessionInProgress(session)) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Play className="h-3 w-3 mr-1" />
                    Live Now
                </span>
            );
        }

        if (isSessionUpcoming(session)) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Calendar className="h-3 w-3 mr-1" />
                    Upcoming
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <Clock className="h-3 w-3 mr-1" />
                Past
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!otherUser) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading user data...</p>
                <p className="text-sm text-gray-500 mt-2">
                    Please wait while we load the other user's information
                </p>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center py-8">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No video sessions scheduled</p>
                <p className="text-sm text-gray-500 mt-2">
                    Schedule a video session to start learning together
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Video className="h-4 w-4 mr-2" />
                Video Sessions ({sessions.length})
            </h4>

            {sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">{session.title}</h5>
                            <p className="text-sm text-gray-600 mb-2">{session.description}</p>

                            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                                <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatSessionTime(session.scheduledAt)}
                                </div>
                                <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {session.duration} minutes
                                </div>
                                <div className="flex items-center">
                                    <Users className="h-3 w-3 mr-1" />
                                    {session.skillName}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {getStatusBadge(session)}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            {session.teacherId === (currentUser as any)?.uid ? 'You are teaching' : 'You are learning'}
                        </div>

                        {canJoinSession(session) && (
                            <button
                                onClick={() => handleJoinSession(session)}
                                className="btn-primary text-xs flex items-center"
                            >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {isSessionInProgress(session) ? 'Join Meeting' : 'Start Meeting'}
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default VideoSessionList; 