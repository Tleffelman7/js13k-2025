const audioCtx = new AudioContext();
const masterGain = audioCtx.createGain();

export function playWordFoundSound() {
  const oscillator = audioCtx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
  oscillator.connect(masterGain);
  masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.5);

  oscillator.onended = () => {
    oscillator.disconnect();
    masterGain.disconnect();
  };
}

export function playLoseSound() {
  const oscillator = audioCtx.createOscillator();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
  oscillator.connect(masterGain);
  masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.5);

  oscillator.onended = () => {
    oscillator.disconnect();
    masterGain.disconnect();
  };
}
