# GPS/Maps Feature Documentation

## Overview
Real-time GPS tracking and mapping functionality that shows device/person location on an interactive map.

## Features Implemented

### 1. **Real-Time GPS Tracking**
- ✅ Browser Geolocation API integration
- ✅ High accuracy positioning
- ✅ Continuous location updates
- ✅ Error handling and permissions

### 2. **Interactive Map (Leaflet)**
- ✅ OpenStreetMap tile layer
- ✅ Custom location marker with heading indicator
- ✅ Accuracy circle visualization
- ✅ Zoom and pan controls
- ✅ Path tracking (breadcrumb trail)

### 3. **Map Controls**
- ✅ Start/Stop tracking button
- ✅ Center on location button
- ✅ Follow mode (auto-center)
- ✅ Show/hide path trail
- ✅ Clear path button

### 4. **Location Data Display**
- ✅ Latitude/Longitude coordinates
- ✅ Accuracy radius (±meters)
- ✅ Speed (km/h)
- ✅ Heading/direction indicator
- ✅ Real-time updates

### 5. **Database Integration**
- ✅ Save locations to Supabase
- ✅ Manual save button
- ✅ Auto-save option (can be enabled)
- ✅ Location history in History Panel

## Files Created/Modified

### Frontend
1. **`src/hooks/useGPSTracker.ts`** - GPS tracking hook
2. **`src/components/map.tsx`** - Enhanced map component
3. **`.env.local`** - Added GPS WebSocket URL

### Backend
4. **`backend/app/routes/gps_websocket.py`** - GPS WebSocket endpoint (optional)

## Usage

### Basic GPS Tracking (Browser-based)

The map now uses the browser's built-in GPS:

1. Open the **Maps tab** in floating sidebar
2. Click **Navigation button** (blue) to start tracking
3. Browser will request location permission
4. Your location appears on the map with blue marker
5. Click **Save Location** to store in database

### Map Controls

| Button | Icon | Function |
|--------|------|----------|
| Navigation (Blue) | 🧭 | Start/Stop GPS tracking |
| Crosshair (White) | ⊕ | Center map on current location |
| Map Pin (Green/White) | 📍 | Toggle follow mode (auto-center) |
| Show Path | - | Display movement trail |
| Clear | - | Remove path trail |
| Save Location | 💾 | Save current GPS to database |

### Display Information

The info panel shows:
- **Latitude**: Decimal degrees (6 decimals)
- **Longitude**: Decimal degrees (6 decimals)
- **Accuracy**: Circle radius in meters
- **Speed**: Current speed in km/h (if available)
- **Save Status**: Confirmation when saved

## Location Data Flow

```
Browser Geolocation API
        ↓
useGPSTracker Hook
        ↓
MapComponent
        ↓
Leaflet Map Display
        ↓
Save to Supabase (manual/auto)
        ↓
History Panel
```

## GPS Tracking Modes

### Mode 1: Browser GPS (Default - Currently Active)
- Uses `navigator.geolocation.watchPosition()`
- Works on phones, tablets, laptops with GPS
- No backend needed
- Automatic updates every few seconds

### Mode 2: WebSocket GPS (Server-Side - Optional)
For hardware devices or server-side GPS:

1. Uncomment GPS WebSocket code in backend
2. Connect GPS hardware to server
3. Stream location updates via WebSocket
4. Frontend receives real-time positions

## Database Schema

Locations are saved to `gps_logs` table:

```sql
CREATE TABLE gps_logs (
  id BIGSERIAL PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

## Configuration Options

### In `useGPSTracker` hook:

```typescript
const gps = useGPSTracker({
  enableHighAccuracy: true,  // Use GPS instead of WiFi/cell
  timeout: 10000,            // Timeout in ms
  maximumAge: 0,             // Don't use cached position
  autoStart: false,          // Manual start
  trackingInterval: 5000,    // Update every 5 seconds
});
```

### Map Settings:

```typescript
// In map.tsx
const defaultCenter = [14.5995, 120.9842]; // Manila
const defaultZoom = 13;
```

## Advanced Features

### 1. Auto-Save Locations
Enable automatic saving every N seconds:

```typescript
// Add to map.tsx
useEffect(() => {
  if (isTracking && position) {
    const interval = setInterval(handleSaveLocation, 30000); // Every 30 sec
    return () => clearInterval(interval);
  }
}, [isTracking, position]);
```

### 2. Geofencing
Trigger alerts when entering/leaving areas:

```typescript
const isInGeofence = (lat: number, lon: number, center: [number, number], radius: number) => {
  const distance = calculateDistance(lat, lon, center[0], center[1]);
  return distance <= radius;
};
```

### 3. Path History
Load and display previous paths:

```typescript
const loadPreviousPaths = async () => {
  const { data } = await supabase
    .from('gps_logs')
    .select('*')
    .order('timestamp', { ascending: true });
  
  // Draw on map
};
```

## Testing

### 1. Desktop Browser Testing
- Modern browsers provide approximate location
- May not be as accurate as mobile devices
- Use Chrome/Firefox for best compatibility

### 2. Mobile Device Testing
- More accurate GPS readings
- Better speed and heading data
- Test in different environments (indoor/outdoor)

### 3. Simulate Location (Chrome DevTools)
1. Open DevTools (F12)
2. Press `Ctrl+Shift+P` → "Sensors"
3. Set custom latitude/longitude
4. Test without physical movement

## Troubleshooting

### "Location permission denied"
- Check browser location settings
- Enable location services on device
- HTTPS required in production

### "Location information unavailable"
- GPS signal weak (indoor)
- Device doesn't have GPS
- Try WiFi/cellular positioning

### Map not showing
- Check Leaflet CSS is loaded
- Verify map container has height
- Check console for errors

### Marker not updating
- Ensure tracking is started
- Check position updates in hook
- Verify follow mode is enabled

## Hardware GPS Integration

For connecting physical GPS modules:

### Option 1: USB GPS Module
```bash
# Install dependencies
pip install pyserial pynmea2

# Read from /dev/ttyUSB0
python gps_reader.py
```

### Option 2: Bluetooth GPS
```bash
# Pair device via Bluetooth
# Forward data to WebSocket
```

### Option 3: Network GPS (GPSD)
```bash
# Install gpsd
sudo apt-get install gpsd gpsd-clients

# Python client
pip install gps
```

## Performance Optimization

1. **Throttle Updates**: Limit map redraws
2. **Reduce Accuracy**: Use `enableHighAccuracy: false` for battery
3. **Path Simplification**: Reduce path points for long trails
4. **Tile Caching**: Cache map tiles offline

## Security Considerations

1. **HTTPS Only**: Geolocation requires secure context
2. **Permission Handling**: Request user consent
3. **Data Privacy**: Store minimal location data
4. **Rate Limiting**: Prevent GPS log spam

## Future Enhancements

- [ ] Offline map tiles
- [ ] Route planning
- [ ] Location sharing
- [ ] Heat maps
- [ ] Clustering for many points
- [ ] Custom map styles
- [ ] Elevation profile
- [ ] Distance calculations
- [ ] Location-based alerts
- [ ] Export GPX/KML files

---

**GPS/Maps feature is fully functional! 🗺️**
