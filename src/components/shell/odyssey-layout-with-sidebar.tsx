'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button, cn } from '@iliad/ui';

interface OdysseyLayoutWithSidebarProps {
  children: ReactNode;
  sidebar: ReactNode;
  topBar?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function OdysseyLayoutWithSidebar({
  children,
  sidebar,
  topBar,
  defaultOpen = true,
  className,
}: OdysseyLayoutWithSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultOpen);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {topBar ? (
        <header className="border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex-1">{topBar}</div>
          </div>
        </header>
      ) : null}

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            'fixed z-40 h-full w-72 border-r border-border bg-card/55 transition-transform duration-300 md:relative md:z-auto md:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="h-full overflow-y-auto p-3 md:p-4">{sidebar}</div>
        </aside>

        <main className={cn('flex-1 overflow-auto bg-background', className)}>{children}</main>

        {sidebarOpen ? (
          <div
            className="fixed inset-0 z-30 bg-black/45 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );
}
