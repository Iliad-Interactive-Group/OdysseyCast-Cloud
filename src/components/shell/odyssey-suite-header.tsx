'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuthContext } from '@iliad/auth';
import { Button, cn } from '@iliad/ui';
import { ChevronDown, LayoutGrid, Menu, Moon, RadioTower, Sun } from 'lucide-react';

type OdysseyTheme = 'dark' | 'light';

interface TenantContextOption {
  id: string;
  label: string;
  detail: string;
}

const TENANT_CONTEXTS: TenantContextOption[] = [
  {
    id: 'iig-core',
    label: 'IIG Core Cluster',
    detail: 'Primary broadcast operations tenant',
  },
  {
    id: 'station-kjot',
    label: 'KJOT Boise',
    detail: 'Traffic, promo scheduling, and ops coordination',
  },
  {
    id: 'odyssey-rollout',
    label: 'Odyssey Rollout',
    detail: 'Canonical suite shell alignment and platform review',
  },
];

function getThemeFromDom(): OdysseyTheme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(nextTheme: OdysseyTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', nextTheme === 'dark');
  root.setAttribute('data-theme', nextTheme);
  localStorage.setItem('odyssey-theme', nextTheme);
  window.dispatchEvent(new Event('odyssey-theme-change'));
}

export function OdysseySuiteHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user } = useAuthContext();
  const [theme, setTheme] = useState<OdysseyTheme>('dark');
  const [selectedContextId, setSelectedContextId] = useState<string>(TENANT_CONTEXTS[0]!.id);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTheme(getThemeFromDom());

    try {
      const savedContextId = window.localStorage.getItem('odyssey-tenant-context');
      if (savedContextId && TENANT_CONTEXTS.some((item) => item.id === savedContextId)) {
        setSelectedContextId(savedContextId);
      }
    } catch {
      // Ignore storage access failures.
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setIsContextMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedContext =
    TENANT_CONTEXTS.find((item) => item.id === selectedContextId) ?? TENANT_CONTEXTS[0]!;

  const toggleTheme = () => {
    const nextTheme: OdysseyTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  const handleContextSelect = (contextId: string) => {
    setSelectedContextId(contextId);
    setIsContextMenuOpen(false);

    try {
      window.localStorage.setItem('odyssey-tenant-context', contextId);
    } catch {
      // Ignore storage access failures.
    }
  };

  return (
    <header
      className={cn(
        'relative z-40 isolate overflow-visible h-14 border-b grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-4 px-3 md:px-6 shrink-0 transition-colors duration-300',
        theme === 'dark'
          ? 'bg-[#09090b]/95 border-zinc-800 backdrop-blur-xl'
          : 'bg-white/95 border-zinc-200 backdrop-blur-xl',
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenSidebar}
          className="xl:hidden"
          aria-label="Open module navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
          <RadioTower className="h-4 w-4 text-white" />
        </div>

        <div className="min-w-0">
          <span
            className={cn(
              'font-black text-lg tracking-tight hidden md:block whitespace-nowrap',
              theme === 'dark' ? 'text-white' : 'text-zinc-900',
            )}
          >
            OdysseyCast
          </span>
          <span className="hidden lg:block text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Broadcast Suite
          </span>
        </div>
      </div>

      <div className="flex justify-center items-center">
        <div ref={contextMenuRef} className="relative w-full max-w-[180px] md:max-w-[260px]">
          <button
            type="button"
            onClick={() => setIsContextMenuOpen((open) => !open)}
            className={cn(
              'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border transition-colors text-xs md:text-sm',
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-800',
            )}
            aria-expanded={isContextMenuOpen}
            aria-haspopup="listbox"
          >
            <div className="flex items-center gap-2 min-w-0">
              <LayoutGrid size={14} className="text-sky-400 shrink-0" />
              <div className="min-w-0 text-left">
                <span className="block font-semibold truncate">{selectedContext.label}</span>
                <span className="block text-[9px] text-zinc-500 truncate">Tenant context</span>
              </div>
            </div>
            <ChevronDown
              size={12}
              className={cn(
                'text-zinc-500 transition-transform',
                isContextMenuOpen && 'rotate-180',
              )}
            />
          </button>

          {isContextMenuOpen ? (
            <div
              className={cn(
                'absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl p-2 z-[90] pointer-events-auto',
                theme === 'dark' ? 'bg-[#09090b] border-zinc-700' : 'bg-white border-zinc-200',
              )}
            >
              <div className="px-2 py-1 mb-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Tenant Context
                </span>
              </div>

              <div className="space-y-1">
                {TENANT_CONTEXTS.map((context) => (
                  <button
                    key={context.id}
                    type="button"
                    onClick={() => handleContextSelect(context.id)}
                    className={cn(
                      'w-full rounded-xl px-3 py-2.5 text-left transition-colors',
                      selectedContext.id === context.id
                        ? theme === 'dark'
                          ? 'bg-zinc-800 text-white'
                          : 'bg-zinc-100 text-zinc-900'
                        : theme === 'dark'
                          ? 'hover:bg-zinc-900 text-zinc-300'
                          : 'hover:bg-zinc-100 text-zinc-700',
                    )}
                  >
                    <p className="text-sm font-semibold truncate">{context.label}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{context.detail}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 justify-self-end">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden md:inline-flex border-border/70"
        >
          <Link href="/workspace">Suite Overview</Link>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={cn(
            theme === 'dark'
              ? 'hover:bg-zinc-800 text-zinc-400'
              : 'hover:bg-zinc-100 text-zinc-600',
          )}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        <div className="hidden md:block text-right mr-1">
          <p
            className={cn(
              'text-xs font-medium',
              theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900',
            )}
          >
            {user?.displayName || 'Broadcast User'}
          </p>
          <p className="text-[10px] text-zinc-500 truncate max-w-[180px]">
            {user?.email || selectedContext.detail}
          </p>
        </div>
      </div>
    </header>
  );
}
