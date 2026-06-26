'use client';

import { PeteyControlCenter } from '@/components/workspace/petey-control-center';
import { PromoSyncSchemaPanel } from '@/components/workspace/promosync-schema-panel';
import { getModuleByKey, type ModuleKey } from '@/lib/odyssey-nav';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@iliad/ui';
import Link from 'next/link';

export function ModuleScene({ moduleKey }: { moduleKey: ModuleKey }) {
  const activeModule = getModuleByKey(moduleKey);
  const isPetey = activeModule.key === 'petey-agent-hub';
  const isPromoSync = activeModule.key === 'promosync-traffic-scheduling';

  return (
    <div className="space-y-6">
      <Card className="odyssey-panel border-border/80">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="uppercase tracking-[0.16em]">
              runtime workspace
            </Badge>
            <Badge variant="outline">{activeModule.label}</Badge>
          </div>
          <CardTitle className="text-3xl tracking-tight text-foreground">{activeModule.label}</CardTitle>
          <CardDescription>
            Build and run live module controls directly in this route.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={activeModule.href}>Open {activeModule.label}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings">Suite Settings</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/workspace">Suite Workspace</Link>
          </Button>
        </CardContent>
      </Card>

      {isPromoSync ? <PromoSyncSchemaPanel /> : null}
      {isPetey ? <PeteyControlCenter /> : null}

      {!isPromoSync && !isPetey ? (
        <Card className="odyssey-panel border-border/80">
          <CardHeader>
            <CardTitle className="text-xl">No Seeded UI</CardTitle>
            <CardDescription>
              This route intentionally has no fake cards, roadmap blocks, or demo data.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Start implementing real module controls in this route now.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
