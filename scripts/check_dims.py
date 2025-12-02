from PIL import Image

try:
    img = Image.open('public/assets/characters/npcs_transparent.png')
    print(f"Image Dimensions: {img.size}")
except Exception as e:
    print(f"Error: {e}")
