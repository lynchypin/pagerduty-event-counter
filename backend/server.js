require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const DATA_FILE = process.env.DATA_FILE || './data/store.json';
const DATA_DIR = path.dirname(DATA_FILE);

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

// Initialize data file if not present
if (!fs.existsSync(DATA_FILE)) {
  fs.writeJsonSync(DATA_FILE, { routingKeys: [] }, { spaces: 2 });
}

// Helper functions
const readData = () => fs.readJsonSync(DATA_FILE);
const writeData = (data) => fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });

// API: Get all routing keys and phrases
app.get('/api/routing-keys', (req, res) => {
  const data = readData();
  res.json(data.routingKeys);
});

// API: Add a routing key
app.post('/api/routing-keys', (req, res) => {
  const { key, name } = req.body;
  if (!key) return res.status(400).json({ error: 'Routing key required' });
  const data = readData();
  if (data.routingKeys.find(rk => rk.key === key)) {
    return res.status(400).json({ error: 'Routing key already exists' });
  }
  data.routingKeys.push({
    key,
    name: name || '',
    phrases: [{ text: '', count: 0 }]
  });
  writeData(data);
  res.json(data.routingKeys);
});

// API: Rename a routing key
app.put('/api/routing-keys/:key/rename', (req, res) => {
  const { name } = req.body;
  const data = readData();
  const rk = data.routingKeys.find(rk => rk.key === req.params.key);
  if (!rk) return res.status(404).json({ error: 'Routing key not found' });
  rk.name = name;
  writeData(data);
  res.json(rk);
});

// API: Delete a routing key
app.delete('/api/routing-keys/:key', (req, res) => {
  const data = readData();
  data.routingKeys = data.routingKeys.filter(rk => rk.key !== req.params.key);
  writeData(data);
  res.json(data.routingKeys);
});

// API: Add a phrase to a routing key
app.post('/api/routing-keys/:key/phrases', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Phrase text required' });
  const data = readData();
  const rk = data.routingKeys.find(rk => rk.key === req.params.key);
  if (!rk) return res.status(404).json({ error: 'Routing key not found' });
  rk.phrases.push({ text, count: 0 });
  writeData(data);
  res.json(rk);
});

// API: Delete a phrase from a routing key
app.delete('/api/routing-keys/:key/phrases/:phraseIdx', (req, res) => {
  const data = readData();
  const rk = data.routingKeys.find(rk => rk.key === req.params.key);
  if (!rk) return res.status(404).json({ error: 'Routing key not found' });
  if (rk.phrases.length <= 1) {
    return res.status(400).json({ error: 'At least one phrase required' });
  }
  rk.phrases.splice(Number(req.params.phraseIdx), 1);
  writeData(data);
  res.json(rk);
});

// API: Update a phrase text
app.put('/api/routing-keys/:key/phrases/:phraseIdx', (req, res) => {
  const { text } = req.body;
  const data = readData();
  const rk = data.routingKeys.find(rk => rk.key === req.params.key);
  if (!rk) return res.status(404).json({ error: 'Routing key not found' });
  rk.phrases[Number(req.params.phraseIdx)].text = text;
  writeData(data);
  res.json(rk);
});

// API: Reset all counters
app.post('/api/reset', (req, res) => {
  const data = readData();
  data.routingKeys.forEach(rk => rk.phrases.forEach(p => p.count = 0));
  writeData(data);
  res.json(data.routingKeys);
});

// PagerDuty Event Endpoint (CRITICAL: Only counts, never interferes)
app.post('/events/:routingKey', (req, res) => {
  const routingKey = req.params.routingKey;
  const payload = JSON.stringify(req.body);
  const data = readData();
  const rk = data.routingKeys.find(rk => rk.key === routingKey);
  if (rk) {
    rk.phrases.forEach(phrase => {
      if (phrase.text && payload.includes(phrase.text)) {
        phrase.count += 1;
      }
    });
    writeData(data);
  }
  // Always respond quickly and with 200 OK, never block or alter event flow
  res.status(200).json({ status: 'ok' });
});

// Serve frontend in production
const frontendBuild = path.join(__dirname, '../frontend/build');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
