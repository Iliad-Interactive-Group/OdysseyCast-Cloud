import { isValidSlot } from '@/lib/traffic-schedule';
import type {
  CreateCoverageCandidateRequest,
  GenerateTrafficRunRequest,
  SaveTrafficSetupRequest,
} from '@/lib/traffic-setup.types';

const STATE_CODE_PATTERN = /^[A-Z]{2}$/;
const IANA_TIMEZONE_PATTERN = /^[A-Za-z_]+(?:\/[A-Za-z_+-]+)+$/;

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function validateTrafficSetupPayload(payload: SaveTrafficSetupRequest): string | null {
  if (!hasValue(payload.marketId)) {
    return 'Market is required';
  }

  if (!hasValue(payload.clusterName)) {
    return 'Cluster name is required';
  }

  if (!hasValue(payload.automationSystem)) {
    return 'Automation system is required';
  }

  if (!hasValue(payload.segmentLabel)) {
    return 'Segment label is required';
  }

  if (!Array.isArray(payload.slotTimes) || payload.slotTimes.length === 0) {
    return 'At least one slot time is required';
  }

  const normalized = payload.slotTimes.map((slot) => slot.trim()).filter(Boolean);

  if (normalized.length === 0) {
    return 'At least one slot time is required';
  }

  const invalid = normalized.filter((slot) => !isValidSlot(slot));
  if (invalid.length > 0) {
    return 'Slot times must use HH:MM 24-hour format (for example, 06:10)';
  }

  return null;
}

export function validateCoverageCandidatePayload(
  payload: CreateCoverageCandidateRequest,
): string | null {
  if (!hasValue(payload.name)) {
    return 'City name is required';
  }

  if (!hasValue(payload.state)) {
    return 'State code is required';
  }

  const upperState = payload.state.trim().toUpperCase();
  if (!STATE_CODE_PATTERN.test(upperState)) {
    return 'State code must be a 2-letter abbreviation (for example, ID)';
  }

  if (!hasValue(payload.timezone)) {
    return 'Timezone is required';
  }

  if (!IANA_TIMEZONE_PATTERN.test(payload.timezone.trim())) {
    return 'Timezone must be a valid IANA timezone (for example, America/Chicago)';
  }

  return null;
}

export function validateGenerateTrafficRunPayload(
  payload: GenerateTrafficRunRequest,
): string | null {
  if (payload.slotTime && !isValidSlot(payload.slotTime.trim())) {
    return 'slotTime must use HH:MM 24-hour format';
  }

  if (payload.notes && payload.notes.trim().length > 280) {
    return 'notes must be 280 characters or fewer';
  }

  return null;
}
