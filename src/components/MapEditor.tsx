import { useState, useEffect } from "react";
import { useMap, MapData } from "../contexts/MapContext";
import ZoneEditor from "./ZoneEditor";
import MapTemplateSelector from "./MapTemplateSelector";
import "./MapEditor.css";

interface MapEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

const MapEditor = ({ isOpen, onClose }: MapEditorProps) => {
  const { mapData, refreshMap } = useMap();
  const [editMode, setEditMode] = useState(false);
  const [tool, setTool] = useState<"wall" | "floor" | "erase">("wall");
  const [localMapData, setLocalMapData] = useState<MapData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showZoneEditor, setShowZoneEditor] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  useEffect(() => {
    if (mapData) {
      setLocalMapData({ ...mapData });
    }
  }, [mapData]);

  useEffect(() => {
    if (!isOpen || !editMode || !localMapData) return;

    const handleMapClick = (e: MouseEvent) => {
      const gameContainer = document.getElementById("phaser-game");
      if (!gameContainer || !localMapData) return;

      const rect = gameContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const tileX = Math.floor(x / localMapData.tileSize);
      const tileY = Math.floor(y / localMapData.tileSize);

      if (
        tileX < 0 ||
        tileX >= localMapData.width ||
        tileY < 0 ||
        tileY >= localMapData.height
      ) {
        return;
      }

      // Update tiles and collision
      const newTiles = localMapData.tiles.map((row: number[]) => [...row]);
      const newCollision = localMapData.collision.map((row: boolean[]) => [
        ...row,
      ]);

      if (tool === "wall") {
        newTiles[tileY][tileX] = 1;
        newCollision[tileY][tileX] = true;
      } else if (tool === "floor") {
        newTiles[tileY][tileX] = 0;
        newCollision[tileY][tileX] = false;
      } else if (tool === "erase") {
        newTiles[tileY][tileX] = 0;
        newCollision[tileY][tileX] = false;
      }

      setLocalMapData({
        ...localMapData,
        tiles: newTiles,
        collision: newCollision,
      });
      setHasChanges(true);
    };

    window.addEventListener("click", handleMapClick);
    return () => window.removeEventListener("click", handleMapClick);
  }, [isOpen, editMode, tool, localMapData]);

  const handleSave = async () => {
    if (!localMapData) return;
    const roomId = localStorage.getItem("roomId") || "default-room";

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
            tiles: localMapData.tiles,
            collision: localMapData.collision,
            name: localMapData.name,
          }),
        }
      );

      if (response.ok) {
        await refreshMap();
        setHasChanges(false);
        alert("Map saved successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to save map"}`);
      }
    } catch (error) {
      console.error("Error saving map:", error);
      alert("Failed to save map");
    }
  };

  const handleReset = () => {
    if (mapData) {
      setLocalMapData({ ...mapData });
      setHasChanges(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="map-editor-overlay" onClick={onClose}>
      <div className="map-editor-panel" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>Map Editor</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="editor-content">
          <div className="editor-controls">
            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={editMode}
                  onChange={(e) => setEditMode(e.target.checked)}
                />
                Edit Mode
              </label>
            </div>

            <div className="control-group">
              <button
                className="btn-secondary"
                onClick={() => setShowTemplateSelector(true)}
              >
                📋 Choose Template
              </button>
            </div>

            <div className="control-group">
              <button
                className="btn-secondary"
                onClick={() => setShowZoneEditor(true)}
              >
                🚪 Manage Private Spaces
              </button>
            </div>

            {editMode && (
              <>
                <div className="tool-selector">
                  <button
                    className={`tool-btn ${tool === "wall" ? "active" : ""}`}
                    onClick={() => setTool("wall")}
                  >
                    🧱 Wall
                  </button>
                  <button
                    className={`tool-btn ${tool === "floor" ? "active" : ""}`}
                    onClick={() => setTool("floor")}
                  >
                    🟦 Floor
                  </button>
                  <button
                    className={`tool-btn ${tool === "erase" ? "active" : ""}`}
                    onClick={() => setTool("erase")}
                  >
                    🧹 Erase
                  </button>
                </div>

                <div className="editor-hint">
                  {editMode && (
                    <p>
                      Click on the map to place{" "}
                      {tool === "wall"
                        ? "walls"
                        : tool === "floor"
                        ? "floor"
                        : "erase tiles"}
                    </p>
                  )}
                </div>

                <div className="editor-actions">
                  <button
                    className="btn-secondary"
                    onClick={handleReset}
                    disabled={!hasChanges}
                  >
                    Reset
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={!hasChanges}
                  >
                    Save Map
                  </button>
                </div>
              </>
            )}
          </div>

          {localMapData && (
            <div className="map-info">
              <h3>Map Info</h3>
              <p>Name: {localMapData.name}</p>
              <p>
                Size: {localMapData.width} × {localMapData.height} tiles
              </p>
              <p>Tile Size: {localMapData.tileSize}px</p>
              {hasChanges && (
                <p className="unsaved-changes">⚠️ Unsaved changes</p>
              )}
            </div>
          )}
        </div>
      </div>

      <ZoneEditor
        isOpen={showZoneEditor}
        onClose={() => setShowZoneEditor(false)}
      />
      <MapTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
      />
    </div>
  );
};

export default MapEditor;
