import { useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import './ReactionPanel.css';

interface ReactionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const REACTIONS = [
  '👍', '❤️', '😂', '😮', '😢', '😡',
  '👏', '🎉', '🔥', '💯', '👋', '🙏',
  '😊', '😎', '🤔', '😴', '🤗', '😱',
  '🎵', '☕', '🍕', '🎮', '💡', '✨'
];

const ReactionPanel = ({ isOpen, onClose }: ReactionPanelProps) => {
  const { socket } = useSocket();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'people' | 'objects'>('all');

  const handleReactionClick = (reaction: string) => {
    if (!socket) return;

    socket.emit('reaction', {
      reaction,
      timestamp: Date.now()
    });

    console.log(`📣 Sent reaction: ${reaction}`);
    onClose();
  };

  const filteredReactions = () => {
    if (selectedCategory === 'all') return REACTIONS;
    if (selectedCategory === 'people') {
      return REACTIONS.filter((r, i) => i < 18); // First 18 are people-related
    }
    return REACTIONS.filter((r, i) => i >= 18); // Last 6 are objects
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="reaction-panel-overlay" onClick={onClose} />
      <div className="reaction-panel">
        <div className="reaction-panel-header">
          <h3>Send Reaction</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="reaction-categories">
          <button
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          <button
            className={`category-btn ${selectedCategory === 'people' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('people')}
          >
            😊 People
          </button>
          <button
            className={`category-btn ${selectedCategory === 'objects' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('objects')}
          >
            ✨ Objects
          </button>
        </div>

        <div className="reaction-grid">
          {filteredReactions().map((reaction, index) => (
            <button
              key={index}
              className="reaction-btn"
              onClick={() => handleReactionClick(reaction)}
              title={`Send ${reaction}`}
            >
              {reaction}
            </button>
          ))}
        </div>

        <div className="reaction-panel-footer">
          <p className="reaction-hint">
            💡 Reactions will appear above your character for 3 seconds
          </p>
        </div>
      </div>
    </>
  );
};

export default ReactionPanel;
