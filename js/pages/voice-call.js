/**
 * Voice Call Page — Call controls and timer
 */
document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('callStatus');
  const timerEl = document.getElementById('callTimer');
  const avatarEl = document.getElementById('callAvatar');
  const muteBtn = document.getElementById('muteBtn');
  const speakerBtn = document.getElementById('speakerBtn');
  const endBtn = document.getElementById('endCallBtn');
  const acceptBtn = document.getElementById('acceptCallBtn');

  let timer = null;
  let seconds = 0;
  let callActive = false;

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function startCall() {
    callActive = true;
    statusEl.textContent = 'Connected';
    statusEl.className = 'voice-call-status active';
    avatarEl?.classList.remove('ringing');
    seconds = 0;
    timer = setInterval(() => {
      seconds++;
      if (timerEl) timerEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function endCall() {
    callActive = false;
    clearInterval(timer);
    statusEl.textContent = 'Call Ended';
    statusEl.className = 'voice-call-status';
    if (timerEl) timerEl.textContent = formatTime(seconds);
    StudyConnect.toast('Call ended');
    setTimeout(() => window.location.href = 'chat.html', 2000);
  }

  // Simulate connecting
  setTimeout(() => {
    if (statusEl) {
      statusEl.textContent = 'Ringing...';
      statusEl.className = 'voice-call-status connecting';
    }
    avatarEl?.classList.add('ringing');
    setTimeout(startCall, 2000);
  }, 1000);

  muteBtn?.addEventListener('click', () => {
    muteBtn.classList.toggle('active');
    muteBtn.innerHTML = muteBtn.classList.contains('active') ? Icons.micOff : Icons.mic;
    StudyConnect.toast(muteBtn.classList.contains('active') ? 'Microphone muted' : 'Microphone unmuted');
  });

  speakerBtn?.addEventListener('click', () => {
    speakerBtn.classList.toggle('active');
    speakerBtn.innerHTML = speakerBtn.classList.contains('active') ? Icons.volumeOff : Icons.volume;
    StudyConnect.toast(speakerBtn.classList.contains('active') ? 'Speaker off' : 'Speaker on');
  });

  endBtn?.addEventListener('click', endCall);
  acceptBtn?.addEventListener('click', () => {
    document.getElementById('incomingCallOverlay')?.remove();
    startCall();
  });
});
