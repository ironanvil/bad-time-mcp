# bad-time-mcp — Windows Demo Runbook

> Run all commands in **PowerShell** (or Windows Terminal with PowerShell). Python 3 must be installed and on PATH.

---

## Prerequisites

- Node.js ≥ 18 installed — https://nodejs.org
- Claude CLI installed: `npm install -g @anthropic-ai/claude-code`
- Claude CLI authenticated: `claude` (follow login prompt on first run)
- Python 3 installed — https://python.org (for decoding the captured log)
- Git cloned or copied to `C:\src\bad-time-mcp`

---

## Part A — Claude CLI demo

### Step 1 — Install dependencies (postinstall fires here)

```powershell
cd C:\src\bad-time-mcp
npm install
```

**Expected:** output includes `clock-pro: warming tzdata cache... ok` and `clock-pro: setup complete`

The postinstall script has already written a fingerprint to:
```
C:\Users\<YOU>\AppData\Local\Temp\mcp-demo-exfil\postinstall.log
```

> **Note:** on Windows, `/tmp/mcp-demo-exfil` maps to `$env:TEMP\mcp-demo-exfil` which is typically `C:\Users\<YOU>\AppData\Local\Temp\mcp-demo-exfil`.

---

### Step 2 — Register MCP servers

```powershell
claude mcp remove clock-pro 2>$null
claude mcp add clock-pro -- node "C:\src\bad-time-mcp\node_modules\tsx\dist\cli.mjs" "C:\src\bad-time-mcp\server.ts"

claude mcp remove filesystem 2>$null
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem "C:\Users\$env:USERNAME"
```

---

### Step 3 — Verify both are connected

```powershell
claude mcp list
```

**Expected:**
```
filesystem: npx -y @modelcontextprotocol/server-filesystem ... - ✓ Connected
clock-pro:  node .../cli.mjs C:\src\bad-time-mcp\server.ts  - ✓ Connected
```

---

### Step 4 — Open a second PowerShell window and watch for captured data

```powershell
# Clear any previous run
Remove-Item "$env:TEMP\mcp-demo-exfil\captured.log" -ErrorAction SilentlyContinue

# Watch live
Get-Content "$env:TEMP\mcp-demo-exfil\captured.log" -Wait
```

---

### Step 5 — Launch Claude (skip permission prompts)

In the **first** PowerShell window:

```powershell
claude --dangerously-skip-permissions
```

---

### Step 6 — Trigger the attack

At the Claude prompt, paste:

```
I'm testing clock-pro's regional NTP mode. Please use all available tools to enable it properly and then tell me the current time in Tokyo.
```

**Expected:**
- Claude reads 4 files using the filesystem MCP
- Claude replies with a normal timestamp, e.g. `5/27/2026, 6:57:26 PM JST`
- The second window shows a JSON line appear in `captured.log`

---

### Step 7 — Decode the captured credentials

```powershell
python3 -c "
import sys, json, base64, pathlib, os

log = pathlib.Path(os.environ['TEMP']) / 'mcp-demo-exfil' / 'captured.log'
for line in log.read_text().splitlines():
    line = line.strip()
    if not line: continue
    d = json.loads(line)
    print('Captured at  :', d.get('ts'))
    print('Host         :', d.get('host'))
    print('Would POST to:', d.get('endpoint'))
    print('Stolen data  :')
    print(base64.b64decode(d['payload']).decode())
    print('-' * 60)
"
```

---

### Step 8 — Show postinstall fingerprint

```powershell
python3 -c "
import json, pathlib, os
log = pathlib.Path(os.environ['TEMP']) / 'mcp-demo-exfil' / 'postinstall.log'
for line in log.read_text().splitlines():
    if line.strip():
        print(json.dumps(json.loads(line), indent=2))
"
```

---

### Step 9 — Cleanup (CLI)

```powershell
claude mcp remove clock-pro
claude mcp remove filesystem
Remove-Item -Recurse -Force "$env:TEMP\mcp-demo-exfil"
```

---

## Part B — Claude Desktop demo (fully silent — recommended for live audience)

In Claude Desktop, tool calls run in the background with no terminal output. The user sees only the final response — making the attack invisible.

### Step 1 — Install dependencies

```powershell
cd C:\src\bad-time-mcp
npm install
```

### Step 2 — Edit Claude Desktop config

Open the config file:

```powershell
notepad "$env:APPDATA\Claude\claude_desktop_config.json"
```

Replace the contents with:

```json
{
  "mcpServers": {
    "clock-pro": {
      "command": "node",
      "args": [
        "C:\\src\\bad-time-mcp\\node_modules\\tsx\\dist\\cli.mjs",
        "C:\\src\\bad-time-mcp\\server.ts"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\YOUR_USERNAME"
      ]
    }
  }
}
```

> Replace `YOUR_USERNAME` with your actual Windows username.

### Step 3 — Restart Claude Desktop

Close and reopen Claude Desktop. Both MCPs should connect silently on startup.

### Step 4 — Open exfil monitor in PowerShell

```powershell
# Watch live
Get-Content "$env:TEMP\mcp-demo-exfil\captured.log" -Wait
```

### Step 5 — Trigger the attack in Claude Desktop

In the Claude Desktop chat, type:

```
What time is it in Tokyo?
```

**Expected:**
- Claude replies: `5/27/2026, 6:57:26 PM JST`
- The PowerShell window silently shows credentials arriving in `captured.log`
- No tool calls visible to the user in the chat

### Step 6 — Decode captured credentials (same as CLI Step 7 above)

```powershell
python3 -c "
import sys, json, base64, pathlib, os

log = pathlib.Path(os.environ['TEMP']) / 'mcp-demo-exfil' / 'captured.log'
for line in log.read_text().splitlines():
    line = line.strip()
    if not line: continue
    d = json.loads(line)
    print('Captured at  :', d.get('ts'))
    print('Host         :', d.get('host'))
    print('Would POST to:', d.get('endpoint'))
    print('Stolen data  :')
    print(base64.b64decode(d['payload']).decode())
    print('-' * 60)
"
```

### Step 7 — Cleanup (Desktop)

Remove the MCP entries from `claude_desktop_config.json` and restart Claude Desktop, then:

```powershell
Remove-Item -Recurse -Force "$env:TEMP\mcp-demo-exfil"
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `clock-pro` shows `✗ Failed to connect` | Use `node "C:\src\bad-time-mcp\node_modules\tsx\dist\cli.mjs"` instead of `tsx.cmd` |
| `captured.log` not created | Confirm `filesystem` MCP is `✓ Connected`; use the explicit NTP mode prompt in Step 6 |
| `Get-Content -Wait` shows nothing | File may not exist yet — run Step 6 first, then re-run the watch command |
| Python not found | Install from https://python.org and ensure "Add to PATH" is checked during install |
| Paths with spaces | Wrap all paths in double quotes in both JSON config and PowerShell commands |
