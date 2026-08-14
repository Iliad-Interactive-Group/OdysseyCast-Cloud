import { ExternalAppViewport } from '@/components/workspace/external-app-viewport';
import { headers } from 'next/headers';

const DEFAULT_APOLLO_UI_HOST = '127.0.0.1';

async function getApolloUiBaseUrl() {
  const configured = process.env.APOLLO_MUSIC_SCHEDULER_UI_BASE_URL?.trim();
  if (configured && configured.length > 0) {
    return configured.endsWith('/') ? configured.slice(0, -1) : configured;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get('host') || '';
  const hostname = host.split(':')[0] || DEFAULT_APOLLO_UI_HOST;
  const value = `http://${hostname}:8090`;
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export default async function WavlengthMusicSchedulingPage() {
  return (
    <ExternalAppViewport
      appName="Apollo Music Logs"
      appUrl={await getApolloUiBaseUrl()}
    />
  );
}
