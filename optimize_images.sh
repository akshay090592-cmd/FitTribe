#!/bin/bash

# Directory containing images
IMAGE_DIR="public/assets"

# Max width
MAX_WIDTH=1200

echo "Optimizing images in $IMAGE_DIR..."

# Find all PNG files
find "$IMAGE_DIR" -name "*.png" | while read -r file; do
    # Get current width
    width=$(sips -g pixelWidth "$file" | tail -n 1 | awk '{print $2}')
    
    if [ -z "$width" ]; then
        echo "Could not read width for $file"
        continue
    fi

    if [ "$width" -gt "$MAX_WIDTH" ]; then
        echo "Resizing $file (Current width: $width)"
        sips -Z "$MAX_WIDTH" "$file"
    else
        echo "Skipping $file (Width: $width)"
    fi
done

echo "Optimization complete."
