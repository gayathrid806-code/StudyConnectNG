/**
 * Real in-app voice call between two logged-in students (WebRTC).
 */
document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('callStatus');
  const timerEl = document.getElementById('callTimer');
  const avatarEl = document.getElementById('callAvatar');
  const nameEl = document.getElementById('callName');
  const branchEl = document.getElementById('callBranch');
  const muteBtn = document.getElementById('muteBtn');
  const speakerBtn = document.getElementById('speakerBtn');
  const endBtn = document.getElementById('endCallBtn');
  const remoteAudio = document.getElementById('remoteAudio');

  const params = new URLSearchParams(location.search);
  const peerName = params.get('user');
  const incomingId = params.get('call');
  const isIncoming = params.get('incoming') === '1';

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  let pc = null;
  let localStream = null;
  let callId = incomingId;
  let pollTimer = null;
  let secondsTimer = null;
  let seconds = 0;
  let appliedCallerIce = 0;
  let appliedCalleeIce = 0;
  let hungUp = false;

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = 'voice-call-status' + (kind ? ' ' + kind : '');
  }

  function startTimer() {
    clearInterval(secondsTimer);
    seconds = 0;
    secondsTimer = setInterval(() => {
      seconds += 1;
      if (timerEl) timerEl.textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
    }, 1000);
  }

  async function hangUp(redirect) {
    if (hungUp) return;
    hungUp = true;
    clearInterval(pollTimer);
    clearInterval(secondsTimer);
    if (callId) {
      try { await API.request('/api/calls/' + callId + '/end', { method: 'POST', body: '{}' }); } catch (_) {}
    }
    localStream?.getTracks().forEach((t) => t.stop());
    pc?.close();
    setStatus('Call ended');
    if (redirect !== false) {
      StudyConnect.toast('Call ended');
      setTimeout(() => { location.href = 'chat.html'; }, 1200);
    }
  }

  function wirePeer() {
    pc = new RTCPeerConnection(iceServers);
    pc.onicecandidate = async (event) => {
      if (!event.candidate || !callId) return;
      try {
        await API.request('/api/calls/' + callId + '/ice', {
          method: 'POST',
          body: JSON.stringify({ candidate: event.candidate })
        });
      } catch (_) {}
    };
    pc.ontrack = (event) => {
      if (!remoteAudio) return;
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setStatus('Connected', 'active');
        avatarEl?.classList.remove('ringing');
        startTimer();
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setStatus('Connection lost');
      }
    };
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  }

  async function applyRemoteIce(call) {
    const mineIsCaller = !isIncoming;
    const remote = mineIsCaller ? call.calleeIce : call.callerIce;
    let index = mineIsCaller ? appliedCalleeIce : appliedCallerIce;
    while (index < remote.length) {
      try { await pc.addIceCandidate(remote[index]); } catch (_) {}
      index += 1;
    }
    if (mineIsCaller) appliedCalleeIce = index;
    else appliedCallerIce = index;
  }

  async function pollCall() {
    if (!callId || hungUp) return;
    const data = await API.request('/api/calls/' + callId);
    const call = data.call;
    if (!call || call.status === 'ended') {
      await hangUp();
      return;
    }
    if (!isIncoming && call.answer && pc.remoteDescription == null) {
      await pc.setRemoteDescription(call.answer);
      setStatus('Connecting...', 'connecting');
    }
    await applyRemoteIce(call);
  }

  async function startMic() {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }

  muteBtn?.addEventListener('click', () => {
    const audio = localStream?.getAudioTracks()[0];
    if (!audio) return;
    audio.enabled = !audio.enabled;
    muteBtn.classList.toggle('active', !audio.enabled);
    muteBtn.innerHTML = audio.enabled ? Icons.mic : Icons.micOff;
    StudyConnect.toast(audio.enabled ? 'Microphone on' : 'Microphone muted');
  });

  speakerBtn?.addEventListener('click', () => {
    speakerBtn.classList.toggle('active');
    if (remoteAudio) remoteAudio.muted = speakerBtn.classList.contains('active');
    speakerBtn.innerHTML = speakerBtn.classList.contains('active') ? Icons.volumeOff : Icons.volume;
    StudyConnect.toast(speakerBtn.classList.contains('active') ? 'Speaker muted' : 'Speaker on');
  });

  endBtn?.addEventListener('click', () => hangUp());

  try {
    if (!peerName && !incomingId) {
      setStatus('Pick a student in Chat, then tap the call button');
      return;
    }

    setStatus(isIncoming ? 'Joining call...' : 'Requesting microphone...', 'connecting');
    await startMic();
    wirePeer();

    if (isIncoming && incomingId) {
      const info = await API.request('/api/calls/' + incomingId);
      const other = info.call?.caller;
      if (nameEl) nameEl.textContent = other?.username || 'Student';
      if (avatarEl) avatarEl.textContent = (other?.username || 'S').charAt(0);
      if (branchEl) branchEl.textContent = [other?.branch, other?.year].filter(Boolean).join(' · ');
      await pc.setRemoteDescription(info.call.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await API.request('/api/calls/' + incomingId + '/answer', {
        method: 'POST',
        body: JSON.stringify({ answer: pc.localDescription })
      });
      setStatus('Connecting...', 'connecting');
      avatarEl?.classList.add('ringing');
    } else {
      if (nameEl) nameEl.textContent = peerName;
      if (avatarEl) avatarEl.textContent = peerName.charAt(0);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const created = await API.request('/api/calls', {
        method: 'POST',
        body: JSON.stringify({ username: peerName, offer: pc.localDescription })
      });
      callId = created.call.id;
      const other = created.call.callee;
      if (branchEl) branchEl.textContent = [other?.branch, other?.year].filter(Boolean).join(' · ');
      setStatus('Ringing... wait for them to open the app', 'connecting');
      avatarEl?.classList.add('ringing');
    }

    pollTimer = setInterval(() => {
      pollCall().catch((err) => StudyConnect.toast(err.message));
    }, 1000);
  } catch (err) {
    setStatus('Could not start call');
    StudyConnect.toast(err.message.includes('Permission') || err.name === 'NotAllowedError'
      ? 'Allow microphone access, then try again'
      : err.message);
  }
});
