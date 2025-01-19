'use strict';

const TIME_TO_HOST_CANDIDATES = 3000;

class ConnectionClientBase {
  constructor(options = {}, { webrtc, fetchImpl }) {
    options = {
      clearTimeout,
      host: '',
      prefix: '.',
      setTimeout,
      timeToHostCandidates: TIME_TO_HOST_CANDIDATES,
      ...options,
    };

    const { prefix, host } = options;
    this.RTCPeerConnection = webrtc.RTCPeerConnection;
    this.RTCSessionDescription = webrtc.RTCSessionDescription;
    this.fetch = fetchImpl;

    this.createConnection = async (options = {}) => {
      options = {
        beforeAnswer() {},
        stereo: false,
        ...options,
      };

      const { beforeAnswer, stereo } = options;

      const response1 = await this.fetch(`${host}${prefix}/connections`, {
        method: 'POST',
      });

      const remotePeerConnection = await response1.json();
      const { id } = remotePeerConnection;

      const localPeerConnection = new this.RTCPeerConnection({
        sdpSemantics: 'unified-plan',
      });

      localPeerConnection.close = () => {
        this.fetch(`${host}${prefix}/connections/${id}`, { method: 'delete' }).catch(() => {});
        return this.RTCPeerConnection.prototype.close.apply(localPeerConnection);
      };

      try {
        await localPeerConnection.setRemoteDescription(remotePeerConnection.localDescription);
        await beforeAnswer(localPeerConnection);

        const originalAnswer = await localPeerConnection.createAnswer();
        const updatedAnswer = new this.RTCSessionDescription({
          type: 'answer',
          sdp: stereo ? enableStereoOpus(originalAnswer.sdp) : originalAnswer.sdp,
        });
        await localPeerConnection.setLocalDescription(updatedAnswer);

        await this.fetch(`${host}${prefix}/connections/${id}/remote-description`, {
          method: 'POST',
          body: JSON.stringify(localPeerConnection.localDescription),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        return localPeerConnection;
      } catch (error) {
        localPeerConnection.close();
        throw error;
      }
    };
  }
}

function enableStereoOpus(sdp) {
  return sdp.replace(/a=fmtp:111/, 'a=fmtp:111 stereo=1\r\na=fmtp:111');
}

export { ConnectionClientBase };
