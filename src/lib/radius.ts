export const RADIUS_OPTIONS = [
  { label: '5 KM', value: 5 },
  { label: '10 KM', value: 10 },
  { label: '25 KM', value: 25 },
  { label: '50 KM', value: 50 },
  { label: '100 KM', value: 100 },
  { label: 'Global', value: 0 }
] as const;

export type RadiusValue = typeof RADIUS_OPTIONS[number]['value'];

export const DEFAULT_RADIUS: RadiusValue = 50;

/**
 * Normalizes a radius value to one of the standardized options.
 * If radius is 0, it means Global.
 */
export function normalizeRadius(radius: number): RadiusValue {
  const values = RADIUS_OPTIONS.map(opt => opt.value);
  if (radius <= 0) return 0;
  
  // Find the closest value
  return values.reduce((prev, curr) => {
    return Math.abs(curr - radius) < Math.abs(prev - radius) ? (curr as RadiusValue) : (prev as RadiusValue);
  }, 50 as RadiusValue);
}

export function getRadiusValue(label: string): number {
  const option = RADIUS_OPTIONS.find(o => o.label === label);
  return option ? option.value : 50;
}
