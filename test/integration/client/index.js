/* eslint no-process-env:0 */
'use strict';

import { json } from 'body-parser';
import express from 'express';
import tape from 'tape';

import ConnectionClient from '../../../lib/client.js';
import { create } from '../../../lib/server/connections/webrtcconnectionmanager.js';
import connectionsApi from '../../../lib/server/rest/connectionsapi.js';

tape('ConnectionsClient', (t) => {
  t.test('typical usage', (t) => {
    const app = express();

    app.use(json());

    const connectionManager = create({
      beforeOffer(peerConnection) {
        peerConnection.createDataChannel('test');
      },
      timeToReconnected: 0,
    });

    connectionsApi(app, connectionManager);

    const server = app.listen(3000, async () => {
      const connectionClient = new ConnectionClient({
        host: 'http://localhost:3000',
        prefix: '/v1',
      });

      const peerConnection = await connectionClient.createConnection();

      peerConnection.close();

      connectionManager.getConnections().forEach((connection) => connection.close());

      server.close();

      t.end();
    });
  });

  t.end();
});
