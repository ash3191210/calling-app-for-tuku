import { useRef, useState } from 'react';
import './App.css';

const SIGNAL_SERVER_URL = 'wss://backend-calling-app.onrender.com/'';

function App() {
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState('Not connected');

  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const joinRoom = async () => {
    try {
      wsRef.current = new WebSocket(SIGNAL_SERVER_URL);

      wsRef.current.onopen = () => {
        wsRef.current.send(JSON.stringify({ type: 'join', room }));
        setStatus('Connected to signaling server 💕');
      };

      wsRef.current.onmessage = handleSignal;

      pcRef.current = new RTCPeerConnection();

      pcRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal({ candidate: e.candidate });
        }
      };

      pcRef.current.ontrack = (e) => {
        remoteAudioRef.current.srcObject = e.streams[0];
      };

      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current.getTracks().forEach((track) => {
        pcRef.current.addTrack(track, localStreamRef.current);
      });

      setJoined(true);
      setStatus('Ready in room 💖');
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + err.message);
    }
  };

  const call = async () => {
    try {
      setStatus('Calling... 📞');
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      sendSignal({ sdp: offer });
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + err.message);
    }
  };

  const handleSignal = async (message) => {
    try {
      const data = JSON.parse(message.data);
      if (data.type !== 'signal') return;

      const { sdp, candidate } = data.payload;

      if (sdp) {
        if (sdp.type === 'offer') {
          setStatus('Incoming call... ❤️');
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          sendSignal({ sdp: answer });
        } else if (sdp.type === 'answer') {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          setStatus('Call connected 💞');
        }
      }

      if (candidate) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + err.message);
    }
  };

  const sendSignal = (payload) => {
    wsRef.current.send(JSON.stringify({ type: 'signal', room, payload }));
  };

  return (
    <div className="app-container">
      <h1 className="app-heading">For my Sweetheart Tuku tuku tuku.....💖</h1>
      <p className="app-status">Status: {status}</p>

      {!joined ? (
        <div className="app-join-section">
          <input
            className="app-input"
            placeholder="Enter Room Code"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button className="app-button" onClick={joinRoom}>
            Join Room
          </button>
        </div>
      ) : (
        <div className="app-call-section">
          <button className="app-button app-call-button" onClick={call}>
            Start Call 📞
          </button>
        </div>
      )}

      <audio ref={remoteAudioRef} autoPlay controls className="app-audio" />
    </div>
  );
}

export default App;
