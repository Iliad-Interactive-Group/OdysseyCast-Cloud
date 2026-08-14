import { Card } from '@iliad/ui';

interface ExternalAppViewportProps {
  appName: string;
  appUrl: string;
}

export function ExternalAppViewport({
  appName,
  appUrl,
}: ExternalAppViewportProps) {
  return (
    <Card className="odyssey-panel border-border/80 overflow-hidden">
      <div className="h-[calc(100vh-170px)] min-h-[640px] w-full bg-background/70">
        <iframe
          title={`${appName} viewport`}
          src={appUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    </Card>
  );
}
