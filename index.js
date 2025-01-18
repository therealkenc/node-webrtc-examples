import bodyParser from 'body-parser';
import express from 'express';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import ViteExpress from 'vite-express';

import { mount } from './lib/server/rest/connectionsapi.js';
import WebRtcConnectionManager from './lib/server/connections/webrtcconnectionmanager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(bodyParser.json());

const examplesDirectory = join(__dirname, 'examples');

const examples = readdirSync(examplesDirectory).filter((path) =>
  statSync(join(examplesDirectory, path)).isDirectory()
);

async function setupExample(example) {
  const path = join(examplesDirectory, example);
  const clientPath = join(path, 'client.js');
  const serverPath = join(path, 'server.js');

  // Vite will handle serving the client JS
  app.get(`/${example}/index.js`, (req, res) => {
    res.sendFile(clientPath);
  });

  app.get(`/${example}/index.html`, (req, res) => {
    res.sendFile(join(__dirname, 'html', 'index.html'));
  });

  const { default: options } = await import(serverPath);
  const connectionManager = WebRtcConnectionManager.create(options);
  mount(app, connectionManager, `/${example}`);

  return connectionManager;
}

app.get('/', (req, res) => res.redirect(`${examples[0]}/index.html`));

const connectionManagers = new Map();
for (const example of examples) {
  const connectionManager = await setupExample(example);
  connectionManagers.set(example, connectionManager);
}

const server = app.listen(3000, () => {
  const address = server.address();
  console.log(`http://localhost:${address.port}\n`);

  server.once('close', () => {
    connectionManagers.forEach((connectionManager) => connectionManager.close());
  });
});

// Initialize Vite middleware
ViteExpress.config({
  mode: process.env.NODE_ENV || 'development',
  inlineViteConfig: {
    server: {
      middlewareMode: true,
    },
    appType: 'custom',
    build: {
      rollupOptions: {
        input: examples.map((example) => join(examplesDirectory, example, 'client.js')),
      },
    },
  },
});
ViteExpress.bind(app, server);
