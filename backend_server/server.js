// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = require('node-fetch'); // for AI calls or scraping
const cheerio = require('cheerio');   // for scraping HTML
const cron = require('node-cron');

const authRoutes = require('./routes/authRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');

const app = express();

// -----------------------------
// ✅ Middleware
// -----------------------------
const corsOptions = {
  origin: 'http://localhost:5173', // React frontend
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// -----------------------------
// 🔹 Scraping Your Own Website
// -----------------------------
let cachedSchemes = [];

async function scrapeSchemes() {
  try {
    console.log("🔄 Scraping schemes from your website...");
    const res = await fetch("http://localhost:5173"); // Replace with deployed URL if needed
    const html = await res.text();
    const $ = cheerio.load(html);

    let schemes = [];
    $(".scheme-card").each((i, el) => {  // Adjust selector to match your website HTML
      const title = $(el).find(".scheme-title").text().trim();
      const desc = $(el).find(".scheme-desc").text().trim();
      const link = $(el).find("a").attr("href");
      if (title) {
        schemes.push({
          title,
          desc,
          link: link ? `http://localhost:5173${link}` : null
        });
      }
    });

    cachedSchemes = schemes;
    console.log(`✅ Scraped ${schemes.length} schemes from your website`);
  } catch (err) {
    console.error("❌ Scraping failed:", err);
  }
}

// Scrape once at startup
scrapeSchemes();

// Auto-refresh daily at 6 AM
cron.schedule("0 6 * * *", () => {
  scrapeSchemes();
});

// -----------------------------
// 🔹 Chatbot AI Route
// -----------------------------
app.post('/get', async (req, res) => {
  try {
    const { msg } = req.body;
    if (!msg) return res.status(400).json({ response: "⚠️ Please enter a query." });

    // Search cached schemes first
    const results = cachedSchemes.filter(s =>
      s.title.toLowerCase().includes(msg.toLowerCase()) ||
      s.desc.toLowerCase().includes(msg.toLowerCase())
    );

    let context = results.length
      ? results.map(s => `- ${s.title}: ${s.desc} (More: ${s.link})`).join("\n")
      : "No matching schemes found.";

    // Call Ollama Mistral AI (optional)
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: `The user asked: "${msg}". Use the following schemes data to answer clearly in the same language as the user:\n${context}`
      }),
    });

    const data = await ollamaRes.json();
    res.json({ response: data.response || context });
  } catch (err) {
    console.error("❌ Chatbot error:", err);
    res.status(500).json({ response: "⚠️ Something went wrong." });
  }
});

// -----------------------------
// 🔹 Direct Schemes Search API
// -----------------------------
app.get("/api/schemes/search", (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const results = cachedSchemes.filter(s =>
    s.title.toLowerCase().includes(q.toLowerCase()) ||
    s.desc.toLowerCase().includes(q.toLowerCase())
  );
  res.json(results);
});

// -----------------------------
// ✅ MongoDB + Server Start
// -----------------------------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  tls: true,
  tlsInsecure: false,
})
.then(() => {
  console.log('✅ MongoDB connected');
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
.catch(err => console.error('❌ DB Connection Failed:', err));
