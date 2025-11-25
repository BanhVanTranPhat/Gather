import { useEffect, useState } from "react";
import { useSocket } from "../contexts/SocketContext";
import ObjectFrame from "./ObjectFrame";
import "./InteractiveObject.css";

interface InteractiveObjectProps {
  object: {
    objectId: string;
    type: string;
    name: string;
    position: { x: number; y: number };
    properties: any;
  };
}

const InteractiveObject = ({ object }: InteractiveObjectProps) => {
  const { currentUser } = useSocket();
  const [isNearby, setIsNearby] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check distance từ currentUser đến object
  useEffect(() => {
    if (!currentUser) {
      setIsNearby(false);
      return;
    }

    const checkDistance = () => {
      const distance = Math.sqrt(
        Math.pow(currentUser.position.x - object.position.x, 2) +
          Math.pow(currentUser.position.y - object.position.y, 2)
      );
      const nearby = distance < 50; // 50 pixels threshold
      setIsNearby(nearby);
      setShowPrompt(nearby && !isOpen);
    };

    checkDistance();
    const interval = setInterval(checkDistance, 100); // Check every 100ms
    return () => clearInterval(interval);
  }, [currentUser, object.position, isOpen]);

  // Handle keyboard interaction
  useEffect(() => {
    if (!isNearby || isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "x") {
        setIsOpen(true);
        setShowPrompt(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isNearby, isOpen]);

  // Get object icon based on type
  const getObjectIcon = () => {
    switch (object.type) {
      case "whiteboard":
        return "📋";
      case "video":
        return "🎥";
      case "website":
        return "🌐";
      case "image":
        return "🖼️";
      case "document":
        return "📄";
      case "game":
        return "🎮";
      default:
        return "📦";
    }
  };

  return (
    <>
      {/* Object indicator trên map (sẽ được render trong GameScene) */}
      {isNearby && showPrompt && (
        <div className="interact-prompt">
          <div className="prompt-icon">{getObjectIcon()}</div>
          <div className="prompt-text">
            <span className="prompt-key">X</span> để mở {object.name}
          </div>
        </div>
      )}

      {/* Object frame khi mở */}
      {isOpen && (
        <ObjectFrame object={object} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default InteractiveObject;
