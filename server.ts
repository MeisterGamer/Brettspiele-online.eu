import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './server/db.js';
import { authRouter } from './server/routes/auth.js';
import { setupRouter } from './server/routes/setup.js';

import fs from 'fs';

process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Check command line argument --port (e.g. tsx server.ts --port 5555)
let argPort: number | null = null;
const portArgIndex = process.argv.indexOf('--port');
if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
  const parsed = parseInt(process.argv[portArgIndex + 1], 10);
  if (!isNaN(parsed) && parsed > 0) {
    argPort = parsed;
  }
}

// 2. Detect if running inside Google AI Studio environment
const isAiStudio = Boolean(process.env.APPLET_ID || process.env.DEFAULT_APP_PORT);

// 3. Port resolution: 5555 by default on user server, 3000 in AI Studio dev environment
const defaultPort = isAiStudio ? 3000 : 5555;
const envPort = process.env.APP_PORT || (process.env.PORT === '8080' && isAiStudio ? '3000' : process.env.PORT);
const PORT = argPort || (envPort ? parseInt(envPort, 10) : defaultPort);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication and user management routes
app.use('/api/auth', authRouter);
// Web-Setup Wizard routes
app.use('/api/setup', setupRouter);

// Initialize MariaDB
try {
  await initDatabase();
} catch (dbErr) {
  console.warn('[Database] Initial connection error, continuing in resilient mode:', dbErr);
}

// In development, mount Vite middleware
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      port: PORT,
      host: '0.0.0.0',
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    try {
      const templatePath = path.resolve(__dirname, 'index.html');
      let template = fs.readFileSync(templatePath, 'utf-8');
      template = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  // Production static file hosting
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FamPlay Server] 🚀 Full-Stack server running on http://0.0.0.0:${PORT}`);
  console.log(`[FamPlay Server] 🔒 Mandatory Login & MariaDB authentication active.`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [FamPlay Server] FEHLER: Port ${PORT} ist bereits belegt!`);
    console.error(`👉 Ursache: Ein vorheriger Prozess läuft noch auf Port ${PORT}.`);
    console.error(`👉 Lösung 1: Beende den vorherigen Prozess, z.B. mit: fuser -k ${PORT}/tcp`);
    console.error(`👉 Lösung 2: Starte mit einem alternativen Port, z.B.: PORT=5556 npm run dev\n`);
    process.exit(1);
  } else {
    console.error('[FamPlay Server] Unerwarteter Server-Fehler:', err);
  }
});
