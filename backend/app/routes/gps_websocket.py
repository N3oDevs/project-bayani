"""
WebSocket GPS/Location Tracking Endpoint for FastAPI
Receives GPS coordinates from hardware device or external source
"""

from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
from typing import Dict, Optional

# Add to your main.py
@app.websocket("/ws/gps")
async def ws_gps_tracking(websocket: WebSocket):
    """
    WebSocket endpoint for GPS location streaming
    
    Expected messages from server/hardware:
    {
        "latitude": 14.5995,
        "longitude": 120.9842,
        "accuracy": 10.5,
        "altitude": 15.0,
        "speed": 2.5,
        "heading": 180.0,
        "timestamp": 1234567890
    }
    
    Client can send control messages:
    - {"action": "start_tracking"}
    - {"action": "stop_tracking"}
    """
    await websocket.accept()
    
    is_tracking = False
    
    try:
        while True:
            # Receive messages from client or send location updates
            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=0.1
                )
                
                data = json.loads(message)
                action = data.get("action")
                
                if action == "start_tracking":
                    is_tracking = True
                    await websocket.send_json({"status": "tracking_started"})
                    # Start sending GPS data
                    asyncio.create_task(stream_gps_location(websocket, lambda: is_tracking))
                    
                elif action == "stop_tracking":
                    is_tracking = False
                    await websocket.send_json({"status": "tracking_stopped"})
                    
            except asyncio.TimeoutError:
                # No message received, continue
                if is_tracking:
                    # Send periodic location update if needed
                    pass
                    
    except WebSocketDisconnect:
        print("GPS WebSocket disconnected")
    except Exception as e:
        print(f"GPS WebSocket error: {e}")
        await websocket.send_json({"error": str(e)})


async def stream_gps_location(websocket: WebSocket, should_continue):
    """
    Stream GPS location updates to the client
    Replace this with your actual GPS source (hardware device, GPS module, etc.)
    """
    try:
        while should_continue():
            # PLACEHOLDER: Replace with actual GPS data source
            # Example options:
            # 1. Read from GPS hardware module (UART, USB, Serial)
            # 2. Receive from external API
            # 3. Get from mobile device
            # 4. Parse NMEA sentences from GPS receiver
            
            # Example GPS data (replace with real data)
            gps_data = {
                "latitude": 14.5995,  # Your actual latitude
                "longitude": 120.9842,  # Your actual longitude
                "accuracy": 10.5,  # Accuracy in meters
                "altitude": 15.0,  # Altitude in meters (optional)
                "speed": 0.0,  # Speed in m/s (optional)
                "heading": None,  # Heading in degrees (optional)
                "timestamp": int(time.time() * 1000)
            }
            
            # Send location update to client
            await websocket.send_json(gps_data)
            
            # Wait before next update (adjust based on your needs)
            await asyncio.sleep(2)  # Update every 2 seconds
            
    except Exception as e:
        print(f"Error streaming GPS: {e}")


# Optional: GPS hardware integration examples

"""
# Example 1: Using serial port for GPS module (e.g., Neo-6M, Neo-7M)
import serial
import pynmea2

def read_gps_from_serial(port='/dev/ttyUSB0', baudrate=9600):
    ser = serial.Serial(port, baudrate, timeout=1)
    
    while True:
        line = ser.readline().decode('ascii', errors='replace')
        
        if line.startswith('$GPGGA') or line.startswith('$GPRMC'):
            try:
                msg = pynmea2.parse(line)
                return {
                    "latitude": msg.latitude,
                    "longitude": msg.longitude,
                    "altitude": getattr(msg, 'altitude', None),
                    "speed": getattr(msg, 'spd_over_grnd', None),
                }
            except:
                continue


# Example 2: Using gpsd daemon
import gps

def read_gps_from_gpsd():
    session = gps.gps(mode=gps.WATCH_ENABLE)
    
    for report in session:
        if report['class'] == 'TPV':
            return {
                "latitude": getattr(report, 'lat', None),
                "longitude": getattr(report, 'lon', None),
                "altitude": getattr(report, 'alt', None),
                "speed": getattr(report, 'speed', None),
                "heading": getattr(report, 'track', None),
            }


# Example 3: Mock GPS for testing (simulates movement)
import time
import random

def mock_gps_data(start_lat=14.5995, start_lon=120.9842):
    # Simulate slight movement
    lat_offset = random.uniform(-0.001, 0.001)
    lon_offset = random.uniform(-0.001, 0.001)
    
    return {
        "latitude": start_lat + lat_offset,
        "longitude": start_lon + lon_offset,
        "accuracy": random.uniform(5, 15),
        "altitude": random.uniform(10, 20),
        "speed": random.uniform(0, 5),
        "heading": random.uniform(0, 360),
        "timestamp": int(time.time() * 1000)
    }
"""
