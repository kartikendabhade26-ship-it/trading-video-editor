import express from 'express';
import cors from 'cors';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Ensure out directory exists
const outDir = path.join(__dirname, 'out');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

app.post('/api/analyze-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
    }

    const imagePath = req.file.path;
    const pythonScript = path.join(__dirname, 'python_pipeline/src/vision/process_image.py');

    console.log(`Processing image: ${imagePath}`);

    // Spawn python process
    const pythonProcess = spawn('python3', [pythonScript, imagePath]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);

        // Clean up uploaded file
        fs.unlink(imagePath, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });

        if (code !== 0) {
            console.error("Python script error:", errorString);
            return res.status(500).json({ error: 'Failed to process image', details: errorString });
        }

        try {
            const result = JSON.parse(dataString);
            if (result.error) {
                return res.status(500).json({ error: result.error });
            }
            res.json(result);
        } catch (e) {
            console.error("Failed to parse JSON from python script:", dataString);
            res.status(500).json({ error: 'Invalid response from vision pipeline' });
        }
    });
});


app.post('/api/render', async (req, res) => {
    try {
        console.log("Received render request with data:", req.body);
        const { candles } = req.body;

        // 1. Point to Vite config or Remotion root
        const entry = path.resolve(__dirname, 'src/remotion/index.ts');
        console.log("Bundling composition from entry:", entry);

        // 2. Create a webpack/vite bundle of the Remotion project
        const bundled = await bundle({
            entryPoint: entry,
            // If you are using Vite, Remotion knows how to bundle it, but we use the default Webpack bundler for Node here or configure it for vite.
            webpackOverride: (config) => config,
        });

        console.log("Bundle created at:", bundled);

        // 3. Extract the composition ID 'TradingAnimation'
        const compositionId = 'TradingAnimation';

        // 4. Pass the custom props from the editor frontend
        const inputProps = {
            candles: candles && candles.length > 0 ? candles : [{ open: 100, close: 105, high: 110, low: 95, time: Date.now() }]
        };

        const composition = await selectComposition({
            serveUrl: bundled,
            id: compositionId,
            inputProps,
        });

        // 5. Render the video
        const outputLocation = path.join(outDir, `render-${Date.now()}.mp4`);
        console.log("Rendering video to:", outputLocation);

        await renderMedia({
            composition,
            serveUrl: bundled,
            codec: 'h264',
            outputLocation,
            inputProps,
            onProgress: ({ progress }) => {
                console.log(`Rendering progress: ${Math.round(progress * 100)}%`);
            },
        });

        console.log("Render complete!");

        // 6. Send the file back to the client
        res.download(outputLocation, `trade_animation_custom.mp4`, (err) => {
            if (err) {
                console.error("Error downloading file:", err);
            }
            // Optional: Delete the file after sending to save space
            // fs.unlinkSync(outputLocation);
        });

    } catch (error) {
        console.error("Render failed:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Render server listening on http://localhost:${PORT}`);
});
