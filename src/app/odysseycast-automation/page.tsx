import { ExternalAppViewport } from '@/components/workspace/external-app-viewport';

const DEFAULT_AUTOMATION_UI_BASE_URL = 'http://127.0.0.1:5173';

function getAutomationUiBaseUrl() {
  const configured = process.env.ODYSSEY_AUTOMATION_WEB_BASE_URL?.trim();
  const value = configured && configured.length > 0 ? configured : DEFAULT_AUTOMATION_UI_BASE_URL;
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export default function OdysseyCastAutomationPage() {
  return (
    <ExternalAppViewport
      appName="OdysseyCast-Automation"
      appUrl={getAutomationUiBaseUrl()}
    />
  );
}
