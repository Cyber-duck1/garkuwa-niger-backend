const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // for voice files

// SUPABASE CONNECTION (paste your full string here — see Step 2)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL  // Use env var for security
});

// INIT DB (run once)
app.get('/init', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sos (
        id SERIAL PRIMARY KEY,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        type VARCHAR(50),
        message TEXT,
        voice_url TEXT,
        anonymous BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_location ON sos(lat, lng);
      CREATE INDEX IF NOT EXISTS idx_time ON sos(created_at);
    `);
    res.send("DB Ready! Tables created.");
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

// RECEIVE SOS FROM APP
app.post('/sos', async (req, res) => {
  const { lat, lng, type, message, voiceBase64, anonymous } = req.body;

  let voiceUrl = null;
  if (voiceBase64) {
    // TODO: Upload to free storage like Supabase Storage or Cloudinary
    voiceUrl = "uploaded_voice.ogg"; // Placeholder
  }

  try {
    await pool.query(
      `INSERT INTO sos (lat, lng, type, message, voice_url, anonymous) 
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [lat, lng, type, message, voiceUrl, anonymous]
    );

    // SEND SMS TO NEAREST VIGILANTES (using Termii)
    await sendToNearestVigilantes(lat, lng, type, message);

    res.json({ success: true, message: "SOS received & dispatched!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET LIVE ALERTS FOR MAP
app.get('/alerts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT lat, lng, type, COUNT(*) as count, MAX(created_at) as last_time
      FROM sos 
      WHERE created_at > NOW() - INTERVAL '2 hours'
      GROUP BY lat, lng, type
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function sendToNearestVigilantes(lat, lng, type, message) {
  // Use your LGAData from data/emergencyContacts.js (copy here or import)
  const LGAData = { /* Paste your full LGA contacts here */ };
  const lga = findNearestLGA(lat, lng); // Implement from earlier
  const numbers = getContactsForLGA(lga); // Implement from earlier

  const smsText = `GARKUWA NIGER ALERT!\nType: ${type}\nLocation: https://maps.google.com/?q=${lat},${lng}\nDetails: ${message}\nTime: ${new Date().toLocaleString('en-NG')}`;

  try {
    await axios.post('https://api.ng.termii.com/api/sms/send', {
      to: numbers.join(','),
      from: process.env.TERMII_SENDER_ID || 'GarkuwaNgr',  // Your Sender ID
      sms: smsText,
      type: 'plain',
      channel: 'dnd',  // For emergency (delivers to DND numbers)
      api_key: process.env.TERMII_API_KEY  // Add your key as env var
    });
  } catch (err) {
    console.error('SMS failed:', err.message);
  }
}

// Helper functions (paste from data/emergencyContacts.js)
function findNearestLGA(lat, lng) { /* Your logic */ return 'Shiroro'; }
function getContactsForLGA(lga) { /* Your 300+ contacts */ return ['+2348012345678']; }

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Garkuwa Niger Backend on port ${port}`));