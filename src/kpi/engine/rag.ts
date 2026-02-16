export type RagStatus = 'GREEN' | 'YELLOW' | 'RED' | 'NA';

export class InvalidThresholdError extends Error {}

export type RagThresholds = {
  greenMin: number;
  yellowMin: number;
};

export function mapToRagStatus(value: number | null, thresholds: RagThresholds): RagStatus {
  if (value === null) return 'NA';

  const { greenMin, yellowMin } = thresholds;

  if (!Number.isFinite(greenMin) || !Number.isFinite(yellowMin)) {
    throw new InvalidThresholdError('Thresholds must be finite numbers.');
  }
  if (greenMin < yellowMin) {
    throw new InvalidThresholdError('Invalid thresholds: greenMin must be >= yellowMin.');
  }
  if (!Number.isFinite(value)) {
    throw new InvalidThresholdError('KPI value must be a finite number or null.');
  }

  if (value >= greenMin) return 'GREEN';
  if (value >= yellowMin) return 'YELLOW';
  return 'RED';
}
