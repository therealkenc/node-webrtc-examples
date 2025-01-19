'use strict';

import fetch from 'node-fetch';
import wrtc from '@roamhq/wrtc';
import { ConnectionClientBase } from './connection-client-base.js';

class ConnectionClient extends ConnectionClientBase {
  constructor(options = {}) {
    super(options, {
      webrtc: wrtc,
      fetchImpl: fetch,
    });
  }
}

export { ConnectionClient };
