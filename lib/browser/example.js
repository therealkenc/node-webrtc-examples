'use strict';

import { createStartStopButton } from './startstopbutton.js';
import { ConnectionClient } from '../client/index.js';

function createExample(name, description, options) {
  const nameTag = document.createElement('h2');
  nameTag.innerText = name;
  document.body.appendChild(nameTag);

  const descriptionTag = document.createElement('p');
  descriptionTag.innerHTML = description;
  document.body.appendChild(descriptionTag);

  const clickStartTag = document.createElement('p');
  clickStartTag.innerHTML = 'Click &ldquo;Start&rdquo; to begin.';
  document.body.appendChild(clickStartTag);

  const connectionClient = new ConnectionClient();

  let peerConnection = null;

  createStartStopButton(
    async () => {
      peerConnection = await connectionClient.createConnection(options);
      window.peerConnection = peerConnection;
    },
    () => {
      peerConnection.close();
    }
  );
}

export { createExample };
