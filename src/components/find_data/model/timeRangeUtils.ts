import { FindDataResource, RequirementHypothesis } from './FindDataTask';

export function normalizeMonth(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.trim().match(/^(\d{4})[-./]?(\d{1,2})$/);
  if (!match) return undefined;
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? `${match[1]}-${String(month).padStart(2, '0')}` : undefined;
}

export function compareMonth(a: string, b: string): number {
  return a.localeCompare(b);
}

export function validateMonthRange(range: RequirementHypothesis['timeRange']): { valid: boolean; start?: string; end?: string; reason?: string } {
  if (!range?.start && !range?.end) return { valid: true };
  if (!range?.start || !range?.end) return { valid: false, reason: '开始时间和结束时间必须同时填写。' };
  const start = normalizeMonth(range.start);
  const end = normalizeMonth(range.end);
  if (!start || !end) return { valid: false, reason: '时间格式应为 YYYY-MM。' };
  if (compareMonth(start, end) > 0) return { valid: false, reason: '开始时间不能晚于结束时间。' };
  return { valid: true, start, end };
}

export function resourceCoversRange(resource: FindDataResource, range: RequirementHypothesis['timeRange']): boolean {
  const validated = validateMonthRange(range);
  if (!validated.valid || !validated.start || !validated.end) return validated.valid;
  const period = resource.availabilityPeriod;
  if (!period) return false;
  const start = normalizeMonth(period.start);
  const end = normalizeMonth(period.end);
  return !!start && !!end && compareMonth(start, validated.start) <= 0 && compareMonth(end, validated.end) >= 0;
}

export function getResourceRangeIntersection(resources: FindDataResource[]): { start: string; end: string } | undefined {
  const periods = resources.map((resource) => resource.availabilityPeriod).filter((period): period is { start: string; end: string } => !!period);
  if (periods.length !== resources.length || periods.length === 0) return undefined;
  const starts = periods.map((period) => normalizeMonth(period.start));
  const ends = periods.map((period) => normalizeMonth(period.end));
  if (starts.some((value) => !value) || ends.some((value) => !value)) return undefined;
  const start = starts.filter((value): value is string => !!value).sort().at(-1)!;
  const end = ends.filter((value): value is string => !!value).sort()[0]!;
  return compareMonth(start, end) <= 0 ? { start, end } : undefined;
}
