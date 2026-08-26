"""pi — pi's native tools (read, bash, write, edit, grep, ls, find) from the REPL."""

helper_description = """pi — pi's native file and shell tools from Python, with pi's own semantics:
pi.read(path, offset?, limit?) — read file contents; text and images; output capped at 2000 lines / 50KB; use offset/limit for large files.
pi.bash(command, timeout?) — shell command in the session cwd; returns stdout+stderr; truncated to 2000 lines / 50KB (full output to a temp file, path in details if truncated); raises on non-zero exit.
pi.write(path, content) — write a file: creates if missing, overwrites if present, creates parent directories; for new files or complete rewrites.
pi.edit(path, edits) — exact-text replacement edits; every oldText must match a unique, non-overlapping region of the file; merge nearby changes into one edit. edits = [(old_text, new_text), ...] or [{"oldText": ..., "newText": ...}].
pi.grep(pattern, path?, glob?, ignoreCase?, literal?, context?, limit?) — regex or literal search; returns path:line matches; respects .gitignore; capped at 100 matches.
pi.ls(path?, limit?) — list directory entries alphabetically ('/' suffix for directories, dotfiles included).
pi.find(pattern, path?, limit?) — find files by glob pattern ("*.ts", "**/*.json"); respects .gitignore; capped at 1000 results.
pi.raw(tool, **params) — call any tool directly and get the full reply dict (content, details, isError).
Errors raise PiBridgeError with pi's message.
Instead of: hand-rolled subprocess/pathlib plumbing in every cell."""

import json
import os
import socket
import time as _time
import uuid

SOCKET_ENV = "PI_BRIDGE_SOCK"


class PiBridgeError(RuntimeError):
    """A bridge tool call failed (mirrors a pi tool error)."""


class _Pi:
    def __init__(self):
        self._path = None

    # -- transport -----------------------------------------------------------
    @property
    def _sock_path(self):
        if self._path is None:
            self._path = os.environ.get(SOCKET_ENV)
        return self._path

    def _call(self, tool, params):
        path = self._sock_path
        if not path:
            raise PiBridgeError(
                "pi bridge unavailable: %s not set. "
                "Start pi with --repl and /reload to load the pi-bridge extension." % SOCKET_ENV
            )
        req = {"id": uuid.uuid4().hex, "tool": tool, "params": params}
        body = json.dumps(req).encode("utf-8") + b"\n"
        # The kernel may briefly come up before the bridge socket exists; retry.
        last_err = None
        for attempt in range(3):
            try:
                s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
                try:
                    s.connect(path)
                except OSError:
                    s.close()
                    raise
                break
            except OSError as exc:
                last_err = exc
                s = None
                _time.sleep(0.1 * (attempt + 1))
        else:
            raise PiBridgeError("cannot connect to pi bridge %s: %s" % (path, last_err))
        try:
            s.sendall(body)
            buf = b""
            while b"\n" not in buf:
                chunk = s.recv(65536)
                if not chunk:
                    break
                buf += chunk
        finally:
            s.close()
        if not buf:
            raise PiBridgeError("pi bridge closed without a response (cell aborted?)")
        return json.loads(buf.split(b"\n", 1)[0])

    # -- result helpers ------------------------------------------------------
    def _text(self, res):
        if not res.get("ok"):
            raise PiBridgeError(res.get("error") or "bridge error")
        blocks = res.get("content") or []
        return "".join(
            b.get("text", "")
            for b in blocks
            if isinstance(b, dict) and b.get("type") == "text"
        )

    def raw(self, tool, **params):
        """Call any bridge tool and return the full reply dict (details, isError, ...)."""
        return self._call(tool, params)

    def _details(self, res):
        return res.get("details") or {}

    # -- tools (param names match pi's native tool schemas) -------------------
    def read(self, path, offset=None, limit=None):
        """Read a file. Returns its text content (whole, capped like pi's read)."""
        params = {"path": path}
        if offset is not None:
            params["offset"] = offset
        if limit is not None:
            params["limit"] = limit
        return self._text(self._call("read", params))

    def bash(self, command, timeout=None):
        """Run a shell command in the session cwd. Returns stdout+stderr text."""
        params = {"command": command}
        if timeout is not None:
            params["timeout"] = timeout
        res = self._call("bash", params)
        text = self._text(res)
        if res.get("isError") or int(self._details(res).get("exitCode") or 0) != 0:
            raise PiBridgeError(text or ("command failed (exit %s)" % self._details(res).get("exitCode")))
        return text

    def write(self, path, content):
        """Write a file (creates parents, overwrites). Returns pi's confirmation text."""
        return self._text(self._call("write", {"path": path, "content": content}))

    def edit(self, path, edits):
        """Apply exact-match targeted edits. edits is a list of (old_text, new_text)
        pairs or {"oldText": ..., "newText": ...} dicts; every oldText must be
        unique in the file and edits must not overlap or nest."""
        normalized = []
        for e in edits:
            if isinstance(e, dict):
                normalized.append(e)
            else:
                old_text, new_text = e
                normalized.append({"oldText": old_text, "newText": new_text})
        return self._text(self._call("edit", {"path": path, "edits": normalized}))

    def grep(self, pattern, path=None, glob=None, ignoreCase=False, literal=False, context=None, limit=None):
        """Search file contents (regex or literal); respects .gitignore."""
        params = {"pattern": pattern}
        if path is not None:
            params["path"] = path
        if glob is not None:
            params["glob"] = glob
        if ignoreCase:
            params["ignoreCase"] = True
        if literal:
            params["literal"] = True
        if context is not None:
            params["context"] = context
        if limit is not None:
            params["limit"] = limit
        return self._text(self._call("grep", params))

    def ls(self, path=None, limit=None):
        """List a directory (default: cwd). Returns the formatted listing."""
        params = {}
        if path is not None:
            params["path"] = path
        if limit is not None:
            params["limit"] = limit
        return self._text(self._call("ls", params))

    def find(self, pattern, path=None, limit=None):
        """Find files by glob pattern (e.g. '**/*.json'); respects .gitignore."""
        params = {"pattern": pattern}
        if path is not None:
            params["path"] = path
        if limit is not None:
            params["limit"] = limit
        return self._text(self._call("find", params))


pi = _Pi()
