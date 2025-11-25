# 📋 Map Templates System - Hướng dẫn

## ✅ Đã hoàn thành

Map Templates system đã được implement với:

1. **Template Library**: Pre-built maps sẵn có
2. **Template Selector**: UI để browse và chọn templates
3. **Apply Functionality**: Apply template với một click
4. **Template Data**: Structured template definitions
5. **Integration**: Tích hợp vào Map Editor

---

## 🚀 Available Templates

### 1. Minimal
- **Size**: 40 × 40 tiles
- **Description**: Simple empty space with just borders
- **Zones**: None
- **Best for**: Quick setup, custom builds

### 2. Open Space
- **Size**: 60 × 60 tiles
- **Description**: Large open area perfect for events and gatherings
- **Zones**: None
- **Features**: Decorative pillars
- **Best for**: Events, presentations, large meetings

### 3. Office Layout
- **Size**: 50 × 50 tiles
- **Description**: Open office with meeting rooms and private spaces
- **Zones**: 3 zones
  - Meeting Room 1 (8 users)
  - Meeting Room 2 (8 users)
  - Private Office (4 users)
- **Features**: Interior walls, multiple rooms
- **Best for**: Team collaboration, meetings

### 4. Conference Center
- **Size**: 55 × 55 tiles
- **Description**: Multiple meeting rooms with a central lobby
- **Zones**: 1 zone (Central Lobby - 20 users)
- **Features**: Multiple meeting rooms, central lobby
- **Best for**: Conferences, workshops, multiple sessions

---

## 📋 Cách sử dụng

### 1. Mở Map Editor
1. Click button 🗺️ trong ControlBar
2. Map Editor sẽ mở

### 2. Chọn Template
1. Click "📋 Choose Template" button
2. Browse available templates
3. Click vào template để select
4. Review template info (size, zones, description)

### 3. Apply Template
1. Click "Apply Template" button
2. Template sẽ được applied to your room
3. Map sẽ refresh với template layout
4. Zones sẽ được created automatically

### 4. Customize (Optional)
1. Use Edit Mode để modify tiles
2. Manage zones nếu cần
3. Add objects và furniture

---

## 🎨 Template Structure

### Template Definition
```typescript
{
  id: string;              // Unique identifier
  name: string;            // Display name
  description: string;     // Description
  width: number;           // Map width in tiles
  height: number;          // Map height in tiles
  tileSize: number;        // Tile size in pixels
  tiles: number[][];      // 2D array of tile IDs
  collision: boolean[][];  // 2D array of collision data
  zones?: Zone[];          // Optional zones
}
```

### Zone Definition
```typescript
{
  id: string;              // Unique zone ID
  name: string;            // Zone name
  bounds: {
    x1: number;            // Start X (pixels)
    y1: number;            // Start Y (pixels)
    x2: number;            // End X (pixels)
    y2: number;            // End Y (pixels)
  };
  maxUsers?: number;       // Optional user limit
}
```

---

## 🔧 Adding Custom Templates

### 1. Create Template Data
```typescript
// src/data/mapTemplates.ts
export const myCustomTemplate: MapTemplate = {
  id: "my-template",
  name: "My Custom Template",
  description: "Description here",
  width: 50,
  height: 50,
  tileSize: 32,
  tiles: [...],      // Your tile data
  collision: [...],  // Your collision data
  zones: [...],     // Your zones
};
```

### 2. Add to Templates Array
```typescript
export const mapTemplates: MapTemplate[] = [
  // ... existing templates
  myCustomTemplate,
];
```

### 3. Template sẽ tự động appear trong selector!

---

## 🎯 Template Features

### Pre-built Layouts
- ✅ Office layouts với rooms
- ✅ Open spaces cho events
- ✅ Conference centers với multiple rooms
- ✅ Minimal templates cho custom builds

### Automatic Zones
- ✅ Zones được created automatically
- ✅ Private spaces ready to use
- ✅ Max users configured
- ✅ Bounds calculated correctly

### Easy Customization
- ✅ Apply template first
- ✅ Then customize với Map Editor
- ✅ Add/remove walls
- ✅ Modify zones

---

## 🐛 Troubleshooting

### Template không apply
1. Check API response trong Network tab
2. Check roomId có đúng không
3. Check console for errors
4. Verify template data structure

### Zones không appear
1. Check zones array trong template
2. Check bounds calculation
3. Refresh map sau khi apply
4. Check ZonesLayer có render không

### Template preview không hiển thị
1. Check thumbnail path (nếu có)
2. Fallback preview sẽ hiển thị
3. Preview là optional

---

## 🎯 Best Practices

### Choosing Templates
1. **Minimal**: Start từ scratch
2. **Open Space**: Large events
3. **Office Layout**: Team collaboration
4. **Conference Center**: Multiple sessions

### After Applying
1. Review map layout
2. Check zones placement
3. Customize nếu cần
4. Add objects và furniture
5. Test với multiple users

### Customization Tips
1. Apply template first
2. Then edit với Map Editor
3. Save changes frequently
4. Test collision detection
5. Verify zones work correctly

---

## 📊 Template Comparison

| Template | Size | Zones | Best For |
|----------|------|-------|----------|
| Minimal | 40×40 | 0 | Quick setup |
| Open Space | 60×60 | 0 | Events |
| Office Layout | 50×50 | 3 | Teams |
| Conference Center | 55×55 | 1 | Conferences |

---

## 🎨 Future Enhancements

1. **Template Categories**: Group templates by type
2. **Template Search**: Search templates by name/description
3. **Template Preview**: Actual map preview images
4. **User Templates**: Save custom maps as templates
5. **Template Marketplace**: Share templates với community

---

**Map Templates đã sẵn sàng! Chọn template và customize theo nhu cầu. 📋**

