from PIL import Image
import sys

def process_image():
    try:
        img = Image.open('public/assets/characters/npcs.png')
        img = img.convert("RGBA")
        datas = img.getdata()
        
        # Get color at 0,0 assumed to be background
        bg_color = img.getpixel((0, 0))
        print(f"Background color detected: {bg_color}")
        
        newData = []
        for item in datas:
            if item[0] == bg_color[0] and item[1] == bg_color[1] and item[2] == bg_color[2]:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        
        img.putdata(newData)
        img.save("public/assets/characters/npcs_transparent.png", "PNG")
        print("Saved transparent image to public/assets/characters/npcs_transparent.png")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process_image()
