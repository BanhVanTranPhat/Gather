from PIL import Image
import os

def crop_characters():
    try:
        img = Image.open('public/assets/characters/npcs_transparent.png')
        
        # User suggests 32x48
        tile_w = 32
        tile_h = 48
        
        # SỬA Ở ĐÂY: Đổi từ 4 thành 3
        frames_per_row = 3
        
        # Stride (bước nhảy) giữa các nhân vật trong ảnh gốc
        # Giả sử ảnh gốc có 4 cột (128px) cho mỗi nhân vật
        stride_cols = 4
        stride_w = tile_w * stride_cols # 128px
        
        crop_w = tile_w * frames_per_row  # 96px (Chỉ lấy 3 cột đầu)
        char_h = tile_h * 4  # 192px
        
        print(f"Cropping with Tile: {tile_w}x{tile_h}, Crop: {crop_w}x{char_h}, Stride: {stride_w}")
        
        # Crop 3 characters
        # Char 1 (Player)
        player_img = img.crop((0, 0, crop_w, char_h))
        player_img.save('public/assets/characters/player.png')
        print("Saved player.png")
        
        # Char 2 (NPC1) - Shift by stride_w
        npc1_img = img.crop((stride_w, 0, stride_w + crop_w, char_h))
        npc1_img.save('public/assets/characters/npc1.png')
        print("Saved npc1.png")
        
        # Char 3 (NPC2) - Shift by stride_w * 2
        npc2_img = img.crop((stride_w * 2, 0, (stride_w * 2) + crop_w, char_h))
        npc2_img.save('public/assets/characters/npc2.png')
        print("Saved npc2.png")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    crop_characters()
