const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

const bangkokDateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

function parseAssumeUtc(value: string) {
  const trimmed = value.trim();
  if (/[zZ]|[+\-]\d{2}:?\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }
  const normalized = trimmed.includes("T")
    ? trimmed
    : trimmed.replace(" ", "T");
  return new Date(`${normalized}Z`);
}

export function formatBangkokDateTime(value: string | Date) {
  const date = typeof value === "string" ? parseAssumeUtc(value) : value;
  return bangkokDateTimeFormatter.format(date);
}

export function parseBangkokDate(value: string | Date) {
  return typeof value === "string" ? parseAssumeUtc(value) : value;
}

export function getBangkokISODate(offsetDays = 0) {
  const now = new Date(Date.now() + BANGKOK_OFFSET_MS);
  const base = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}

export function addBangkokDays(offsetDays = 0) {
  const iso = getBangkokISODate(offsetDays);
  return new Date(`${iso}T00:00:00.000Z`);
}
