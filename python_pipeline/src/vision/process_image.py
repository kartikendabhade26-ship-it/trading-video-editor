import sys
import json
import argparse
import os
from vision import VisionModule

def main():
    parser = argparse.ArgumentParser(description='Process a chart image and extract candlestick data.')
    parser.add_argument('image_path', type=str, help='Path to the image file')
    args = parser.parse_args()

    if not os.path.exists(args.image_path):
        print(json.dumps({'error': f'File not found: {args.image_path}'}))
        sys.exit(1)

    try:
        vision = VisionModule(args.image_path)
        raw_candles = vision.exact_candles()

        if not raw_candles:
            print(json.dumps({'candles': []}))
            return

        # Convert raw pixel data to a normalized/relative coordinate system or price
        # VisionModule returns y_open, y_close, etc. in pixel coordinates where 0 is top.
        # We need to invert this because in financial charts, higher Y (pixel) means lower price.
        # Let's map the pixel range to a dummy price range (e.g., 0 to 100) or keep it relative.

        # Find global min/max Y to normalize
        all_y = []
        for c in raw_candles:
            all_y.extend([c.y_open, c.y_close, c.y_high, c.y_low])

        min_y = min(all_y)
        max_y = max(all_y)
        height_range = max_y - min_y if max_y != min_y else 1.0

        # We'll map the pixel values to a price range.
        # Let's say the chart spans from price 100 (bottom of image) to 200 (top of image).
        # Pixel y_max (bottom) -> Price 100
        # Pixel y_min (top) -> Price 200

        # But wait, the frontend is flexible. It just takes raw numbers.
        # If we send pixel values directly:
        # y=0 (top) is high price. y=1000 (bottom) is low price.
        # If we just invert them: Price = (ImageHeight - y)
        # That should be enough for the frontend to auto-scale.

        # Let's assume an arbitrary image height if we don't know it, or just use the max_y found.
        # Using max_y + padding as the "zero" reference.
        reference_height = max_y + 50

        candles_data = []
        for i, c in enumerate(raw_candles):
            candles_data.append({
                'time': i, # Sequential index as time
                'open': reference_height - c.y_open,
                'close': reference_height - c.y_close,
                'high': reference_height - c.y_high,
                'low': reference_height - c.y_low,
            })

        print(json.dumps({'candles': candles_data}))

    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
