require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// -----------------------------
// Middleware
// -----------------------------
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

// -----------------------------
// Load schemes.json
// -----------------------------
let cachedSchemes = [];
const schemesPath = path.join(__dirname, '../client/public/schemes.json');

try {
  const data = fs.readFileSync(schemesPath, 'utf-8');
  cachedSchemes = JSON.parse(data);
  console.log(`✅ Loaded ${cachedSchemes.length} schemes from schemes.json`);
} catch (err) {
  console.error('❌ Failed to load schemes.json:', err.message);
}

// -----------------------------
// Automatic Welcome Message Route
// -----------------------------
app.get('/welcome', (req, res) => {
  res.json({
    response: `
    👋 Welcome to the Welfare Schemes Advisor!<br><br>
    You can ask about:<br>
    • Scholarships for students<br>
    • Women welfare programs<br>
    • Loans for startups or youth<br>
    • Insurance and health schemes<br><br>
    Just type a topic or keyword — I’ll find the matching government schemes for you. 🚀
    `
  });
});

// -----------------------------
// Chatbot Search Route
// -----------------------------
app.post('/get', (req, res) => {
  try {
    const { msg } = req.body;
    if (!msg) return res.status(400).json({ response: "⚠️ Please enter a query." });

    const query = msg.toLowerCase();

    const results = cachedSchemes.filter((s) => {
      const title = s.title?.en || '';
      const benefits = s.benefits?.en || '';
      return title.toLowerCase().includes(query) || benefits.toLowerCase().includes(query);
    });

    const responseText = results.length
      ? results.map(
          (s) =>
            `➡️ <strong>${s.title.en}</strong>: ${s.benefits.en}. <a href="${s.link}" target="_blank" rel="noopener noreferrer">🔗 Open</a>`
        ).join('<br><br>')
      : "❌ No matching schemes found. Try a different keyword.";

    res.json({ response: responseText });

  } catch (err) {
    console.error('❌ Chatbot error:', err);
    res.status(500).json({ response: "⚠️ Something went wrong. Please try again later." });
  }
});

// -----------------------------
// MongoDB + Server Start
// -----------------------------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, { tls: true, tlsInsecure: false })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT} | Welfare Schemes Chatbot Ready!`)
    );
  })
  .catch((err) => console.error('❌ DB Connection Failed:', err));
