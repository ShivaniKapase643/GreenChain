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
}> = ({ title, subtitle, data, color = theme.colors.primary, unit = '' }) => {
  const values = data.map(point => point.y);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const avg = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  const width = 860;
  const height = 280;
  const padding = 28;
  const path = useMemo(() => buildLinePath(values, width, height, padding), [values]);
  const areaPath = useMemo(() => {
    if (!path) return '';
    const lastX = width - padding;
    const firstX = padding;
    return `${path} L ${lastX} ${height - padding} L ${firstX} ${height - padding} Z`;
  }, [path]);

  return (
    <Card className="gc-chart-card">
      <SectionTitle
        title={title}
        subtitle={subtitle}
        icon="show_chart"
      />
      <div className="gc-chart-card__canvas">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="gc-line-chart">
          {Array.from({ length: 4 }).map((_, index) => {
            const y = padding + ((height - padding * 2) / 3) * index;
            return <line key={index} x1={padding} x2={width - padding} y1={y} y2={y} className="gc-chart-grid" />;
          })}
          {areaPath ? <path d={areaPath} fill={`url(#${title.replace(/\s+/g, '-')}-fill)`} opacity="0.7" /> : null}
          {path ? <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {values.map((value, index) => {
            const x = padding + (index / Math.max(1, values.length - 1)) * (width - padding * 2);
            const minValue = values.length ? Math.min(...values) : 0;
            const maxValue = values.length ? Math.max(...values) : 0;
            const spread = Math.max(1, maxValue - minValue);
            const y = padding + (1 - (value - minValue) / spread) * (height - padding * 2);

            return (
              <g key={`${data[index]?.x ?? index}`}>
                <circle cx={x} cy={y} r="6" fill="#fff" stroke={color} strokeWidth="4" />
                <text x={x} y={height - 6} textAnchor="middle" className="gc-chart-label">
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
  const pct = Math.min(Math.max(value / Math.max(1, maxValue), 0), 1);
  const color = pct <= 0.3 ? theme.colors.success : pct <= 0.6 ? theme.colors.info : pct <= 0.8 ? theme.colors.warning : theme.colors.danger;
  const state = pct <= 0.3 ? 'Low' : pct <= 0.6 ? 'Moderate' : pct <= 0.8 ? 'High' : 'Critical';
  const arcPath = describeArc(120, 120, 90, 180, 0);
  const progressPath = describeArc(120, 120, 90, 180, 180 - pct * 180);

  return (
    <Card className="gc-gauge-card">
      <SectionTitle title={title} subtitle={label} icon="speed" />
      <div className="gc-gauge-card__body">
        <svg viewBox="0 0 240 160" className="gc-gauge">
          <path d={arcPath} stroke="rgba(112, 150, 152, 0.22)" strokeWidth="18" fill="none" strokeLinecap="round" />
          <path d={progressPath} stroke={color} strokeWidth="18" fill="none" strokeLinecap="round" />
          <text x="120" y="102" textAnchor="middle" className="gc-gauge__value">{value.toFixed(1)}</text>
          <text x="120" y="125" textAnchor="middle" className="gc-gauge__unit">{unit}</text>
          <text x="32" y="122" textAnchor="start" className="gc-gauge__min">0</text>
          <text x="208" y="122" textAnchor="end" className="gc-gauge__min">{maxValue}</text>
        </svg>
        <div className="gc-gauge__status" style={{ background: `${color}1f`, color }}>
          <Icon name="eco" size={16} color={color} />
          {state}
        </div>
        <div className="gc-progress">
          <div className="gc-progress__label">
            <span>{(pct * 100).toFixed(0)}% of max</span>
            <strong>{value.toFixed(1)} / {maxValue}</strong>
          </div>
          <div className="gc-progress__track">
            <div className="gc-progress__fill" style={{ width: `${pct * 100}%`, background: color }} />
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
