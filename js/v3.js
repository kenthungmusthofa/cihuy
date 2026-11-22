/* V3 birthday candle interaction. No data is uploaded, recorded or stored. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const candle = $('#candleScene');
  const blow = $('#blowCandle');
  const microphone = $('#blowWithMic');
  const status = $('#candleResult');
  const retry = $('#candleRestart');
  const sparks = $('#candleSparks');
  if (!candle || !blow || !status) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let blown = false;
  let listening = false;
  let pending = false;
  let generation = 0;
  let blowTimer;
  let stream = null;
  let context = null;
  let frameId = 0;
  let loudFrames = 0;
  const stopListening = async () => {
    generation++;
    pending = false;
    microphone.removeAttribute('aria-busy');
    listening = false;
    cancelAnimationFrame(frameId);
    microphone.classList.remove('is-listening');
    microphone.textContent = '♪ Gunakan mikrofon';
    if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
    if (context) { const current = context; context = null; try { await current.close(); } catch {} }
  };
  const scatter = () => {
    if (reduce) return;
    sparks.replaceChildren();
    for (let i = 0; i < 24; i++) {
      const part = document.createElement('span');
      part.className = 'candle-particle';
      part.textContent = i % 4 ? '✦' : '✧';
      const angle = i * (Math.PI * 2 / 24);
      const distance = 70 + (i % 5) * 25;
      part.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
      part.style.setProperty('--y', `${Math.sin(angle) * distance - 55}px`);
      part.style.setProperty('--size', `${12 + i % 4 * 5}px`);
      part.style.setProperty('--turn', `${i * 45}deg`);
      part.style.setProperty('--delay', `${(i % 4) * 0.04}s`);
      sparks.appendChild(part);
    }
    setTimeout(() => sparks.replaceChildren(), 2200);
  };
  const extinguish = () => {
    if (blown) return;
    blown = true;
    void stopListening();
    candle.classList.add('is-blowing');
    blow.disabled = true;
    microphone.disabled = true;
    status.textContent = 'Harapannya sedang terbang menuju langit...';
    blowTimer = setTimeout(() => {
      candle.classList.remove('is-blowing');
      candle.classList.add('is-blown');
      scatter();
      status.textContent = 'Aamiin. Semoga Allah memudahkan harapan-harapan baikmu. Barakallahu fii umrik. ♡';
      retry.hidden = false;
    }, reduce ? 40 : 610);
  };
  blow.addEventListener('click', extinguish);
  retry.addEventListener('click', () => {
    clearTimeout(blowTimer);
    blown = false;
    candle.classList.remove('is-blown','is-blowing');
    status.textContent = 'Lilin kecil ini menunggu sebuah harapan.';
    blow.disabled = false;
    microphone.disabled = false;
    retry.hidden = true;
    sparks.replaceChildren();
  });
  microphone.addEventListener('click', async () => {
    if (blown || pending) return;
    if (listening) { await stopListening(); status.textContent='Mikrofon dimatikan. Kamu tetap bisa menekan tombol tiup.'; return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      status.textContent = 'Mikrofon tidak tersedia di browser ini. Gunakan tombol “Tiup lilinnya”.';
      return;
    }
    const request = ++generation;
    pending = true;
    microphone.setAttribute('aria-busy', 'true');
    try {
      const result = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      if (request !== generation || document.hidden || blown) {
        result.getTracks().forEach(track => track.stop());
        return;
      }
      stream = result;
      context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      listening = true;
      loudFrames = 0;
      microphone.classList.add('is-listening');
      microphone.textContent = '◉ Mendengarkan…';
      status.textContent = 'Coba tiup ke arah mikrofon HP beberapa saat.';
      function detectBlow() {
        if (!listening || blown) return;
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (let i=0;i<samples.length;i++) { const v=(samples[i]-128)/128; sum+=v*v; }
        const rms = Math.sqrt(sum/samples.length);
        loudFrames = rms > .105 ? loudFrames + 1 : Math.max(0,loudFrames-2);
        if (loudFrames > 9) { extinguish(); return; }
        frameId = requestAnimationFrame(detectBlow);
      }
      detectBlow();
    } catch (error) {
      if (request !== generation) return;
      await stopListening();
      status.textContent = 'Akses mikrofon tidak diizinkan atau tidak tersedia. Gunakan tombol “Tiup lilinnya”.';
    } finally {
      if (request === generation) {
        pending = false;
        microphone.removeAttribute('aria-busy');
      }
    }
  });
  document.addEventListener('gift:full-replay', async()=>{
    await stopListening();
    retry.click();
  });
  function stopInactiveMicrophone() {
    if (pending || listening) {
      void stopListening();
      status.textContent = 'Mikrofon dimatikan. Kamu tetap bisa menekan tombol tiup.';
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopInactiveMicrophone(); });
  window.addEventListener('pagehide', stopInactiveMicrophone);
})();
