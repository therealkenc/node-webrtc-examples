'use strict';

import tape from 'tape';
import wrtc from '@roamhq/wrtc';
const { nonstandard } = wrtc;
const { RTCAudioSink } = nonstandard;

import { PitchDetector } from '../../../../lib/common/pitchdetector.js';
import { RTCAudioSourceSineWave } from '../../../../lib/server/webrtc/rtcaudiosourcesinewave.js';

tape('RTCAudioSinkFrequencyDetector', (t) => {
  t.test('it works', (t) => {
    const source = new RTCAudioSourceSineWave();
    const track = source.createTrack();
    const sink = new RTCAudioSink(track);
    const pitchDetector = new PitchDetector(track);
    const e = 1;
    sink.ondata = (data) => {
      const frequency = pitchDetector.onData(data);
      if (source.frequency - e <= frequency && frequency <= source.frequency + e) {
        sink.stop();
        track.stop();
        source.close();
        t.end();
      }
    };
  });
  t.end();
});
