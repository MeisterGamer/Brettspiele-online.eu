import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './server/db.js';
import { authRouter } from './server/routes/auth.js';
import { setupRouter } from './server/routes/setup.js';

import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Dev server in AI Studio must bind to 3000. Use APP_PORT if explicitly set.
const PORT = parseInt(process.env.APP_PORT || (process.env.PORT === '8080' ? '3000' : process.env.PORT || '3000'), 10);

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FamPlay Server] 🚀 Full-Stack server running on http://0.0.0.0:${PORT}`);
  console.log(`[FamPlay Server] 🔒 Mandatory Login & MariaDB authentication active.`);
});
