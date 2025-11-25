import { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import './Reactions.css';

interface Reaction {
  userId: string;
  reaction: string;
  timestamp: number;
}

const Reactions = () => {
  const { socket, users, currentUser } = useSocket();
  const [activeReactions, setActiveReactions] = useState<Map<string, Reaction>>(new Map());

  useEffect(() => {
    if (!socket) return;

    const handleReaction = (data: Reaction) => {
      setActiveReactions((prev) => {
        const newMap = new Map(prev);
        newMap.set(`${data.userId}-${data.timestamp}`, data);
        return newMap;
      });

      // Remove after 3 seconds
      setTimeout(() => {
        setActiveReactions((prev) => {
          const newMap = new Map(prev);
          newMap.delete(`${data.userId}-${data.timestamp}`);
          return newMap;
        });
      }, 3000);
    };

    socket.on('reaction', handleReaction);

    return () => {
      socket.off('reaction', handleReaction);
    };
  }, [socket]);

  const sendReaction = (reaction: string) => {
    if (!socket || !currentUser) return;

    socket.emit('reaction', {
      userId: currentUser.userId,
      reaction,
      timestamp: Date.now(),
    });
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Press '1' for wave
      if (e.key === '1') {
        sendReaction('👋');
      }
      // Press '2' for thumbs up
      else if (e.key === '2') {
        sendReaction('👍');
      }
      // Press '3' for clap
      else if (e.key === '3') {
        sendReaction('👏');
      }
      // Press '4' for heart
      else if (e.key === '4') {
        sendReaction('❤️');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [socket, currentUser]);

  return (
    <div className="reactions-container">
      {Array.from(activeReactions.values()).map((reaction) => {
        const user = users.find((u) => u.userId === reaction.userId);
        if (!user) return null;

        return (
          <div
            key={`${reaction.userId}-${reaction.timestamp}`}
            className="reaction-bubble"
            style={{
              left: `${user.position.x}px`,
              top: `${user.position.y - 60}px`,
            }}
          >
            <span className="reaction-emoji">{reaction.reaction}</span>
          </div>
        );
      })}

      <div className="reactions-menu">
        <button onClick={() => sendReaction('👋')} className="reaction-btn" title="Wave (1)">
          👋
        </button>
        <button onClick={() => sendReaction('👍')} className="reaction-btn" title="Thumbs Up (2)">
          👍
        </button>
        <button onClick={() => sendReaction('👏')} className="reaction-btn" title="Clap (3)">
          👏
        </button>
        <button onClick={() => sendReaction('❤️')} className="reaction-btn" title="Heart (4)">
          ❤️
        </button>
      </div>
    </div>
  );
};

export default Reactions;





