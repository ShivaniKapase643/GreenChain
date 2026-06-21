import React, { useMemo } from 'react';
import { GaugeCard, BenchmarkBars, LineChartCard, type BenchmarkItem } from '../components/Charts';
import { Card, Icon, MetricChip } from '../components/UI';
import { PageHero } from '../components/Shell';
import { theme } from '../theme';

const emissionData = [
  { x: 'Mon', y: 45.2 },
  { x: 'Tue', y: 52.1 },
  { x: 'Wed', y: 38.7 },
  { x: 'Thu', y: 41.3 },
  { x: 'Fri', y: 48.9 },
  { x: 'Sat', y: 35.6 },
  { x: 'Sun', y: 42.4 },
];

const benchmarkData: BenchmarkItem[] = [
  { name: 'India Avg', value: 0.9, benchmark: 0.9, unit: 'kg/km' },
  { name: 'EU 2030', value: 0.75, benchmark: 0.55, unit: 'kg/km' },
  { name: 'Best Diesel', value: 0.75, benchmark: 0.65, unit: 'kg/km' },
  { name: 'EV Truck', value: 0.75, benchmark: 0.05, unit: 'kg/km' },
  { name: 'Train', value: 0.75, benchmark: 0.03, unit: 'kg/km' },
];

export const EmissionsPage: React.FC = () => {
  const values = useMemo(() => emissionData.map(point => point.y), []);
  const monday = values[0];
  const today = values[values.length - 1];
  const weeklyAvg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const changePct = ((today - monday) / Math.max(1, monday)) * 100;

  return (
    <div className="gc-page">
      <PageHero
        title="Emissions Tracking"
        subtitle="Monitor carbon footprint, trend direction, and benchmark performance."
        icon="eco"
      />

      <div className="gc-grid gc-grid--stats">
        <MetricChip label="Today" value={`${today.toFixed(1)} kg CO₂`} tone="green" />
        <MetricChip label="Weekly Avg" value={`${weeklyAvg.toFixed(1)} kg CO₂`} tone="blue" />
        <MetricChip
          label="Vs Monday"
          value={`${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%`}
          tone={changePct <= 0 ? 'green' : 'red'}
        />
      </div>

      <Card className="gc-inline-banner">
        <Icon name="radio_button_checked" size={14} color={theme.colors.primary} />
        <span>Live. Updated just now.</span>
      </Card>

      <GaugeCard
        title="Current Level"
        label="Current emissions"
        value={42.5}
        maxValue={100}
        unit="kg CO₂"
      />

      <LineChartCard
        title="Weekly Trend"
        subtitle="Daily fleet emissions in kilograms of CO₂."
        data={emissionData}
        unit="kg"
      />

      <BenchmarkBars title="Industry Benchmarks" data={benchmarkData} />
    </div>
  );
};
