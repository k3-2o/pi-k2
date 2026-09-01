---
description: Copy text to your clipboard
argument-hint: "<text>"
---
Copy "$@" to my clipboard. Do it in this order:

1. OSC 52 (works everywhere: local, SSH, tmux, no clipboard tool needed). Emit the escape sequence with the text base64-encoded. Inside tmux ($TMUX set), wrap it in the passthrough prefix \033Ptmux; and unquote it properly.
2. Only if OSC 52 visibly does nothing, fall back to: wl-copy (Wayland), pbcopy (macOS), xclip -selection clipboard (X11). ALWAYS run xclip/wl-copy with a timeout (timeout 3 ...) — xclip hangs forever when no clipboard daemon owns the selection.
3. Never paste the text back to "verify" — just emit the sequence and say it's on the clipboard. Tell me only if every method failed.
