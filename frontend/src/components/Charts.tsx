import React, { useMemo } from 'react';
import { Card, Icon, SectionTitle } from './UI';
import { theme } from '../theme';

export type ChartPoint = {
  x: string;
  y: number;
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value);

const buildLinePath = (values: number[], width: number, height: number, padding: number) => {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x = padding + (index / Math.max(1, values.length - 1)) * innerWidth;
      const y = padding + (1 - (value - min) / spread) * innerHeight;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
};

export const LineChartCard: React.FC<{
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  color?: string;
  unit?: string;
  hideHeader?: boolean;
}> = ({ title, subtitle, data, color = theme.colors.primary, unit = '', hideHeader = false }) => {
  const values = data.map(point => point.y);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const avg = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  const width = 860;
  const height = 280;
  const padding = 32;
  // If all values are equal (e.g. flat single-point series), still show a level line in the middle
  const range = max - min;
  const path = useMemo(() => {
    if (values.length === 0) return '';
    if (values.length === 1) {
      const y = padding + (height - padding * 2) / 2;
      return `M ${padding} ${y} L ${width - padding} ${y}`;
    }
    return buildLinePath(values, width, height, padding);
  }, [values, range]);
  const areaPath = useMemo(() => {
    if (!path) return '';
    const lastX = width - padding;
    const firstX = padding;
    return `${path} L ${lastX} ${height - padding} L ${firstX} ${height - padding} Z`;
  }, [path]);

  return (
    <Card className="gc-chart-card">
      {hideHeader ? null : (
        <SectionTitle
          title={title}
          subtitle={subtitle}
          icon="show_chart"
        />
      )}
      <div className="gc-chart-card__canvas">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="gc-line-chart">
          {Array.from({ length: 4 }).map((_, index) => {
            const y = padding + ((height - padding * 2) / 3) * index;
            return <line key={index} x1={padding} x2={width - padding} y1={y} y2={y} className="gc-chart-grid" />;
          })}
          {areaPath ? <path d={areaPath} fill={`url(#${title.replace(/\s+/g, '-')}-fill)`} opacity="0.7" /> : null}
          {path ? <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {values.map((value, index) => {
            const x = padding + (values.length === 1 ? (width - padding * 2) / 2 : (index / Math.max(1, values.length - 1)) * (width - padding * 2));
            const minValue = values.length ? Math.min(...values) : 0;
            const maxValue = values.length ? Math.max(...values) : 0;
            const spread = Math.max(1, maxValue - minValue);
            const y = values.length === 1
              ? padding + (height - padding * 2) / 2
              : padding + (1 - (value - minValue) / spread) * (height - padding * 2);

            return (
              <g key={`${data[index]?.x ?? index}`}>
                <circle cx={x} cy={y} r="6" fill="#fff" stroke={color} strokeWidth="4" />
                <text x={x} y={height - 8} textAnchor="middle" className="gc-chart-label">
                  {data[index]?.x}
                </text>
              </g>
            );
          })}
          <defs>
            <linearGradient id={`${title.replace(/\s+/g, '-')}-fill`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="gc-chart-stats">
        <div className="gc-chart-stat">
          <span>Min</span>
          <strong>{formatNumber(min)}{unit ? ` ${unit}` : ''}</strong>
        </div>
        <div className="gc-chart-stat">
          <span>Avg</span>
          <strong>{formatNumber(avg)}{unit ? ` ${unit}` : ''}</strong>
        </div>
        <div className="gc-chart-stat">
          <span>Max</span>
          <strong>{formatNumber(max)}{unit ? ` ${unit}` : ''}</strong>
        </div>
      </div>
    </Card>
  );
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

export const GaugeCard: React.FC<{
  title: string;
  value: number;
  maxValue?: number;
  unit?: string;
  label?: string;
}> = ({ title, value, maxValue = 100, unit = 'kg CO₂', label = 'Current Emissions' }) => {
  // Auto-scale if value exceeds max so the gauge stays meaningful.
  const safeMax = Math.max(maxValue, value > 0 ? Math.ceil((value * 1.25) / 50) * 50 : maxValue);
  const pct = Math.min(Math.max(value / Math.max(1, safeMax), 0), 1);
  const color = pct <= 0.3 ? theme.colors.success : pct <= 0.6 ? theme.colors.primaryDeep : pct <= 0.8 ? theme.colors.warning : theme.colors.danger;
  const state = pct <= 0.3 ? 'Low' : pct <= 0.6 ? 'Moderate' : pct <= 0.8 ? 'High' : 'Critical';
  const arcPath = describeArc(120, 120, 90, 180, 0);
  const progressPath = describeArc(120, 120, 90, 180, 180 - pct * 180);

  return (
    <Card className="gc-gauge-card">
      <SectionTitle title={title} subtitle={label} icon="speed" />
      <div className="gc-gauge-card__body">
        <svg viewBox="0 0 240 160" className="gc-gauge">
          <path d={arcPath} stroke="rgba(167, 243, 208, 0.6)" strokeWidth="18" fill="none" strokeLinecap="round" />
          <path d={progressPath} stroke={color} strokeWidth="18" fill="none" strokeLinecap="round" />
          <text x="120" y="98" textAnchor="middle" className="gc-gauge__value">{value.toFixed(1)}</text>
          <text x="120" y="122" textAnchor="middle" className="gc-gauge__unit">{unit}</text>
          <text x="32" y="140" textAnchor="start" className="gc-gauge__min">0</text>
          <text x="208" y="140" textAnchor="end" className="gc-gauge__min">{safeMax}</text>
        </svg>
        <div className="gc-gauge__status" style={{ background: `${color}1f`, color }}>
          <Icon name="eco" size={16} color={color} />
          {state}
        </div>
        <div className="gc-progress">
          <div className="gc-progress__label">
            <span>{(pct * 100).toFixed(0)}% of scale</span>
            <strong>{value.toFixed(1)} / {safeMax}</strong>
          </div>
          <div className="gc-progress__track">
            <div className="gc-progress__fill" style={{ width: `${pct * 100}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
          </div>
        </div>
      </div>
    </Card>
  );
};

export type BenchmarkItem = {
  name: string;
  value: number;
  benchmark: number;
  unit: string;
};

// ── DonutChart: Carbon Footprint Breakdown ──────────────────────────────────

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

export const DonutChart: React.FC<{
  title: string;
  subtitle?: string;
  icon?: string;
  data: DonutSlice[];
  unit?: string;
  centerLabel?: string;
}> = ({ title, subtitle, icon = 'donut_large', data, unit = '', centerLabel = 'Total' }) => {
  const total = data.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const radius = 64;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;
  const cx = 90;
  const cy = 90;

  let cumulative = 0;
  const segments = data
    .filter(slice => slice.value > 0)
    .map((slice) => {
      const fraction = total > 0 ? slice.value / total : 0;
      const dash = fraction * circumference;
      const offset = -((cumulative / Math.max(1, total)) * circumference);
      cumulative += slice.value;
      return { slice, fraction, dash, offset };
    });

  return (
    <Card className="gc-donut">
      <SectionTitle title={title} subtitle={subtitle} icon={icon} />
      <div className="gc-donut__body">
        <div className="gc-donut__chart">
          <svg viewBox="0 0 180 180" role="img" aria-label={title}>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="rgba(167, 243, 208, 0.35)"
              strokeWidth={stroke}
            />
            {total > 0 ? segments.map((seg) => (
              <circle
                key={seg.slice.label}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={seg.slice.color}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
                strokeDashoffset={seg.offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              >
                <title>{`${seg.slice.label}: ${seg.slice.value.toFixed(1)}${unit ? ` ${unit}` : ''} (${(seg.fraction * 100).toFixed(0)}%)`}</title>
              </circle>
            )) : null}
            <text x={cx} y={cy - 4} textAnchor="middle" className="gc-donut__total">
              {total.toFixed(total > 100 ? 0 : 1)}
            </text>
            <text x={cx} y={cy + 18} textAnchor="middle" className="gc-donut__total-label">
              {unit ? `${unit} · ${centerLabel}` : centerLabel}
            </text>
          </svg>
        </div>
        <div className="gc-donut__legend">
          {data.map(slice => {
            const fraction = total > 0 ? slice.value / total : 0;
            return (
              <div key={slice.label} className="gc-donut__legend-row">
                <span className="gc-donut__swatch" style={{ background: slice.color }} />
                <div className="gc-donut__legend-text">
                  <strong>{slice.label}</strong>
                  <span>{slice.value.toFixed(1)}{unit ? ` ${unit}` : ''} · {(fraction * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
          {data.length === 0 ? (
            <div className="gc-donut__legend-row">
              <span className="gc-donut__swatch" style={{ background: 'var(--border-strong)' }} />
              <div className="gc-donut__legend-text">
                <strong>No data yet</strong>
                <span>Once shipments report emissions, the breakdown will populate.</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

// ── BarChart: real vertical bars with hover tooltips ────────────────────────

export type BarPoint = {
  label: string;
  value: number;
  highlight?: boolean;
  formattedValue?: string;
};

export const BarChart: React.FC<{
  title: string;
  subtitle?: string;
  icon?: string;
  data: BarPoint[];
  unit?: string;
  color?: string;
  highlightColor?: string;
}> = ({ title, subtitle, icon = 'bar_chart', data, unit = '', color = theme.colors.primary, highlightColor = theme.colors.primaryDeep }) => {
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value), 0.0001) : 1;

  return (
    <Card className="gc-bar-chart">
      <SectionTitle title={title} subtitle={subtitle} icon={icon} />
      <div className="gc-bar-chart__canvas">
        <div className="gc-bar-chart__grid">
          {[1, 0.75, 0.5, 0.25, 0].map(t => (
            <div key={t} className="gc-bar-chart__gridline">
              <span>{(maxValue * t).toFixed(maxValue < 10 ? 2 : 0)}{unit ? ` ${unit}` : ''}</span>
            </div>
          ))}
        </div>
        <div className="gc-bar-chart__bars">
          {data.map((bar, i) => {
            const heightPct = Math.max(2, (bar.value / maxValue) * 100);
            const fillColor = bar.highlight ? highlightColor : color;
            return (
              <div className="gc-bar-chart__col" key={`${bar.label}-${i}`}>
                <div className="gc-bar-chart__bar-wrap">
                  <div
                    className="gc-bar-chart__bar"
                    style={{
                      height: `${heightPct}%`,
                      background: `linear-gradient(180deg, ${fillColor}, ${fillColor}cc)`,
                    }}
                    title={`${bar.label}: ${bar.formattedValue ?? bar.value.toFixed(2)}${unit ? ` ${unit}` : ''}`}
                  >
                    <span className="gc-bar-chart__value">
                      {bar.formattedValue ?? bar.value.toFixed(maxValue < 10 ? 2 : 0)}
                    </span>
                  </div>
                </div>
                <span className="gc-bar-chart__label">{bar.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export const BenchmarkBars: React.FC<{ title: string; data: BenchmarkItem[] }> = ({ title, data }) => {
  const max = Math.max(...data.flatMap(item => [item.value, item.benchmark])) * 1.12;

  return (
    <Card className="gc-benchmark-card">
      <SectionTitle title={title} subtitle="Your values vs target" icon="podium" />
      <div className="gc-benchmark-legend">
        <span><i className="gc-legend-bar" /> Your value</span>
        <span><i className="gc-legend-marker" /> Target</span>
      </div>
      <div className="gc-benchmark-list">
        {data.map(item => {
          const ratio = item.value / Math.max(0.0001, item.benchmark);
          const color = ratio <= 1 ? theme.colors.success : ratio <= 1.25 ? theme.colors.warning : theme.colors.danger;
          const markerPosition = `${(item.benchmark / max) * 100}%`;
          return (
            <div key={item.name} className="gc-benchmark-row">
              <div className="gc-benchmark-row__head">
                <strong>{item.name}</strong>
                <span style={{ color }}>{ratio <= 1 ? 'On target' : ratio <= 1.25 ? 'Above target' : 'Over target'}</span>
              </div>
              <div className="gc-benchmark-row__track">
                <div className="gc-benchmark-row__fill" style={{ width: `${(item.value / max) * 100}%`, background: color }} />
                <div className="gc-benchmark-row__marker" style={{ left: markerPosition }} />
              </div>
              <div className="gc-benchmark-row__values">
                <span>{item.value.toFixed(2)} {item.unit}</span>
                <span>{item.benchmark.toFixed(2)} {item.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
