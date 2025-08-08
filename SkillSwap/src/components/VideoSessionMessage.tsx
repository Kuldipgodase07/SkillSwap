import React, { useState } from 'react';
import { Message } from '../types';
import { Video, Calendar, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface VideoSessionMessageProps {
  message: Message;
  isOwnMessage: boolean;
}

const VideoSessionMessage: React.FC<VideoSessionMessageProps> = ({ message, isOwnMessage }) => {

  if (!message.sessionData) return null;

  const formatSessionTime = (timestamp: any) => {
    if (!timestamp) return 'Unknown time';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM dd, yyyy - HH:mm');
  };

  const handleJoinSession = () => {
    if (!message.sessionData?.meetingUrl) {
      alert('Meeting URL not found. Please contact the session organizer.');
      return;
    }

    const confirmed = window.confirm(
      `You're about to join a Google Meet session: "${message.sessionData.title}"\n\n` +
      'This will open Google Meet in a new tab. Make sure you have:\n' +
      '• A Google account\n' +
      '• Camera and microphone permissions enabled\n' +
      '• A stable internet connection\n\n' +
      'Click OK to join the meeting.'
    );

    if (confirmed) {
      window.open(message.sessionData.meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getMessageContent = () => {
    switch (message.type) {
      case 'video-session-invite':
        return 'invited you to a video session';
      case 'video-session-join':
        return 'joined the video session';
      case 'video-session-end':
        return 'ended the video session';
      default:
        return 'scheduled a video session';
    }
  };

  return (
    <>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${isOwnMessage
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-900'
        }`}>
        <div className="flex items-center mb-2">
          <Video className={`h-4 w-4 mr-2 ${isOwnMessage ? 'text-blue-200' : 'text-gray-600'}`} />
          <span className="text-sm font-medium">
            {getMessageContent()}
          </span>
        </div>

        <div className="mb-3">
          <h4 className="font-medium text-sm mb-1">{message.sessionData.title}</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatSessionTime(message.sessionData.scheduledAt)}
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {message.sessionData.duration} minutes
            </div>
          </div>
        </div>

        <button
          onClick={handleJoinSession}
          className={`w-full text-xs flex items-center justify-center py-2 px-3 rounded ${isOwnMessage
            ? 'bg-blue-700 hover:bg-blue-800 text-white'
            : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
            }`}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Join Meeting
        </button>
      </div>


    </>
  );
};

export default VideoSessionMessage; 