---
description: Copy text to your clipboard
argument-hint: "<text>"
---
Copy "$@" to my clipboard. Use the right method for the system: xclip (X11), wl-copy (Wayland), pbcopy (macOS), OSC 52 (SSH/tmux, and enough for Termux). If none are available, warn me. Check it copies exactly, and tell me if it fails.
