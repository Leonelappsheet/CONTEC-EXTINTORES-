import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction ? (Number(process.env.PORT) || 3000) : 3000;
const DB_FILE = path.join(__dirname, 'contec-db.json');

app.use(express.json({ limit: '50mb' }));

// Shared Database Storage Functions
function loadDb(): Record<string, any> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading contec-db.json:', err);
  }
  return {};
}

function saveDb(data: Record<string, any>) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing contec-db.json:', err);
  }
}

// In-Memory Database initialized from file
let db = loadDb();

// Active Server-Sent Events (SSE) subscribers
const sseClients = new Set<express.Response>();

function broadcastUpdate(payload: {
  type: string;
  key?: string;
  data?: any;
  senderId?: string;
  timestamp: number;
}) {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    connectedClients: sseClients.size,
    lastUpdated: db.lastUpdated || null,
  });
});

// Get all centralized data
app.get('/api/data', (_req, res) => {
  res.json({
    success: true,
    data: db,
    timestamp: Date.now(),
  });
});

// Synchronize a specific collection or entire state
app.post('/api/sync', (req, res) => {
  const { key, data, senderId, fullState } = req.body;
  const timestamp = Date.now();

  if (fullState && typeof fullState === 'object') {
    db = {
      ...db,
      ...fullState,
      lastUpdated: timestamp,
    };
    saveDb(db);
    broadcastUpdate({ type: 'FULL_SYNC', data: fullState, senderId, timestamp });
    return res.json({ success: true, timestamp });
  }

  if (key && data !== undefined) {
    db[key] = data;
    db.lastUpdated = timestamp;
    saveDb(db);
    broadcastUpdate({ type: 'UPDATE', key, data, senderId, timestamp });
    return res.json({ success: true, timestamp });
  }

  res.status(400).json({ success: false, error: 'Invalid payload' });
});

// Reset demo data on server
app.post('/api/reset', (req, res) => {
  const { senderId, initialData } = req.body;
  const timestamp = Date.now();

  db = {
    ...(initialData || {}),
    lastUpdated: timestamp,
  };
  saveDb(db);
  broadcastUpdate({ type: 'RESET', data: db, senderId, timestamp });
  res.json({ success: true, timestamp });
});

// Real-Time SSE Stream Endpoint
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  // Heartbeat ping every 15 seconds to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

async function startServer() {
  if (!isProduction) {
    // Development mode with Vite Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    // Production mode: Serve built dist
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CONTEC EXTINTORES] Servidor Full-Stack rodando na porta ${PORT} (${isProduction ? 'Produção' : 'Desenvolvimento'})`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
});
