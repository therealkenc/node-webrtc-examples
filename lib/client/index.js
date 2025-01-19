'use strict';

import { ConnectionClientBase } from './connection-client-base.js';

class ConnectionClient extends ConnectionClientBase {
  constructor(options = {}) {
    if (typeof window === 'undefined') {
      throw new Error('Browser implementation cannot run in Node.js');
    }
    super(options, {
      webrtc: window, // window has both RTCPeerConnection and RTCSessionDescription
      fetchImpl: window.fetch.bind(window),
    });
  }
}

export { ConnectionClient };
