type KpiHistoryPoint = {
  id: number;
  computedAt: string;
  value: string | null;
  status: 'GREEN' | 'YELLOW' | 'RED' | 'NA';
  ev: string | null;
  pv: string | null;
  ac: string | null;
};

type ChartPoint = {
  x: number;
  y: number;
  rawX: string;
  rawValue: number | null;
};

type Props = {
  title: string;
  points: KpiHistoryPoint[];
  height?: number;
  unitLabel?: string;
};

const CHART_WIDTH = 720;
const DEFAULT_HEIGHT = 260;
const PADDING = { top: 20, right: 20, bottom: 42, left: 52 };

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatValueLabel(value: number) {
  return value.toFixed(2);
}

function buildChartPoints(points: KpiHistoryPoint[], height: number): {
  chartPoints: ChartPoint[];
  minValue: number;
  maxValue: number;
} {
  const values = points
    .map((p) => (p.value === null ? null : Number(p.value)))
    .filter((v): v is number => v !== null && Number.isFinite(v));

  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 1;

  const safeMin = minValue === maxValue ? minValue - 1 : minValue;
  const safeMax = minValue === maxValue ? maxValue + 1 : maxValue;

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerHeight = height - PADDING.top - PADDING.bottom;

  const chartPoints = points.map((point, index) => {
    const x =
      points.length === 1
        ? PADDING.left + innerWidth / 2
        : PADDING.left + (index / (points.length - 1)) * innerWidth;

    const numericValue = point.value === null ? null : Number(point.value);

    if (numericValue === null || !Number.isFinite(numericValue)) {
      return {
        x,
        y: NaN,
        rawX: point.computedAt,
        rawValue: null,
      };
    }

    const ratio = (numericValue - safeMin) / (safeMax - safeMin);
    const y = PADDING.top + innerHeight - ratio * innerHeight;

    return {
      x,
      y,
      rawX: point.computedAt,
      rawValue: numericValue,
    };
  });

  return {
    chartPoints,
    minValue: safeMin,
    maxValue: safeMax,
  };
}

function buildLineSegments(chartPoints: ChartPoint[]) {
  const segments: string[] = [];
  let current: ChartPoint[] = [];

  for (const point of chartPoints) {
    if (point.rawValue === null || Number.isNaN(point.y)) {
      if (current.length >= 2) {
        segments.push(
          current.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
        );
      }
      current = [];
      continue;
    }

    current.push(point);
  }

  if (current.length >= 2) {
    segments.push(current.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '));
  }

  return segments;
}

export default function KpiLineChart({
  title,
  points,
  height = DEFAULT_HEIGHT,
  unitLabel,
}: Props) {
  const hasAnyNumericData = points.some((p) => p.value !== null && Number.isFinite(Number(p.value)));

  if (points.length === 0) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ opacity: 0.75, marginBottom: 0 }}>
          Nu există istoric disponibil pentru acest KPI.
        </p>
      </div>
    );
  }

  const { chartPoints, minValue, maxValue } = buildChartPoints(points, height);
  const lineSegments = buildLineSegments(chartPoints);

  const innerHeight = height - PADDING.top - PADDING.bottom;
  const yTicks = [0, 0.5, 1].map((ratio) => {
    const value = maxValue - ratio * (maxValue - minValue);
    const y = PADDING.top + ratio * innerHeight;
    return { value, y };
  });

  return (
    <div className="card">
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p style={{ marginTop: 6, marginBottom: 0, opacity: 0.75 }}>
          Axa X: timp · Axa Y: valoare {unitLabel ? `(${unitLabel})` : ''}
        </p>
      </div>

      {!hasAnyNumericData ? (
        <p style={{ opacity: 0.75, marginBottom: 0 }}>
          Istoricul există, dar nu conține valori numerice calculabile în intervalul curent.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${height}`}
          width="100%"
          height={height}
          role="img"
          aria-label={`${title} trend chart`}
        >
          {/* grid + y axis labels */}
          {yTicks.map((tick, index) => (
            <g key={index}>
              <line
                x1={PADDING.left}
                y1={tick.y}
                x2={CHART_WIDTH - PADDING.right}
                y2={tick.y}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />
              <text
                x={PADDING.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="11"
                fill="currentColor"
                opacity="0.75"
              >
                {formatValueLabel(tick.value)}
              </text>
            </g>
          ))}

          {/* axes */}
          <line
            x1={PADDING.left}
            y1={PADDING.top}
            x2={PADDING.left}
            y2={height - PADDING.bottom}
            stroke="currentColor"
            opacity="0.35"
          />
          <line
            x1={PADDING.left}
            y1={height - PADDING.bottom}
            x2={CHART_WIDTH - PADDING.right}
            y2={height - PADDING.bottom}
            stroke="currentColor"
            opacity="0.35"
          />

          {/* x labels */}
          {chartPoints.map((point, index) => (
            <g key={index}>
              <line
                x1={point.x}
                y1={height - PADDING.bottom}
                x2={point.x}
                y2={height - PADDING.bottom + 6}
                stroke="currentColor"
                opacity="0.35"
              />
              <text
                x={point.x}
                y={height - 14}
                textAnchor="middle"
                fontSize="11"
                fill="currentColor"
                opacity="0.75"
              >
                {formatDateLabel(point.rawX)}
              </text>
            </g>
          ))}

          {/* line segments with gaps */}
          {lineSegments.map((d, index) => (
            <path
              key={index}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            />
          ))}

          {/* points */}
          {chartPoints.map((point, index) => {
            if (point.rawValue === null || Number.isNaN(point.y)) return null;

            return (
              <g key={index}>
                <circle cx={point.x} cy={point.y} r="4" fill="currentColor" />
                <title>
                  {`${formatDateLabel(point.rawX)} · ${formatValueLabel(point.rawValue)}`}
                </title>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}