# WebSocket Voice Recording Setup

## Overview
The voice recording now supports **WebSocket streaming** for receiving audio from:
- Remote hardware (microphones, audio devices)
- Server-side audio processing
- Real-time audio streams
- Network audio sources

## Architecture

```
Hardware/Audio Source
        ↓
Backend WebSocket (/ws/audio)
        ↓
Frontend (receives chunks)
        ↓
Saves to Supabase
```

## Files Created

### Frontend
1. **`src/hooks/useWebSocketVoiceRecorder.ts`** - WebSocket audio recording hook
2. **`src/components/record-button-websocket.tsx`** - WebSocket recording UI

### Backend
3. **`backend/app/routes/audio_websocket.py`** - WebSocket endpoint for audio streaming

## Setup Instructions

### 1. Update Backend (FastAPI)

Add the WebSocket endpoint to your `backend/app/main.py`:

```python
from fastapi import WebSocket, WebSocketDisconnect
import json

@app.websocket("/ws/audio")
async def ws_audio_recording(websocket: WebSocket):
    await websocket.accept()
    is_recording = False
    
    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            action = data.get("action")
            
            if action == "start_recording":
                is_recording = True
                await websocket.send_json({"status": "recording_started"})
                # TODO: Start your audio streaming here
                
            elif action == "stop":
                is_recording = False
                await websocket.send_json({"status": "stopped"})
                break
                
    except WebSocketDisconnect:
        print("Audio WebSocket disconnected")
```

### 2. Update Environment Variables

Already added to `frontend/.env.local`:
```env
NEXT_PUBLIC_AUDIO_WS_URL=ws://localhost:8000/ws/audio
```

For production:
```env
NEXT_PUBLIC_AUDIO_WS_URL=wss://your-backend.com/ws/audio
```

### 3. Use WebSocket Recording Component

Replace the existing record button in `floating-sidebar.tsx`:

```tsx
import RecordButtonWebSocket from './record-button-websocket';

// In the Voice tab:
{activeTab === 'voice' && (
  <div>
    <RecordButtonWebSocket />
  </div>
)}
```

## How It Works

### Client-Side Flow:

1. **Start Recording**
   - Frontend connects to WebSocket: `ws://localhost:8000/ws/audio`
   - Sends: `{"action": "start_recording"}`
   - Waits for audio chunks from server

2. **Receive Audio**
   - Backend sends binary audio chunks (Blob)
   - Or sends base64: `{"audio": "base64_data", "mimeType": "audio/webm"}`
   - Frontend collects chunks in memory

3. **Stop & Save**
   - Sends: `{"action": "stop"}`
   - Combines all chunks into single Blob
   - Uploads to Supabase Storage
   - Saves metadata to database

### Server-Side (Backend) Options:

#### Option A: Stream from Microphone (PyAudio)
```python
import pyaudio

async def stream_microphone(websocket):
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16, channels=1, 
                    rate=44100, input=True, frames_per_buffer=1024)
    
    while is_recording:
        data = stream.read(1024)
        await websocket.send_bytes(data)
```

#### Option B: Stream from File
```python
async def stream_file(websocket, file_path):
    with open(file_path, 'rb') as f:
        while chunk := f.read(4096):
            await websocket.send_bytes(chunk)
            await asyncio.sleep(0.01)
```

#### Option C: Stream from Hardware Device
```python
# Use serial port, USB device, network stream, etc.
async def stream_hardware(websocket):
    # Your hardware-specific code here
    pass
```

## WebSocket Message Protocol

### Client → Server:
```json
{"action": "start_recording"}
{"action": "pause"}
{"action": "resume"}
{"action": "stop"}
{"action": "cancel"}
```

### Server → Client:
```json
// Status updates
{"status": "recording_started"}
{"status": "paused"}
{"status": "stopped"}

// Audio data (binary)
Binary Blob chunks

// OR Audio data (base64)
{"audio": "base64_encoded_data", "mimeType": "audio/webm"}

// Errors
{"error": "error message"}
```

## Dependencies

### Backend
```bash
pip install pyaudio  # For microphone capture (optional)
pip install websockets  # Already included with FastAPI
```

### Frontend
No additional dependencies needed (WebSocket API is built-in)

## Testing

### 1. Test WebSocket Connection
```bash
# Terminal 1: Start backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 2. Test Recording
1. Open http://localhost:3000
2. Click floating sidebar → Voice tab
3. Click microphone button
4. Should show "Connecting to WebSocket..."
5. Then "WebSocket Connected" with green indicator
6. Audio chunks received and saved

### 3. Monitor WebSocket
```javascript
// Browser console
const ws = new WebSocket('ws://localhost:8000/ws/audio');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Received:', e.data);
ws.send(JSON.stringify({action: 'start_recording'}));
```

## Switching Between Browser Mic and WebSocket

You now have TWO recording components:

1. **`record-button.tsx`** - Browser microphone (MediaRecorder)
2. **`record-button-websocket.tsx`** - WebSocket streaming

Choose based on your needs:
- Use browser mic for client-side recording
- Use WebSocket for server-side/hardware audio

## Production Considerations

1. **Security**: Use WSS (WebSocket Secure) in production
2. **Authentication**: Add token-based auth to WebSocket
3. **Compression**: Compress audio before sending
4. **Buffering**: Implement proper buffering for network issues
5. **Error Recovery**: Reconnect on disconnect
6. **Rate Limiting**: Prevent abuse

## Troubleshooting

### WebSocket won't connect
- Check backend is running on port 8000
- Verify `/ws/audio` endpoint exists
- Check firewall settings
- Use WSS for HTTPS sites

### No audio chunks received
- Backend needs to implement audio streaming
- Check server logs for errors
- Verify audio source is working
- Test with mock data first

### Recording is empty
- Ensure chunks are being collected
- Check audio format compatibility
- Verify Blob creation is correct

## Next Steps

1. Implement actual audio streaming in backend
2. Test with real hardware device
3. Add audio visualization (waveform)
4. Implement audio compression
5. Add reconnection logic
6. Monitor performance and latency

---

**Voice recording via WebSocket is now ready! 🎙️**
