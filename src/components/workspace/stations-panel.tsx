'use client';

import { authFetch } from '@iliad/auth';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@iliad/ui';
import { useEffect, useState } from 'react';

// Shapes come from OdysseyCast-Cloud-API src/routes/portal.ts (/me, /tenants/:tid/stations).
interface PortalTenant {
  id: string;
  name: string;
  role: string;
}

interface PortalStation {
  id: string;
  name: string;
  call_sign: string | null;
  time_zone: string;
  release_channel: string | null;
  created_at: string;
}

type TenantStations = PortalTenant & { stations: PortalStation[] };

async function loadTenantStations(): Promise<TenantStations[]> {
  const me = await authFetch('/api/automation/me');
  if (!me.ok) {
    throw new Error(`Cloud API refused the sign-in (${me.status})`);
  }
  const { tenants } = (await me.json()) as { tenants: PortalTenant[] };
  return Promise.all(
    tenants.map(async (tenant) => {
      const response = await authFetch(`/api/automation/tenants/${tenant.id}/stations`);
      if (!response.ok) {
        throw new Error(`Stations for ${tenant.name} failed to load (${response.status})`);
      }
      const { stations } = (await response.json()) as { stations: PortalStation[] };
      return { ...tenant, stations };
    }),
  );
}

export function StationsPanel() {
  const [tenants, setTenants] = useState<TenantStations[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenantStations().then(setTenants, (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Stations failed to load');
    });
  }, []);

  return (
    <div className="space-y-4">
      <Card className="odyssey-panel border-border/80">
        <CardHeader>
          <CardTitle>OdysseyCast stations</CardTitle>
          <CardDescription>
            Stations paired to your accounts on OdysseyCast-Cloud-API. Pair a new station from
            its setup wizard and approve the code it shows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!error && tenants === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {tenants?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Your sign-in is not a member of any OdysseyCast account yet. Ask an account owner
              to add you.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {tenants?.map((tenant) => (
        <Card key={tenant.id} className="odyssey-panel border-border/80">
          <CardHeader>
            <CardTitle>
              {tenant.name} <Badge variant="outline">{tenant.role}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenant.stations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stations yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-4 font-medium">Station</th>
                    <th className="py-1 pr-4 font-medium">Call sign</th>
                    <th className="py-1 pr-4 font-medium">Time zone</th>
                    <th className="py-1 pr-4 font-medium">Channel</th>
                    <th className="py-1 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.stations.map((station) => (
                    <tr key={station.id} className="border-t border-border/60">
                      <td className="py-1 pr-4">{station.name}</td>
                      <td className="py-1 pr-4">{station.call_sign ?? '-'}</td>
                      <td className="py-1 pr-4">{station.time_zone}</td>
                      <td className="py-1 pr-4">{station.release_channel ?? 'stable'}</td>
                      <td className="py-1">{station.created_at.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
