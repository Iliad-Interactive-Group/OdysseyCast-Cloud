// OdysseyCast-Cloud-API base URL (stations, pairing, config library, billing).
const DEFAULT_ODYSSEYCAST_API_URL = 'https://odysseycast-api.iliadinteractive.com';

export function getOdysseyCastApiUrl() {
  const configured = process.env.ODYSSEYCAST_API_URL?.trim();
  const value = configured && configured.length > 0 ? configured : DEFAULT_ODYSSEYCAST_API_URL;
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
