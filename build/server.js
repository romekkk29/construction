import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 4000;
app.use(express.static(path.join(__dirname, '../dist')));
// SPA fallback (Express 5 compatible)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});
app.listen(PORT, () => {
    console.log(`🚀 Frontend running on port ${PORT}`);
});
