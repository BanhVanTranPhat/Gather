import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAP_WIDTH = 30;
const MAP_HEIGHT = 20;
const TILE_SIZE = 32;

// Tile IDs (Hypothetical - based on standard tileset layouts)
// We'll use a few distinct ones to try and get a good look.
const TILES = {
    FLOOR: 12,      // Light wood/generic floor
    WALL_TOP: 2,    // Wall top edge
    WALL_FACE: 18,  // Wall face
    RUG_CENTER: 45, // Carpet/Rug
    PLANT: 35,      // Potted plant
    CHAIR: 61,      // Chair
    TABLE: 60,      // Table
    VOID: 0         // Empty
};

const layers = [
    { name: "Ground", type: "tilelayer", width: MAP_WIDTH, height: MAP_HEIGHT, data: [], visible: true, opacity: 1, x: 0, y: 0 },
    { name: "Walls", type: "tilelayer", width: MAP_WIDTH, height: MAP_HEIGHT, data: [], visible: true, opacity: 1, x: 0, y: 0 },
    { name: "Decoration", type: "tilelayer", width: MAP_WIDTH, height: MAP_HEIGHT, data: [], visible: true, opacity: 1, x: 0, y: 0 },
    { name: "Interactions", type: "objectgroup", draworder: "topdown", objects: [], visible: true, opacity: 1, x: 0, y: 0 }
];

// Initialize layers
for (let i = 0; i < MAP_WIDTH * MAP_HEIGHT; i++) {
    layers[0].data.push(TILES.FLOOR); // Fill ground with floor
    layers[1].data.push(0);
    layers[2].data.push(0);
}

// Helper to set tile
const setTile = (layerIdx, x, y, tileId) => {
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        layers[layerIdx].data[y * MAP_WIDTH + x] = tileId;
    }
};

// Helper to add object
const addObject = (name, type, x, y, width, height, properties = {}) => {
    layers[3].objects.push({
        name,
        type,
        x: x * TILE_SIZE,
        y: y * TILE_SIZE,
        width,
        height,
        visible: true,
        rotation: 0,
        properties: Object.keys(properties).map(key => ({ name: key, type: "string", value: properties[key] }))
    });
};

// --- Generate Layout ---

// 1. Walls (Border)
for (let x = 0; x < MAP_WIDTH; x++) {
    setTile(1, x, 0, TILES.WALL_TOP); // Top wall
    setTile(1, x, 1, TILES.WALL_FACE); // Top wall face
    setTile(1, x, MAP_HEIGHT - 1, TILES.WALL_TOP); // Bottom wall
}
for (let y = 0; y < MAP_HEIGHT; y++) {
    setTile(1, 0, y, TILES.WALL_TOP); // Left wall
    setTile(1, MAP_WIDTH - 1, y, TILES.WALL_TOP); // Right wall
}

// 2. Meeting Area (Rug) - Center
const rugX = 10;
const rugY = 8;
const rugW = 10;
const rugH = 6;

for (let y = rugY; y < rugY + rugH; y++) {
    for (let x = rugX; x < rugX + rugW; x++) {
        setTile(0, x, y, TILES.RUG_CENTER); // Change floor to rug
    }
}

// 3. Furniture (Tables & Chairs)
// Place a big table in the middle of the rug
const tableX = rugX + 2;
const tableY = rugY + 2;
const tableW = 6;
const tableH = 2;

for (let y = tableY; y < tableY + tableH; y++) {
    for (let x = tableX; x < tableX + tableW; x++) {
        setTile(2, x, y, TILES.TABLE); // Table tiles
    }
}

// Chairs around the table
for (let x = tableX; x < tableX + tableW; x += 2) {
    // Top chairs
    setTile(2, x, tableY - 1, TILES.CHAIR);
    addObject("Chair", "chair", x, tableY - 1, TILE_SIZE, TILE_SIZE);

    // Bottom chairs
    setTile(2, x, tableY + tableH, TILES.CHAIR);
    addObject("Chair", "chair", x, tableY + tableH, TILE_SIZE, TILE_SIZE);
}

// 4. Plants (Corners)
setTile(2, 2, 3, TILES.PLANT);
setTile(2, MAP_WIDTH - 3, 3, TILES.PLANT);
setTile(2, 2, MAP_HEIGHT - 3, TILES.PLANT);
setTile(2, MAP_WIDTH - 3, MAP_HEIGHT - 3, TILES.PLANT);


const mapData = {
    compressionlevel: -1,
    height: MAP_HEIGHT,
    infinite: false,
    layers: layers,
    nextlayerid: 5,
    nextobjectid: 100,
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.9.2",
    tileheight: TILE_SIZE,
    tilesets: [
        {
            columns: 16,
            firstgid: 1,
            image: "tiles/office.png",
            imageheight: 512,
            imagewidth: 512,
            margin: 0,
            name: "office",
            spacing: 0,
            tilecount: 256,
            tileheight: TILE_SIZE,
            tilewidth: TILE_SIZE
        }
    ],
    tilewidth: TILE_SIZE,
    type: "map",
    version: "1.9",
    width: MAP_WIDTH
};

const outputPath = path.join(__dirname, '../public/assets/map.json');
fs.writeFileSync(outputPath, JSON.stringify(mapData, null, 2));
console.log(`Structured Map generated at ${outputPath}`);
