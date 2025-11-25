# Assets Directory

Place your game assets here.

## Directory Structure

```
public/assets/
├── tiles/
│   ├── floor.png      (32x32 floor tile)
│   ├── wall.png       (32x32 wall tile)
│   └── grass.png      (32x32 grass tile)
├── characters/
│   └── avatar.png     (128x128 spritesheet: 4 frames, 32x32 each)
└── furniture/
    ├── chair.png
    ├── table.png
    └── plant.png
```

## Asset Specifications

### Tiles
- **Size**: 32x32 pixels
- **Format**: PNG with transparency
- **Floor**: Light gray checkered pattern
- **Wall**: Brown brick texture
- **Grass**: Green grass texture

### Avatar Spritesheet
- **Size**: 128x128 pixels (4 frames)
- **Frame Size**: 32x32 pixels
- **Layout**: 2x2 grid
- **Frames**:
  - Top-left: Down (facing camera)
  - Top-right: Left
  - Bottom-left: Right
  - Bottom-right: Up

### Furniture
- **Size**: 32x32 to 64x64 pixels
- **Format**: PNG with transparency
- **Style**: Top-down view

## Fallback System

If assets are not found, the game will automatically generate programmatic fallbacks:
- Colored rectangles for tiles
- Simple circles for avatars
- Basic shapes for furniture

## Adding Custom Assets

1. Place your assets in the appropriate directory
2. Update `src/utils/assetLoader.ts` with your asset configuration
3. The game will automatically load them on startup

