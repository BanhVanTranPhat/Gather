import { useEffect, useRef } from 'react';
import { useWebRTC } from '../contexts/WebRTCContext';
import { useSocket } from '../contexts/SocketContext';
import './VideoChat.css';

const VideoChat = () => {
  const { localStream, peers } = useWebRTC();
  const { users, currentUser } = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    peers.forEach((peerConn, userId) => {
      if (peerConn.stream) {
        let videoElement = remoteVideosRef.current.get(userId);
        if (!videoElement) {
          videoElement = document.createElement('video');
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          videoElement.className = 'remote-video';
          remoteVideosRef.current.set(userId, videoElement);
          
          const container = document.getElementById('remote-videos-container');
          if (container) {
            container.appendChild(videoElement);
          }
        }
        videoElement.srcObject = peerConn.stream;
      }
    });

    // Clean up removed peers
    remoteVideosRef.current.forEach((videoElement, userId) => {
      if (!peers.has(userId)) {
        videoElement.remove();
        remoteVideosRef.current.delete(userId);
      }
    });
  }, [peers]);

  // Get nearby users for video display (within 150 pixels)
  const nearbyUsers = users.filter((user) => {
    if (user.userId === currentUser?.userId || !currentUser) return false;
    const distance = Math.sqrt(
      Math.pow(user.position.x - currentUser.position.x, 2) +
      Math.pow(user.position.y - currentUser.position.y, 2)
    );
    return distance < 150;
  });

  if (nearbyUsers.length === 0 && !localStream) {
    return null;
  }

  return (
    <div className="video-chat-container">
      <div className="local-video-wrapper">
        {localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
          />
        )}
      </div>
      <div id="remote-videos-container" className="remote-videos-wrapper">
        {/* Remote videos are dynamically added here */}
      </div>
    </div>
  );
};

export default VideoChat;

