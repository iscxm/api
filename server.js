const express = require('express');
const cors = require('cors');
const path = require('path');
const apiHandler = require('./api/index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Map the Vercel serverless API function
app.get('/api/v1', async (req, res) => {
    try {
        await apiHandler(req, res);
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// Serve Single Page Application (SPA) for all frontend routes
app.get(['/', '/doc', '/telegram', '/ping'], (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback for any other route to go to home
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 eDev API Server running on port ${PORT}`);
    console.log(`Test UI: http://localhost:${PORT}/`);
    console.log(`Test API: http://localhost:${PORT}/api/v1?ping=true`);
});
