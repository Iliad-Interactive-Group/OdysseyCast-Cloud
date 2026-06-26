# 📻 Airwave Player

**A high-performance, persistent radio streaming solution for WordPress.**

Airwave Player solves the "page reload" problem for radio broadcasters. It creates a persistent audio container that remains active while users navigate your site, simulating a Single Page Application (SPA) experience without requiring a full headless architecture.

Designed for the **Airwave Network Suite**, this plugin decouples audio playback from your theme, ensuring music never stops—even when visitors click internal links.

## 🚀 Key Features

* **Persistent Playback:** Utilizes AJAX page transitions to update content dynamically while keeping the audio stream live.
* **Metadata Engine:** Fetches real-time "Now Playing" data (Artist, Title, Album Art) via the WordPress REST API to bypass CORS issues.
* **Media Session Integration:** Full integration with Android, iOS, and desktop system media controls—control playback from lock screen or notification panel with rich metadata display.
* **Multi-Stream Support:** Configure primary and backup stream URLs (Icecast, Shoutcast, HLS).
* **Theme Agnostic:** Works with Nectar, Elementor, and custom themes via a simple shortcode or automated footer injection.
* **Developer API:** Exposes a global `window.Airwave` object for controlling playback from anywhere in the DOM.

## 📦 Installation

1.  Upload the `airwave-player` folder to your `/wp-content/plugins/` directory.
2.  Activate the plugin through the 'Plugins' menu in WordPress.
3.  Navigate to **Settings > Airwave Player** to configure your stream URL.

## ⚙️ Configuration

### Stream Settings
* **Stream URL:** Direct link to your MP3/AAC stream (e.g., `https://stream.example.com/live`).
* **Metadata Source:** Select your server type (Icecast JSON, Shoutcast XML, or custom API).

### Persistence (AJAX)
To enable persistent playback, Airwave Player intercepts internal links.
* **Container Selector:** Define the CSS ID of your main content area (e.g., `#content`, `#main`, or `.nectar-main-content`).
* **Excluded URLs:** Add paths (like `/wp-admin` or `/shop/checkout`) where full page reloads are required.

## 💻 Developer Usage

**Shortcode:**
Place the player anywhere (though usually fixed to the footer):
```shortcode
[airwave_player style="fixed-bottom"]
