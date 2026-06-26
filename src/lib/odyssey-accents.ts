import type { ModuleKey } from '@/lib/odyssey-nav';

export interface OdysseyModuleAccent {
  rgb: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  activeItemClass: string;
  activeIconClass: string;
}

export const ODYSSEY_MODULE_ACCENT: Record<ModuleKey, OdysseyModuleAccent> = {
  'petey-agent-hub': {
    rgb: '232,121,249',
    borderClass: 'border-t-fuchsia-400/50',
    badgeBg: 'bg-fuchsia-400/10',
    badgeText: 'text-fuchsia-400',
    activeItemClass:
      'border-fuchsia-400/45 bg-fuchsia-400/10 shadow-[0_0_0_1px_rgba(232,121,249,0.16)]',
    activeIconClass: 'text-fuchsia-400',
  },
  'traffic-pulse': {
    rgb: '251,146,60',
    borderClass: 'border-t-orange-400/50',
    badgeBg: 'bg-orange-400/10',
    badgeText: 'text-orange-400',
    activeItemClass:
      'border-orange-400/45 bg-orange-400/10 shadow-[0_0_0_1px_rgba(251,146,60,0.14)]',
    activeIconClass: 'text-orange-400',
  },
  'weather-pulse': {
    rgb: '56,189,248',
    borderClass: 'border-t-sky-400/50',
    badgeBg: 'bg-sky-400/10',
    badgeText: 'text-sky-400',
    activeItemClass: 'border-sky-400/45 bg-sky-400/10 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]',
    activeIconClass: 'text-sky-400',
  },
  'voice-tracker-pro': {
    rgb: '139,92,246',
    borderClass: 'border-t-violet-500/50',
    badgeBg: 'bg-violet-500/10',
    badgeText: 'text-violet-400',
    activeItemClass:
      'border-violet-500/45 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]',
    activeIconClass: 'text-violet-400',
  },
  'copyright-first': {
    rgb: '251,113,133',
    borderClass: 'border-t-rose-400/50',
    badgeBg: 'bg-rose-400/10',
    badgeText: 'text-rose-400',
    activeItemClass: 'border-rose-400/45 bg-rose-400/10 shadow-[0_0_0_1px_rgba(251,113,133,0.15)]',
    activeIconClass: 'text-rose-400',
  },
  'wavlength-music-scheduling': {
    rgb: '52,211,153',
    borderClass: 'border-t-emerald-400/50',
    badgeBg: 'bg-emerald-400/10',
    badgeText: 'text-emerald-400',
    activeItemClass:
      'border-emerald-400/45 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(52,211,153,0.15)]',
    activeIconClass: 'text-emerald-400',
  },
  'promosync-traffic-scheduling': {
    rgb: '251,191,36',
    borderClass: 'border-t-amber-400/50',
    badgeBg: 'bg-amber-400/10',
    badgeText: 'text-amber-400',
    activeItemClass: 'border-amber-400/45 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.14)]',
    activeIconClass: 'text-amber-400',
  },
  'audio-playground': {
    rgb: '59,130,246',
    borderClass: 'border-t-blue-500/50',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    activeItemClass: 'border-blue-500/45 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]',
    activeIconClass: 'text-blue-400',
  },
  'remote-simpltrackr': {
    rgb: '45,212,191',
    borderClass: 'border-t-teal-400/50',
    badgeBg: 'bg-teal-400/10',
    badgeText: 'text-teal-400',
    activeItemClass: 'border-teal-400/45 bg-teal-400/10 shadow-[0_0_0_1px_rgba(45,212,191,0.15)]',
    activeIconClass: 'text-teal-400',
  },
};

export function getOdysseyModuleAccent(moduleKey: ModuleKey): OdysseyModuleAccent {
  return ODYSSEY_MODULE_ACCENT[moduleKey];
}
