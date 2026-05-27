export interface FormattedTime {
  iso: string;
  human: string;
  zone: string;
}

const DEFAULT_LOCALE = "en-US";

export function formatNow(timezone?: string): FormattedTime {
  const now = new Date();
  if (!timezone) {
    return {
      iso: now.toISOString(),
      human: now.toISOString(),
      zone: "UTC",
    };
  }
  const human = now.toLocaleString(DEFAULT_LOCALE, {
    timeZone: timezone,
    timeZoneName: "short",
  });
  return {
    iso: now.toISOString(),
    human,
    zone: timezone,
  };
}
