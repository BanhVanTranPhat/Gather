from PIL import Image
import numpy as np

def analyze_sprite_sheet():
    try:
        img = Image.open('public/assets/characters/npcs_transparent.png')
        img = img.convert("RGBA")
        width, height = img.size
        print(f"Image Size: {width}x{height}")
        
        # Convert to numpy array
        arr = np.array(img)
        
        # Alpha channel is the 4th channel
        alpha = arr[:, :, 3]
        
        # Find rows with any non-transparent pixels
        non_empty_rows = np.where(np.max(alpha, axis=1) > 0)[0]
        if len(non_empty_rows) == 0:
            print("Image is completely transparent!")
            return

        # Find cols with any non-transparent pixels
        non_empty_cols = np.where(np.max(alpha, axis=0) > 0)[0]
        
        print(f"Non-empty Y range: {non_empty_rows[0]} - {non_empty_rows[-1]}")
        print(f"Non-empty X range: {non_empty_cols[0]} - {non_empty_cols[-1]}")
        
        # Try to detect grid by looking for empty gaps
        # Sum alpha along rows and cols
        row_density = np.sum(alpha, axis=1)
        col_density = np.sum(alpha, axis=0)
        
        # Find gaps (zeros)
        empty_rows = np.where(row_density == 0)[0]
        empty_cols = np.where(col_density == 0)[0]
        
        print(f"Number of empty rows: {len(empty_rows)}")
        print(f"Number of empty cols: {len(empty_cols)}")
        
        # Simple heuristic: measure distance between peaks or gaps
        # Let's try to find the first "blob" size
        
        # Find first non-empty pixel
        y1 = non_empty_rows[0]
        x1 = non_empty_cols[0]
        
        # Find where this blob ends (first empty row/col after start)
        # Next empty row after y1
        next_empty_y = next((y for y in empty_rows if y > y1), height)
        # Next empty col after x1
        next_empty_x = next((x for x in empty_cols if x > x1), width)
        
        print(f"Estimated first sprite block size: {next_empty_x - x1} x {next_empty_y - y1}")
        
        # Check if 32, 48, 64 fits
        print(f"640 / 32 = {640/32}")
        print(f"640 / 48 = {640/48}")
        print(f"640 / 64 = {640/64}")
        print(f"640 / 40 = {640/40}")
        
        print(f"480 / 32 = {480/32}")
        print(f"480 / 48 = {480/48}")
        print(f"480 / 64 = {480/64}")
        print(f"480 / 60 = {480/60}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_sprite_sheet()
