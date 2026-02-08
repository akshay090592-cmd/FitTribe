
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const MAX_WIDTH = 1600;

async function optimizeImages() {
    const cwd = process.cwd();
    console.log(`Searching for PNGs in ${cwd}...`);

    // Find all PNGs in public/assets and src
    // We exclude node_modules and dist
    const pattern = '{public,src}/**/*.png';
    const ignore = ['node_modules/**', 'dist/**'];

    // glob returns paths with forward slashes usually, but we should handle OS specifics
    const files = await glob(pattern, { ignore, cwd, nodir: true });

    console.log(`Found ${files.length} PNG files.`);

    for (const file of files) {
        const filePath = path.join(cwd, file);
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const name = path.basename(filePath, ext);
        const newFilePath = path.join(dir, `${name}.webp`);

        try {
            console.log(`Processing: ${file}`);

            const image = sharp(filePath);
            const metadata = await image.metadata();

            let pipeline = image.webp({ quality: 80 });

            if (metadata.width && metadata.width > MAX_WIDTH) {
                console.log(`  Resizing from ${metadata.width}px to ${MAX_WIDTH}px`);
                pipeline = pipeline.resize({ width: MAX_WIDTH });
            }

            await pipeline.toFile(newFilePath);
            console.log(`  Saved to ${newFilePath}`);

        } catch (err) {
            console.error(`  Error processing ${file}:`, err);
        }
    }
}

optimizeImages().catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
});
