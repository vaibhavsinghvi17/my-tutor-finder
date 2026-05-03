import { DAYS, Day, FreeTimeBlock, SlotKey } from "./types";

export function blocksToSlots(blocks: FreeTimeBlock[]): SlotKey[] {
  const out = new Set<SlotKey>();
  blocks.forEach((b) => {
    b.days.forEach((d) => {
      for (let h = b.fromHour; h < b.toHour; h++) {
        out.add(`${d}-${h}` as SlotKey);
      }
    });
  });
  return Array.from(out);
}

export function ageFromDob(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function fmtHour(h: number): string {
  const hr = h % 24;
  const period = hr >= 12 ? "PM" : "AM";
  const display = hr % 12 === 0 ? 12 : hr % 12;
  return `${display}:00 ${period}`;
}

export function blockSummary(b: FreeTimeBlock): string {
  const days = DAYS.filter((d) => b.days.includes(d)).join(", ") || "No days";
  return `${days} • ${fmtHour(b.fromHour)} – ${fmtHour(b.toHour)}`;
}

export function newBlock(): FreeTimeBlock {
  return {
    id: crypto.randomUUID(),
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"] as Day[],
    fromHour: 17,
    toHour: 19,
  };
}
