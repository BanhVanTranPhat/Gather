import { useState } from "react";
import { useMap } from "../contexts/MapContext";
import { useSocket } from "../contexts/SocketContext";
import { mapTemplates, MapTemplate } from "../data/mapTemplates";
import "./MapTemplateSelector.css";

interface MapTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const MapTemplateSelector = ({
  isOpen,
  onClose,
}: MapTemplateSelectorProps) => {
  const { refreshMap } = useMap();
  const { currentUser } = useSocket();
  const [selectedTemplate, setSelectedTemplate] = useState<MapTemplate | null>(
    null
  );
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !currentUser?.roomId) return;

    setIsApplying(true);
    try {
        const response = await fetch(
          `${
            import.meta.env.VITE_SERVER_URL || "http://localhost:5000"
          }/api/maps/room/${roomId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: selectedTemplate.name,
            width: selectedTemplate.width,
            height: selectedTemplate.height,
            tileSize: selectedTemplate.tileSize,
            tiles: selectedTemplate.tiles,
            collision: selectedTemplate.collision,
            zones: selectedTemplate.zones || [],
          }),
        }
      );

      if (response.ok) {
        await refreshMap();
        alert(`Map template "${selectedTemplate.name}" applied successfully!`);
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to apply template"}`);
      }
    } catch (error) {
      console.error("Error applying template:", error);
      alert("Failed to apply template");
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="template-selector-overlay" onClick={onClose}>
      <div
        className="template-selector-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="selector-header">
          <h2>Map Templates</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="selector-content">
          <p className="selector-description">
            Choose a pre-built map template to apply to your room. This will
            replace your current map.
          </p>

          <div className="templates-grid">
            {mapTemplates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${
                  selectedTemplate?.id === template.id ? "selected" : ""
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="template-preview">
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="template-thumbnail"
                    />
                  ) : (
                    <div className="template-preview-placeholder">
                      <div className="preview-grid">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="preview-tile" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <p className="template-description">{template.description}</p>
                  <div className="template-meta">
                    <span className="template-size">
                      {template.width} × {template.height} tiles
                    </span>
                    {template.zones && template.zones.length > 0 && (
                      <span className="template-zones">
                        {template.zones.length} zone
                        {template.zones.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <div className="template-actions">
              <div className="selected-info">
                <strong>Selected:</strong> {selectedTemplate.name}
              </div>
              <div className="action-buttons">
                <button className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleApplyTemplate}
                  disabled={isApplying}
                >
                  {isApplying ? "Applying..." : "Apply Template"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapTemplateSelector;

