import { useState, useEffect } from "react";
import { useObjects } from "../contexts/ObjectContext";
import { useSocket } from "../contexts/SocketContext";
import "./ObjectPlacementPanel.css";

interface ObjectPlacementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ObjectPlacementPanel = ({
  isOpen,
  onClose,
}: ObjectPlacementPanelProps) => {
  const { objects, refreshObjects } = useObjects();
  const { currentUser } = useSocket();
  const [isCreating, setIsCreating] = useState(false);
  const [editingObject, setEditingObject] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "website" as "website" | "video" | "whiteboard" | "image" | "document" | "game",
    name: "",
    url: "",
    position: { x: 0, y: 0 },
  });
  const [placementMode, setPlacementMode] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsCreating(false);
      setEditingObject(null);
      setPlacementMode(false);
      setFormData({
        type: "website",
        name: "",
        url: "",
        position: { x: 0, y: 0 },
      });
    }
  }, [isOpen]);

  // Handle click on map to place object
  useEffect(() => {
    if (!placementMode || !isOpen) return;

    const handleMapClick = (e: MouseEvent) => {
      const gameContainer = document.getElementById("phaser-game");
      if (!gameContainer) return;

      const rect = gameContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setFormData((prev) => ({
        ...prev,
        position: { x, y },
      }));
      setPlacementMode(false);
    };

    window.addEventListener("click", handleMapClick);
    return () => window.removeEventListener("click", handleMapClick);
  }, [placementMode, isOpen]);

  const handleCreateObject = async () => {
    if (!formData.name.trim() || !currentUser?.roomId) return;

    try {
      const properties: any = {};
      
      if (formData.type === "website" || formData.type === "video" || formData.type === "game") {
        properties.url = formData.url;
        properties.width = 800;
        properties.height = 600;
        properties.allowFullscreen = true;
      } else if (formData.type === "whiteboard") {
        properties.content = "";
        properties.width = 1200;
        properties.height = 800;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL || "http://localhost:5000"}/api/objects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomId: currentUser.roomId,
            type: formData.type,
            name: formData.name,
            position: formData.position,
            properties,
            createdBy: currentUser.userId,
          }),
        }
      );

      if (response.ok) {
        await refreshObjects();
        setIsCreating(false);
        setFormData({
          type: "website",
          name: "",
          url: "",
          position: { x: 0, y: 0 },
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to create object"}`);
      }
    } catch (error) {
      console.error("Error creating object:", error);
      alert("Failed to create object");
    }
  };

  const handleDeleteObject = async (objectId: string) => {
    if (!confirm("Are you sure you want to delete this object?")) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL || "http://localhost:5000"}/api/objects/${objectId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await refreshObjects();
      } else {
        alert("Failed to delete object");
      }
    } catch (error) {
      console.error("Error deleting object:", error);
      alert("Failed to delete object");
    }
  };

  const getObjectIcon = (type: string) => {
    switch (type) {
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

  if (!isOpen) return null;

  return (
    <div className="object-placement-overlay" onClick={onClose}>
      <div
        className="object-placement-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <h2>Manage Objects</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="panel-content">
          {!isCreating && !editingObject && (
            <>
              <div className="panel-actions">
                <button
                  className="btn-primary"
                  onClick={() => setIsCreating(true)}
                >
                  + Create Object
                </button>
              </div>

              <div className="objects-list">
                <h3>Objects ({objects.length})</h3>
                {objects.length === 0 ? (
                  <p className="empty-state">No objects yet. Create one to get started!</p>
                ) : (
                  <div className="objects-grid">
                    {objects.map((obj) => (
                      <div key={obj.objectId} className="object-card">
                        <div className="object-icon-large">
                          {getObjectIcon(obj.type)}
                        </div>
                        <div className="object-info">
                          <h4>{obj.name}</h4>
                          <p className="object-type">{obj.type}</p>
                          <p className="object-position">
                            Position: ({Math.round(obj.position.x)}, {Math.round(obj.position.y)})
                          </p>
                        </div>
                        <div className="object-actions">
                          <button
                            className="btn-danger"
                            onClick={() => handleDeleteObject(obj.objectId)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {isCreating && (
            <div className="create-form">
              <h3>Create New Object</h3>
              <div className="form-group">
                <label>Object Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as any,
                    })
                  }
                >
                  <option value="website">🌐 Website</option>
                  <option value="video">🎥 Video</option>
                  <option value="whiteboard">📋 Whiteboard</option>
                  <option value="image">🖼️ Image</option>
                  <option value="document">📄 Document</option>
                  <option value="game">🎮 Game</option>
                </select>
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Object name"
                />
              </div>

              {(formData.type === "website" ||
                formData.type === "video" ||
                formData.type === "game") && (
                <div className="form-group">
                  <label>URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://example.com"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Position</label>
                <div className="position-inputs">
                  <input
                    type="number"
                    value={formData.position.x}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position: {
                          ...formData.position,
                          x: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={formData.position.y}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position: {
                          ...formData.position,
                          y: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    placeholder="Y"
                  />
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setPlacementMode(true);
                      alert("Click on the map to place the object");
                    }}
                  >
                    📍 Pick on Map
                  </button>
                </div>
              </div>

              {placementMode && (
                <div className="placement-hint">
                  Click on the map to set position...
                </div>
              )}

              <div className="form-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setIsCreating(false);
                    setPlacementMode(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleCreateObject}
                  disabled={!formData.name.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectPlacementPanel;

