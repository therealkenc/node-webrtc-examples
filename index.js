'use strict';

import bodyParser from 'body-parser';
import express from 'express';
import { readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mount } from './lib/server/rest/connectionsapi.js';
import { WebRtcConnectionManager } from './lib/server/connections/webrtcconnectionmanager.js';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);

const app = express();

app.use(bodyParser.json());

const examplesDirectory = path.join(__dirname, 'examples');

const examples = readdirSync(examplesDirectory).filter((apath) => {
  const fullPath = path.join(examplesDirectory, apath);
  return statSync(fullPath).isDirectory();
});

async function setupExample(example) {
  const apath = path.join(examplesDirectory, example);
  const clientPath = path.join(apath, 'client.js');
  const serverPath = path.join(apath, 'server.js');

  app.get(`/${example}/index.js`, async (req, res) => {
    try {
      const result = await esbuild.build({
        entryPoints: [clientPath],
        bundle: true,
        write: false,
        format: 'esm',
        target: ['es2020'],
        platform: 'browser',
        external: ['node:*', 'fs', 'path', 'http', 'https', 'url'],
        conditions: ['browser', 'default'],
        mainFields: ['browser', 'module', 'main'],
        define: {
          'process.env.NODE_ENV': '"development"',
          global: 'window',
        },
        alias: {
          fs: path.join(__dirname, 'empty-module.js'),
          path: path.join(__dirname, 'empty-module.js'),
        },
      });

      res.set('Content-Type', 'application/javascript');
      res.send(result.outputFiles[0].text);
    } catch (error) {
      console.error('Build error:', error);
      res.status(500).send('Build failed');
    }
  });

  app.get(`/${example}/index.html`, (_req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
  });

  const { beforeOffer } = await import(serverPath);
  const connectionManager = WebRtcConnectionManager.create({ beforeOffer });
  mount(app, connectionManager, `/${example}`);

  return connectionManager;
}

app.get('/', (_req, res) => res.redirect(`${examples[0]}/index.html`));

const connectionManagers = examples.reduce((connectionManagers, example) => {
  const connectionManager = setupExample(example);
  return connectionManagers.set(example, connectionManager);
}, new Map());

const server = app.listen(3000, () => {
  const address = server.address();
  console.log(`http://localhost:${address.port}\n`);

  server.once('close', () => {
    connectionManagers.forEach((connectionManager) => connectionManager.close());
  });
});
