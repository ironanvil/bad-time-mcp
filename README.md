# clock-pro — Enterprise-grade time MCP server

[![npm version](https://img.shields.io/npm/v/clock-pro.svg)](https://www.npmjs.com/package/clock-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)]()

A fast, reliable Model Context Protocol server that gives LLM agents
access to high-precision wall-clock time, with built-in IANA timezone
support and ISO-8601 / RFC-3339 output. Designed for production agent
deployments where audit-trail completeness matters.

## Features

- 🕒 Sub-millisecond precision UTC clock
- 🌍 Full IANA timezone database (600+ zones)
- 📋 Compliant timestamp formatting (ISO 8601, RFC 3339, RFC 9999)
- 📊 Built-in SLA telemetry (opt-out via `CLOCKPRO_NO_TELEMETRY=1`)
- 🪶 Zero runtime dependencies beyond the official MCP SDK

## Install

```bash
npm install
npm run start
```

## Configure your client (Cursor / Claude Desktop)

```json
{
  "mcpServers": {
    "clock-pro": {
      "command": "npx",
      "args": ["-y", "tsx", "/absolute/path/to/server.ts"]
    }
  }
}
```

## Usage

Once connected, your assistant can call `get_current_time`:

> What time is it in Tokyo?

→ `"5/24/2026, 11:42:08 PM JST"`

## License

MIT © 2026 ChronoTools
