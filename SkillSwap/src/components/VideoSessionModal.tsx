import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { VideoSession, User, Skill } from '../types';
import { Calendar, Clock, Video, Users, X, Check, AlertCircle } from 'lucide-react';
// Remove: import { googleMeetService } from '../services/googleMeetService';

interface VideoSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    otherUser: User | null;
    currentUser: any; // Firebase User or our custom User type
    onSessionCreated?: (session: VideoSession) => void;
}

const VideoSessionModal: React.FC<VideoSessionModalProps> = ({
    isOpen,
    onClose,
    conversationId,
    otherUser,
    currentUser,
    onSessionCreated
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [duration, setDuration] = useState(30);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get available skills to teach - handle both Firebase User and our custom User type
    const availableSkills: Skill[] = (currentUser as any)?.skillsToTeach || [];

    // Debug logging
    console.log('🎥 VideoSessionModal - Current user:', currentUser);
    console.log('🎥 VideoSessionModal - Available skills:', availableSkills);
    console.log('🎥 VideoSessionModal - Other user:', otherUser);
    console.log('🎥 VideoSessionModal - Conversation ID:', conversationId);

    useEffect(() => {
        if (isOpen) {
            // Set default date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setScheduledDate(tomorrow.toISOString().split('T')[0]);
            setScheduledTime('10:00');
        }
    }, [isOpen]);

    // Remove: const generateGoogleMeetLink = (sessionTitle: string, scheduledTime: Date, duration: number) => {
    // Remove:     // Generate a Google Meet link for the session
    // Remove:     return googleMeetService.generateMeetLink(sessionTitle, scheduledTime, duration);
    // Remove: };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!title.trim()) {
            setError('Please enter a session title');
            return;
        }

        if (!selectedSkill) {
            setError('Please select a skill to teach');
            return;
        }

        if (!scheduledDate || !scheduledTime) {
            setError('Please select date and time');
            return;
        }

        if (!currentUser || !otherUser) {
            setError('Please fill in all required fields');
            return;
        }

        // Ensure currentUser has uid property
        const currentUserId = (currentUser as any)?.uid;
        if (!currentUserId) {
            setError('User not properly authenticated');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('🎥 Creating video session with data:', {
                title,
                description,
                scheduledDate,
                scheduledTime,
                duration,
                selectedSkill,
                currentUserId,
                otherUserId: otherUser?.uid
            });

            const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

            // Validate that the session is scheduled for the future
            const now = new Date();
            if (scheduledDateTime <= now) {
                setError('Session must be scheduled for a future date and time');
                return;
            }

            // Remove: const meetUrl = generateGoogleMeetLink(title, scheduledDateTime, duration);
            // Remove: const meetingId = googleMeetService.extractMeetingId(meetUrl) || `meet_${Date.now()}`;
            // Remove: console.log('🎥 Generated Google Meet URL:', meetUrl);
            // Remove: console.log('🎥 Generated Meeting ID:', meetingId);

            const sessionData: Omit<VideoSession, 'id' | 'meetingUrl' | 'meetingId'> = {
                conversationId,
                teacherId: currentUserId,
                learnerId: otherUser.uid,
                skillId: selectedSkill.id,
                skillName: selectedSkill.name,
                title,
                description,
                scheduledAt: scheduledDateTime,
                duration,
                status: 'scheduled',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            console.log('🎥 Saving session to Firestore...');
            const docRef = await addDoc(collection(db, 'videoSessions'), sessionData);
            const newSession = { id: docRef.id, ...sessionData };
            console.log('🎥 Session saved successfully:', newSession);

            // Send a video session message to the conversation
            const messageData = {
                senderId: currentUserId,
                receiverId: otherUser.uid,
                content: `Scheduled video session: ${title}`,
                timestamp: new Date(),
                read: false,
                type: 'video-session-invite' as const,
                sessionId: newSession.id,
                sessionData: {
                    title: newSession.title,
                    scheduledAt: newSession.scheduledAt,
                    duration: newSession.duration
                }
            };

            console.log('🎥 Sending video session message...');
            await addDoc(
                collection(db, 'messages'),
                messageData
            );
            console.log('🎥 Video session message sent successfully');

            if (onSessionCreated) {
                onSessionCreated(newSession);
            }

            onClose();
        } catch (error) {
            console.error('🎥 Error creating video session:', error);
            console.error('🎥 Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'No stack trace'
            });
            setError('Failed to create video session. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Don't show modal if no current user or no skills to teach
    if (!currentUser || availableSkills.length === 0) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div className="text-center">
                        <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Skills to Teach</h3>
                        <p className="text-gray-600 mb-4">
                            You need to add skills to your profile before you can schedule video sessions.
                        </p>
                        <button
                            onClick={onClose}
                            className="btn-primary"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Video className="h-5 w-5 mr-2 text-blue-600" />
                        Schedule Video Session
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Session Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., JavaScript Basics Tutorial"
                            className="input-field"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Skill to Teach *
                        </label>
                        <select
                            value={selectedSkill?.id || ''}
                            onChange={(e) => {
                                const skill = availableSkills.find((s: Skill) => s.id === e.target.value);
                                setSelectedSkill(skill || null);
                            }}
                            className="input-field"
                            required
                        >
                            <option value="">Select a skill</option>
                            {availableSkills.map((skill: Skill) => (
                                <option key={skill.id} value={skill.id}>
                                    {skill.name} ({skill.level})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what will be covered in this session..."
                            className="input-field"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date *
                            </label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time *
                            </label>
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (minutes) *
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="input-field"
                            required
                        >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={90}>1.5 hours</option>
                            <option value={120}>2 hours</option>
                        </select>
                    </div>

                    <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Users className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-blue-700 text-sm">
                            Session with {otherUser?.displayName || otherUser?.email}
                        </span>
                    </div>

                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-green-700 text-sm">
                            This will allow you to start a real-time video call directly in the chat when the session begins.
                        </span>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title || !selectedSkill}
                            className="btn-primary flex-1 flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Schedule Session
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VideoSessionModal; 