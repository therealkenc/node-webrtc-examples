'use strict';

import wrtc from '@roamhq/wrtc';
const { nonstandard } = wrtc;
const { RTCAudioSink } = nonstandard;

import { PitchDetector } from '../../lib/common/pitchdetector.js';

function beforeOffer(peerConnection) {
  const { track } = peerConnection.addTransceiver('audio').receiver;
  const sink = new RTCAudioSink(track);
  const pitchDetector = new PitchDetector();

  const dataChannel = peerConnection.createDataChannel('frequency');

  function onData(data) {
    const frequency = pitchDetector.onData(data);
    if (frequency && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(frequency));
    }
  }

  sink.ondata = onData;

  // NOTE(mroberts): This is a hack so that we can get a callback when the
  // RTCPeerConnection is closed. In the future, we can subscribe to
  // "connectionstatechange" events.
  const { close } = peerConnection;
  peerConnection.close = function () {
    sink.stop();
    return close.apply(this, arguments);
  };
}

export { beforeOffer };
