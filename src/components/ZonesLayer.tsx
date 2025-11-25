import { useEffect, useRef } from "react";
import { useMap } from "../contexts/MapContext";
import { Zone, getZoneBounds } from "../utils/zoneUtils";
import "./ZonesLayer.css";

const ZonesLayer = () => {
  const { mapData } = useMap();
  const zonesRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    // Clean up old zones
    zonesRef.current.forEach((element) => {
      element.remove();
    });
    zonesRef.current.clear();

    if (!mapData?.zones || mapData.zones.length === 0) return;

    const gameContainer = document.getElementById("phaser-game");
    if (!gameContainer) return;

    const rect = gameContainer.getBoundingClientRect();

    // Render zones
    mapData.zones.forEach((zone: Zone) => {
      const bounds = getZoneBounds(zone);
      const zoneElement = document.createElement("div");
      zoneElement.className = "zone-boundary";
      zoneElement.style.left = `${rect.left + bounds.x}px`;
      zoneElement.style.top = `${rect.top + bounds.y}px`;
      zoneElement.style.width = `${bounds.width}px`;
      zoneElement.style.height = `${bounds.height}px`;
      zoneElement.setAttribute("data-zone-id", zone.id);
      zoneElement.setAttribute("title", zone.name);

      document.body.appendChild(zoneElement);
      zonesRef.current.set(zone.id, zoneElement);
    });

    return () => {
      zonesRef.current.forEach((element) => {
        element.remove();
      });
      zonesRef.current.clear();
    };
  }, [mapData?.zones]);

  return null;
};

export default ZonesLayer;

