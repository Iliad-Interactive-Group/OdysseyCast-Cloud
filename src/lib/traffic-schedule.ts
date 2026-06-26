const SLOT_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(slot: string): number {
  const [hour, minute] = slot.split(':').map((value) => Number(value));
  return hour * 60 + minute;
}

function toSlot(minutes: number): string {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const minute = (minutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

export function isValidSlot(slot: string): boolean {
  return SLOT_PATTERN.test(slot);
}

export function normalizeSlotTimes(slotTimes: string[]): string[] {
  return Array.from(new Set(slotTimes.map((slot) => slot.trim()).filter(isValidSlot))).sort(
    (left, right) => toMinutes(left) - toMinutes(right),
  );
}

export function buildSuggestedSlotTimes(params: {
  startTime: string;
  endTime: string;
  reportCount: number;
}): string[] {
  if (!isValidSlot(params.startTime) || !isValidSlot(params.endTime) || params.reportCount <= 0) {
    return [];
  }

  const startMinutes = toMinutes(params.startTime);
  let endMinutes = toMinutes(params.endTime);

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const duration = endMinutes - startMinutes;
  if (duration <= 0) {
    return [];
  }

  if (params.reportCount === 1) {
    return [toSlot(startMinutes % (24 * 60))];
  }

  const interval = duration / (params.reportCount - 1);
  const slots: string[] = [];

  for (let index = 0; index < params.reportCount; index += 1) {
    const raw = Math.round(startMinutes + index * interval);
    slots.push(toSlot(((raw % (24 * 60)) + (24 * 60)) % (24 * 60)));
  }

  return normalizeSlotTimes(slots);
}
