let cachedFingerprint: string | null = null;

export const generateDeviceFingerprint = (): string => {
  if (cachedFingerprint) return cachedFingerprint;

  const ua = navigator.userAgent;
  const screenW = screen.width;
  const screenH = screen.height;
  const colorDepth = screen.colorDepth;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const platform = navigator.platform;
  const hardwareConcurrency = navigator.hardwareConcurrency || 0;

  const raw = [
    ua,
    `${screenW}x${screenH}`,
    colorDepth,
    timezone,
    language,
    platform,
    hardwareConcurrency,
  ].join('|');

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  const fingerprint = `DF-${Math.abs(hash).toString(36).toUpperCase()}-${raw.length.toString(36)}`;
  cachedFingerprint = fingerprint;
  return fingerprint;
};
