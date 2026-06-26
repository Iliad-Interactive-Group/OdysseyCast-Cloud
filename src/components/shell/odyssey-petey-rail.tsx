'use client';

import { getActiveOdysseyModule } from '@/lib/odyssey-nav';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@iliad/ui';
import { MessageSquare, RadioTower, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function OdysseyPeteyRail({
  pathname,
  collapsed = false,
}: {
  pathname: string;
  collapsed?: boolean;
}) {
  const activeModule = getActiveOdysseyModule(pathname);

  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-center py-3 gap-3">
        <MessageSquare className="h-4 w-4 text-fuchsia-400" />
        <Sparkles className="h-4 w-4 text-zinc-500" />
        <RadioTower className="h-4 w-4 text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-fuchsia-200/40 dark:border-fuchsia-900/40 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-fuchsia-500/15 p-2 text-fuchsia-400">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Petey Sidebar</p>
            <p className="text-xs text-muted-foreground">Ops chat, queue, and broadcast context</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
        <Card className="border-fuchsia-200/40 dark:border-fuchsia-900/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Current Module</CardTitle>
            <CardDescription>
              {activeModule.label} is active. Use direct controls below to run real workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
              <p className="font-medium text-foreground">Operational context</p>
              <p className="mt-1 text-muted-foreground">Route: {pathname}</p>
            </div>
            <Button asChild size="sm" className="w-full">
              <Link href="/petey-agent-hub">Open Ops Hub</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href="/traffic">Open Traffic Desk</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href="/traffic-logs">Open Traffic Logs</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href="/voice-tracker-pro">Open Voice Tracker</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href="/audio-playground">Open Audio Playground</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="rounded-xl border border-border/60 bg-background/55 p-3">
              Keep this rail focused on execution links and live status. No roadmap content.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href="/settings">Open Suite Settings</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href="/workspace">Open Workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
