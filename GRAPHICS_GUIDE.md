# 🎨 Better Graphics System - Hướng dẫn

## ✅ Đã hoàn thành

Graphics system đã được cải thiện với:

1. **Asset Loader System**: Centralized asset management
2. **Fallback Graphics**: Programmatic generation nếu assets không có
3. **Improved Tilesets**: Better tile rendering với fallback
4. **Avatar Animations**: Direction-based sprite frames
5. **Decorative Elements**: Support cho furniture và objects

---

## 🚀 Asset System

### Asset Loader (`src/utils/assetLoader.ts`)

- **Centralized Configuration**: Tất cả assets được define trong một file
- **Fallback Generation**: Tự động tạo graphics nếu assets không có
- **Type Safety**: TypeScript interfaces cho asset configs

### Asset Types

1. **Tilesets**: Floor, wall, grass tiles
2. **Spritesheets**: Avatar với 4 frames (directions)
3. **Images**: Furniture và decorative objects

---

## 📁 Asset Structure

```
public/assets/
├── tiles/
│   ├── floor.png      (32x32)
│   ├── wall.png       (32x32)
│   └── grass.png      (32x32)
├── characters/
│   └── avatar.png     (128x128 spritesheet)
└── furniture/
    ├── chair.png
    ├── table.png
    └── plant.png
```

---

## 🎨 Fallback Graphics

Nếu assets không có, system tự động generate:

### Tiles
- **Floor**: Checkered gray pattern
- **Wall**: Brown brick với lines
- **Grass**: Green checkered pattern

### Avatars
- **Spritesheet**: 4 frames với colored circles
- **Direction Indicators**: Eyes show direction
- **Color**: Uses user's avatar color preference

---

## 🔧 Avatar Animations

### Frame Mapping
- **Frame 0**: Down (facing camera)
- **Frame 1**: Left
- **Frame 2**: Right
- **Frame 3**: Up

### Direction Updates
- Avatar frame changes khi di chuyển
- Smooth transitions giữa directions
- Color customization từ user settings

---

## 📝 Adding Custom Assets

### 1. Place Assets
```bash
# Copy your assets to public/assets/
public/assets/tiles/my_tile.png
public/assets/characters/my_character.png
```

### 2. Update Asset Config
```typescript
// src/utils/assetLoader.ts
export const ASSETS: AssetConfig[] = [
  {
    name: "my_tile",
    type: "tileset",
    url: "/assets/tiles/my_tile.png",
    tileWidth: 32,
    tileHeight: 32,
  },
  // ...
];
```

### 3. Use in GameScene
```typescript
if (this.textures.exists("my_tile")) {
  this.add.image(x, y, "my_tile");
}
```

---

## 🎯 Current Graphics Features

### Tiles
- ✅ Programmatic generation
- ✅ Asset loading với fallback
- ✅ Multiple tile types
- ✅ Smooth rendering

### Avatars
- ✅ Direction-based animations
- ✅ Color customization
- ✅ Fallback sprites
- ✅ Frame updates on movement

### UI
- ✅ Modern design
- ✅ Smooth animations
- ✅ Consistent styling

---

## 🐛 Troubleshooting

### Assets không load
1. Check file paths trong `assetLoader.ts`
2. Check browser console for 404 errors
3. Verify assets exist in `public/assets/`
4. Check CORS settings nếu load từ external

### Fallback graphics không hiển thị
1. Check `generateFallbackTileset()` được gọi
2. Check Phaser scene initialization
3. Check texture names match

### Avatar animations không hoạt động
1. Check sprite frames exist
2. Check direction updates trong `updatePlayerPosition()`
3. Check texture names match

---

## 🎯 Future Enhancements

1. **Animated Tiles**: Water, fire, etc.
2. **Particle Effects**: Footsteps, interactions
3. **Lighting System**: Dynamic shadows
4. **Weather Effects**: Rain, snow
5. **Custom Themes**: Day/night, seasons

---

## 📊 Performance Tips

1. **Preload Assets**: Load trong `preload()`
2. **Use Texture Atlases**: Combine multiple images
3. **Cache Textures**: Reuse generated textures
4. **Optimize Sizes**: Keep assets small
5. **Lazy Load**: Load decorative elements on demand

---

## 🎨 Asset Creation Tips

### Tiles
- Use consistent tile size (32x32 recommended)
- Match tile edges for seamless tiling
- Use transparency for overlays
- Keep file sizes small (< 50KB)

### Spritesheets
- Use power-of-2 dimensions
- Keep frames consistent size
- Use transparent backgrounds
- Optimize PNG compression

### Colors
- Use consistent color palette
- Match game theme
- Consider accessibility
- Test on different displays

---

**Graphics System đã sẵn sàng! Thêm assets vào `public/assets/` để cải thiện visuals. 🎨**

