# Media Session API Integration

## Overview

The Airwave Player now includes full integration with the [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API), enabling rich media controls on Android, iOS, and desktop platforms.

## Features

### 1. System Media Controls
- **Lock Screen Integration**: Song information and playback controls appear on device lock screens
- **Notification Panel**: Users can control playback from the notification panel without opening the app
- **Desktop Integration**: Works with media keys and system media controls on desktop browsers

### 2. Rich Metadata Display
The integration automatically displays:
- **Song Title**: Current track title
- **Artist Name**: Current artist/station name
- **Album Artwork**: Cover art (when available)
- **Album Name**: Shows "Live Stream" to indicate live radio

### 3. Playback Controls
Supported media control actions:
- **Play**: Resume playback from lock screen or notification
- **Pause**: Pause playback from lock screen or notification

## Technical Implementation

### Main Player Integration
The Media Session API is integrated into the main sticky bar player (`#airwave-bar-audio`) with automatic metadata updates every 15 seconds or when the song changes.

### Popout Player Integration
The popout window also includes full Media Session API support, allowing users to control the standalone player from their device's system controls.

### Browser Compatibility
The Media Session API is supported on:
- **Android**: Chrome 57+, Edge 79+
- **iOS**: Safari 15.4+
- **Desktop**: Chrome 73+, Edge 79+, Safari 15.4+

The implementation includes proper feature detection (`if ('mediaSession' in navigator)`) to ensure graceful degradation on unsupported browsers.

## Testing

### Standalone Test File
A standalone test file (`test-media-session.html`) is included in the repository for testing the Media Session API independently of WordPress.

To use the test file:
1. Open `test-media-session.html` in a web browser on your mobile device or desktop
2. Click "Play Test Audio" to start playback
3. On mobile: Lock your device and check the lock screen for media controls
4. On desktop: Look for media controls in your browser or system
5. Test the play/pause controls from the system controls
6. Click "Update Metadata" to see metadata changes reflected in the system controls

### On Mobile (Android/iOS)
1. Load your WordPress site with Airwave Player active
2. Start playing audio by clicking the play button
3. Lock your device or pull down the notification panel
4. Verify that song title, artist, and artwork are displayed
5. Test play/pause controls from the lock screen

### On Desktop
1. Load your WordPress site with Airwave Player active
2. Start playing audio by clicking the play button
3. Use hardware media keys (if available) or browser media controls
4. Verify that metadata is displayed in browser controls
5. Test play/pause functionality

## Code Changes

The implementation adds:
- `updateMediaSession(data)` function to update metadata
- Integration with existing `poll()` function for automatic updates every 15 seconds
- Play/pause action handlers registered once on initialization for system controls
- Multiple artwork sizes (512x512, 256x256, 128x128) for optimal display across devices
- Automatic MIME type detection for artwork to support all image formats (PNG, JPEG, WebP, etc.)

## Performance Optimizations

- Action handlers are registered **only once** during initialization (not on every metadata update)
- MIME type is omitted from artwork metadata to allow browser auto-detection
- Feature detection ensures no overhead on unsupported browsers

## Future Enhancements

Potential future improvements:
- Previous/Next track handlers (for stations with scheduled programming)
- Seek handlers (if applicable)
- Additional action handlers (e.g., stop, seekbackward, seekforward)
- Integration with Shoutcast/Icecast metadata protocols for real-time updates
