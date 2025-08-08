import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase/config';
import { collection, doc, setDoc, onSnapshot, deleteDoc, addDoc } from 'firebase/firestore';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, User, Monitor, Edit, Award } from 'lucide-react';

const servers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export default function WebRTCVideoCall({ roomId, currentUserId, otherUserId, onClose }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const [callStarted, setCallStarted] = useState(false);
  const [error, setError] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [localName] = useState('You');
  const [remoteName] = useState('Other');
  const pendingCandidates = useRef([]);
  const localStreamRef = useRef(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const screenTrackRef = useRef(null);

  // Add state for timer, notes, and raise hand
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [handRaised, setHandRaised] = useState(false);

  // Helper to add or queue ICE candidates
  const addOrQueueCandidate = (candidate) => {
    const pc = pcRef.current;
    if (!pc.remoteDescription || !pc.remoteDescription.type) {
      pendingCandidates.current.push(candidate);
    } else {
      pc.addIceCandidate(candidate).catch(() => {});
    }
  };

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const cleanupRunning = useRef(false);
  const unsubOfferRef = useRef(null);
  const unsubAnswerRef = useRef(null);
  const unsubCallRef = useRef(null);

  useEffect(() => {
    let unsubOffer, unsubAnswer;
    let localStream;
    let unsubCall;

    async function start() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'NotFoundError' || err.name === 'NotReadableError' || err.name === 'OverconstrainedError') {
          setError('Camera or microphone is already in use by another application or tab, or not available. Please close other apps and try again.');
        } else {
          setError('Error accessing camera/microphone: ' + err.message);
        }
        return;
      }
      localStreamRef.current = localStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

      const pc = new window.RTCPeerConnection(servers);
      pcRef.current = pc;
      pendingCandidates.current = [];

      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          const candidate = event.candidate.toJSON();
          const target = collection(doc(db, 'videoCalls', roomId), 'answerCandidates');
          await addDoc(target, candidate);
        }
      };

      unsubOffer = onSnapshot(collection(doc(db, 'videoCalls', roomId), 'offerCandidates'), (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const candidate = new window.RTCIceCandidate(change.doc.data());
            addOrQueueCandidate(candidate);
          }
        });
      });
      unsubAnswer = onSnapshot(collection(doc(db, 'videoCalls', roomId), 'answerCandidates'), (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const candidate = new window.RTCIceCandidate(change.doc.data());
            addOrQueueCandidate(candidate);
          }
        });
      });

      if (currentUserId < otherUserId) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await setDoc(doc(db, 'videoCalls', roomId), { offer: { type: offer.type, sdp: offer.sdp } });
        unsubCall = onSnapshot(doc(db, 'videoCalls', roomId), async (docSnap) => {
          const data = docSnap.data();
          if (data?.answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new window.RTCSessionDescription(data.answer));
            setCallStarted(true);
            // Add any pending candidates
            while (pendingCandidates.current.length > 0) {
              const candidate = pendingCandidates.current.shift();
              pc.addIceCandidate(candidate).catch(() => {});
            }
          }
        });
      } else {
        unsubCall = onSnapshot(doc(db, 'videoCalls', roomId), async (docSnap) => {
          const data = docSnap.data();
          if (data?.offer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new window.RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await setDoc(doc(db, 'videoCalls', roomId), { ...data, answer: { type: answer.type, sdp: answer.sdp } });
            setCallStarted(true);
            // Add any pending candidates
            while (pendingCandidates.current.length > 0) {
              const candidate = pendingCandidates.current.shift();
              pc.addIceCandidate(candidate).catch(() => {});
            }
          }
        });
      }
      unsubOfferRef.current = unsubOffer;
      unsubAnswerRef.current = unsubAnswer;
      unsubCallRef.current = unsubCall;
    }
    start();
    return () => {
      endSession();
    };
    // eslint-disable-next-line
  }, [roomId, currentUserId, otherUserId]);

  // Cleanup function for ending the session
  const endSession = () => {
    if (cleanupRunning.current) return; // Prevent double cleanup
    cleanupRunning.current = true;
    if (typeof unsubOfferRef.current === 'function') unsubOfferRef.current();
    if (typeof unsubAnswerRef.current === 'function') unsubAnswerRef.current();
    if (typeof unsubCallRef.current === 'function') unsubCallRef.current();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (pcRef.current) pcRef.current.close();
    deleteDoc(doc(db, 'videoCalls', roomId));
    setTimeout(() => { cleanupRunning.current = false; }, 1000);
  };

  // Mute/unmute mic
  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };
  // Enable/disable camera
  const toggleCam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !camEnabled;
      });
      setCamEnabled(!camEnabled);
    }
  };

  // Screen sharing logic
  const startScreenShare = async () => {
    if (screenSharing) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      setScreenSharing(true);
      // Replace video track in peer connection
      if (localStreamRef.current && pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
        // Show screen in local video
        if (localVideoRef.current) localVideoRef.current.srcObject = new MediaStream([screenTrack]);
      }
      // When user stops sharing
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      setError('Screen sharing failed: ' + (err.message || err));
    }
  };
  const stopScreenShare = () => {
    if (!screenSharing) return;
    setScreenSharing(false);
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    // Restore camera
    if (localStreamRef.current && pcRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    }
  };

  // Determine active speaker (simulate: local if mic enabled, remote if not)
  const localActive = micEnabled;
  const remoteActive = !micEnabled;

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c24 0%, #232526 100%)', transition: 'background 0.5s' }}>
      {/* Timer at top center */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 px-6 py-2 rounded-full text-white text-lg font-semibold shadow-lg tracking-widest flex items-center gap-2" style={{letterSpacing:'0.15em'}}>
        <span>Session Time</span>
        <span className="ml-2 font-mono text-xl">{formatTime(sessionSeconds)}</span>
      </div>
      {/* Notes panel (collapsible) */}
      <div className={`absolute right-0 top-0 h-full flex flex-col transition-all duration-300 z-40 ${notesOpen ? 'w-80' : 'w-12'}`}> 
        <button onClick={() => setNotesOpen(o => !o)} className="mt-8 ml-auto mr-2 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white shadow-lg focus:outline-none" title={notesOpen ? 'Close Notes' : 'Open Notes'}>
          <Edit className="h-6 w-6" />
        </button>
        <div className={`flex-1 bg-gray-900 bg-opacity-90 rounded-l-2xl shadow-2xl mt-4 p-4 flex flex-col transition-all duration-300 ${notesOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}> 
          <h3 className="text-white text-lg font-bold mb-2">Notes</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-full min-h-[200px] bg-gray-800 text-white rounded-lg p-2 resize-none focus:outline-none" placeholder="Type your notes here..." />
        </div>
      </div>
      {/* Main video area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full h-full">
        <div className="flex flex-col md:flex-row gap-8 w-full h-full items-center justify-center drop-shadow-2xl">
          {/* Local video tile */}
          <div className={`relative flex flex-col items-center transition-all duration-300 ${localActive ? 'ring-4 ring-blue-400 ring-opacity-80' : 'ring-2 ring-gray-700 ring-opacity-40'} bg-black rounded-2xl shadow-2xl border-4 max-w-[700px] md:w-[700px] md:h-[394px] w-full h-[40vw]`}> 
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-2xl" />
            {/* Name and role */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2 font-semibold shadow border border-white border-opacity-20 tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
              <User className="h-4 w-4 mr-1" /> You <span className="ml-2 px-2 py-0.5 bg-blue-600 rounded text-xs font-bold">Learner</span>
              {handRaised && <Award className="h-5 w-5 ml-2 text-yellow-300 animate-bounce" />}
            </div>
            {/* Mic/cam status */}
            <div className="absolute top-4 right-4 flex gap-2">
              {micEnabled ? <Mic className="h-5 w-5 text-green-400" /> : <MicOff className="h-5 w-5 text-red-500" />}
              {camEnabled ? <VideoIcon className="h-5 w-5 text-green-400" /> : <VideoOff className="h-5 w-5 text-red-500" />}
            </div>
            {/* Hand raise button */}
            <button onClick={() => setHandRaised(r => !r)} className="absolute bottom-4 right-4 p-2 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black shadow-lg focus:outline-none" title={handRaised ? 'Lower Hand' : 'Raise Hand'}>
              <Award className={`h-6 w-6 ${handRaised ? 'animate-bounce' : ''}`} />
            </button>
            {/* Screen sharing badge */}
            {screenSharing && <div className="absolute bottom-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full font-bold flex items-center gap-2"><Monitor className="h-5 w-5" /> Sharing Screen</div>}
          </div>
          {/* Remote video tile */}
          <div className={`relative flex flex-col items-center transition-all duration-300 ${remoteActive ? 'ring-4 ring-green-400 ring-opacity-80' : 'ring-2 ring-gray-700 ring-opacity-40'} bg-black rounded-2xl shadow-2xl border-4 max-w-[700px] md:w-[700px] md:h-[394px] w-full h-[40vw]`}> 
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover rounded-2xl" />
            {/* Name and role */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2 font-semibold shadow border border-white border-opacity-20 tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
              <User className="h-4 w-4 mr-1" /> Other <span className="ml-2 px-2 py-0.5 bg-green-600 rounded text-xs font-bold">Teacher</span>
            </div>
            {/* Mic/cam status (simulate always on for remote) */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Mic className="h-5 w-5 text-green-400" />
              <VideoIcon className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>
        {/* Error message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded w-full text-center mt-4">{error}</div>
        )}
        {/* Controls bar */}
        <div className="w-full flex flex-col items-center mt-8">
          <div className="w-full max-w-2xl h-px bg-white bg-opacity-10 mb-4" />
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center gap-14 z-50 px-8 py-4 rounded-2xl bg-black bg-opacity-60 backdrop-blur-md shadow-2xl border border-white border-opacity-10 transition-all duration-300">
            <button
              onClick={toggleMic}
              className={`rounded-full p-6 bg-gray-900 hover:bg-gray-700 shadow-xl transition-all duration-200 transform hover:scale-110 ${micEnabled ? '' : 'bg-red-700'}`}
              title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
              tabIndex={0}
            >
              {micEnabled ? <Mic className="h-9 w-9 text-white" /> : <MicOff className="h-9 w-9 text-white" />}
            </button>
            <button
              onClick={toggleCam}
              className={`rounded-full p-6 bg-gray-900 hover:bg-gray-700 shadow-xl transition-all duration-200 transform hover:scale-110 ${camEnabled ? '' : 'bg-red-700'}`}
              title={camEnabled ? 'Turn off camera' : 'Turn on camera'}
              tabIndex={0}
            >
              {camEnabled ? <VideoIcon className="h-9 w-9 text-white" /> : <VideoOff className="h-9 w-9 text-white" />}
            </button>
            <button
              onClick={screenSharing ? stopScreenShare : startScreenShare}
              className={`rounded-full p-6 ${screenSharing ? 'bg-yellow-400 hover:bg-yellow-500' : 'bg-gray-900 hover:bg-gray-700'} shadow-xl transition-all duration-200 transform hover:scale-110`}
              title={screenSharing ? 'Stop screen sharing' : 'Share screen'}
              tabIndex={0}
            >
              <Monitor className={`h-9 w-9 ${screenSharing ? 'text-black' : 'text-white'}`} />
            </button>
            <button
              onClick={() => { endSession(); onClose(); }}
              className="rounded-full p-6 bg-red-600 hover:bg-red-700 shadow-xl text-white transition-all duration-200 transform hover:scale-110"
              title="Leave call"
              tabIndex={0}
            >
              <PhoneOff className="h-9 w-9" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
