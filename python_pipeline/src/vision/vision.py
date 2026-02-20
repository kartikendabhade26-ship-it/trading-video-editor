import cv2
import numpy as np
from pydantic import BaseModel
from typing import List, Tuple

class RawCandle(BaseModel):
    x_center: float
    y_open: float
    y_close: float
    y_high: float
    y_low: float
    is_bullish: bool
    width: float

class VisionModule:
    def __init__(self, image_path: str):
        self.image_path = image_path
        self.image = cv2.imread(image_path)
        if self.image is None:
            raise FileNotFoundError(f"Could not load image at {image_path}")
        
        # Convert to HSV for robust color thresholding
        self.hsv = cv2.cvtColor(self.image, cv2.COLOR_BGR2HSV)
        
        # Tweak these based on TradingView specific greens and reds
        # Format: (Hue [0-179], Saturation [0-255], Value [0-255])
        self.lower_green = np.array([35, 50, 50])
        self.upper_green = np.array([85, 255, 255])
        
        self.lower_red1 = np.array([0, 50, 50])
        self.upper_red1 = np.array([10, 255, 255])
        self.lower_red2 = np.array([170, 50, 50])
        self.upper_red2 = np.array([180, 255, 255])

    def exact_candles(self) -> List[RawCandle]:
        """Runs the full vision pipeline and returns sorted raw candles."""
        bull_contours = self._get_contours(self.lower_green, self.upper_green)
        
        # Red can wrap around in HSV space, so we combine two masks
        mask1 = cv2.inRange(self.hsv, self.lower_red1, self.upper_red1)
        mask2 = cv2.inRange(self.hsv, self.lower_red2, self.upper_red2)
        red_mask = cv2.bitwise_or(mask1, mask2)
        bear_contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        candles = []
        candles.extend(self._process_contours(bull_contours, is_bullish=True))
        candles.extend(self._process_contours(bear_contours, is_bullish=False))
        
        # Sort chronologically by X-axis (left to right)
        candles.sort(key=lambda c: c.x_center)
        return candles

    def _get_contours(self, lower_bound, upper_bound):
        mask = cv2.inRange(self.hsv, lower_bound, upper_bound)
        
        # Morphological Closing: Connects wicks that might be detached due to artifacts
        kernel = np.ones((5,1), np.uint8) # Vertical kernel focuses on vertical gaps (wicks)
        mask_closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        contours, _ = cv2.findContours(mask_closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        return contours

    def _process_contours(self, contours, is_bullish: bool) -> List[RawCandle]:
        processed = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            
            # Filter out noise (tiny dots or horizontal grid lines)
            if h < 2 or w > h * 2: 
                continue
                
            x_center = x + (w / 2)
            
            # In OpenCV, y=0 is the TOP of the image.
            # So a higher Y value actually means a LOWER price.
            # We will grab absolute pixels here. Module 2 will invert/normalize them.
            y_top = float(y)
            y_bottom = float(y + h)
            
            # For this boilerplate, we'll assume the bounding box encompasses the wicks perfectly.
            # A more advanced version would segment the thick body vs the thin wick inside this bounding box.
            
            # Simple assumption: Body takes up middle 50% for now
            # TODO: Add logic to find exact body coordinates inside `cnt`
            body_top = y_top + (h * 0.25)
            body_bottom = y_bottom - (h * 0.25)
            
            if is_bullish:
                y_close = body_top
                y_open = body_bottom
            else:
                y_open = body_top
                y_close = body_bottom
                
            y_high = y_top
            y_low = y_bottom
            
            processed.append(RawCandle(
                x_center=float(x_center),
                y_open=float(y_open),
                y_close=float(y_close),
                y_high=float(y_high),
                y_low=float(y_low),
                is_bullish=is_bullish,
                width=float(w)
            ))
            
        return processed

if __name__ == "__main__":
    import os
    
    # 1. Create a dummy test image if it doesn't exist so we can run the script
    test_img_path = "data/input/chart_screenshot.png"
    if not os.path.exists(test_img_path):
        os.makedirs("data/input", exist_ok=True)
        # Create a blank dark image
        img = np.zeros((400, 400, 3), dtype=np.uint8)
        # Draw a bullish green candle
        cv2.rectangle(img, (100, 200), (120, 100), (0, 255, 0), -1) # Body
        cv2.line(img, (110, 250), (110, 50), (0, 255, 0), 2) # Wick
        # Draw a bearish red candle
        cv2.rectangle(img, (200, 100), (220, 250), (0, 0, 255), -1) # Body
        cv2.line(img, (210, 80), (210, 300), (0, 0, 255), 2) # Wick
        # Draw a second bearish red candle 
        cv2.rectangle(img, (250, 200), (270, 320), (0, 0, 255), -1) # Body
        cv2.line(img, (260, 180), (260, 350), (0, 0, 255), 2) # Wick
        cv2.imwrite(test_img_path, img)
        print("Generated dummy test image with 3 candles for testing.")

    # 2. Run the Vision Module
    print("Initializing Vision Module...")
    try:
        vision = VisionModule(test_img_path)
        raw_data = vision.exact_candles()
        print(f"Detected {len(raw_data)} candles from the image.")
        for idx, c in enumerate(raw_data):
            print(f"Candle {idx+1}: {c.is_bullish=}, X={c.x_center}, Open/Close={c.y_open}/{c.y_close}")
    except Exception as e:
        print(f"Error running vision module: {e}")
