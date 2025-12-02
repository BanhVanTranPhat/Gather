import json
import os

def generate_layered_map():
    # Map Dimensions
    width = 60
    height = 40
    tile_size = 32
    
    # Tileset Config (from existing map.json)
    tileset = {
        "columns": 16,
        "firstgid": 1,
        "image": "tiles/office.png",
        "imageheight": 512,
        "imagewidth": 512,
        "margin": 0,
        "name": "office",
        "spacing": 0,
        "tilecount": 256,
        "tileheight": 32,
        "tilewidth": 32
    }

    # Tile IDs (Approximate based on standard tilesets, will need visual verification)
    # Assuming standard layout:
    # Floor: 12 (Wood/Carpet)
    # Wall Top: 1
    # Wall Bottom: 17
    TILE_FLOOR = 12 
    TILE_WALL_TOP = 1
    TILE_WALL_BOTTOM = 17
    TILE_EMPTY = 0

    # Initialize Layers
    ground_data = [TILE_FLOOR] * (width * height)
    world_data = [TILE_EMPTY] * (width * height)
    decoration_data = [TILE_EMPTY] * (width * height)

    # Add Walls to World Layer (Border)
    for y in range(height):
        for x in range(width):
            idx = y * width + x
            
            # Top Wall
            if y == 0:
                world_data[idx] = TILE_WALL_TOP
            # Bottom Wall
            elif y == height - 1:
                world_data[idx] = TILE_WALL_BOTTOM
            # Left/Right Walls
            elif x == 0 or x == width - 1:
                world_data[idx] = TILE_WALL_BOTTOM

    # Create Map Structure
    map_json = {
        "compressionlevel": -1,
        "height": height,
        "width": width,
        "infinite": False,
        "layers": [
            {
                "name": "Ground",
                "type": "tilelayer",
                "width": width,
                "height": height,
                "data": ground_data,
                "opacity": 1,
                "visible": True,
                "x": 0,
                "y": 0
            },
            {
                "name": "World",
                "type": "tilelayer",
                "width": width,
                "height": height,
                "data": world_data,
                "opacity": 1,
                "visible": True,
                "x": 0,
                "y": 0
            },
            {
                "name": "Decoration",
                "type": "tilelayer",
                "width": width,
                "height": height,
                "data": decoration_data,
                "opacity": 1,
                "visible": True,
                "x": 0,
                "y": 0
            }
        ],
        "nextlayerid": 4,
        "nextobjectid": 1,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.9.2",
        "tileheight": tile_size,
        "tilewidth": tile_size,
        "tilesets": [tileset],
        "type": "map",
        "version": "1.9"
    }

    # Save to file
    output_path = "public/assets/map_layered.json"
    with open(output_path, "w") as f:
        json.dump(map_json, f, indent=2)
    
    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_layered_map()
