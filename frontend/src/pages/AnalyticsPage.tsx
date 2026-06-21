import React, { useMemo } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { DriverScoreCard } from '../components/Cards';
import { LineChartCard } from '../components/Charts';
import { Card, EmptyState, SectionTitle } from '../components/UI';
import { PageHero } from '../components/Shell';

export const AnalyticsPage: React.FC = () => {
  const { driverLeaderboard, fleetStats, benchmarkComparisons, loading } = useAnalytics();

  const trendData = useMemo(
    () =>
      (fleetStats.length > 0
        ? fleetStats.slice(-6).map(point => ({
            x: new Date(point.date).toLocaleDateString('en-IN', { month: 'short' }),
            y: point.total_co2_kg,
          }))
        : [
            { x: 'Jan', y: 420 },
            { x: 'Feb', y: 380 },
            { x: 'Mar', y: 450 },
            { x: 'Apr', y: 390 },
            { x: 'May', y: 410 },
            { x: 'Jun', y: 370 },
          ]),
    [fleetStats],
  );

  return (
    <div className="gc-page">
      <PageHero
        title="Analytics"
        subtitle="Fleet performance trends and driver leaderboard."
        icon="analytics"
      />

      <LineChartCard
        title="Monthly Fleet Emissions"
        subtitle="Trend line based on fleet overview data."
        data={trendData}
        unit="kg"
      />

      <Card>
        <SectionTitle title="Driver Leaderboard" subtitle="Top performers in the fleet" icon="leaderboard" />
        {loading && driverLeaderboard.length === 0 ? (
          <div className="gc-inline-state">Loading analytics...</div>
        ) : driverLeaderboard.length === 0 ? (
          <EmptyState title="No leaderboard data yet" subtitle="The API has not returned driver metrics yet." icon="insights" />
        ) : (
          <div className="gc-stack">
            {driverLeaderboard.map(driver => (
              <DriverScoreCard key={driver.driver_id} driver={driver} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle title="Benchmark Snapshot" subtitle="Fleet summary against reference metrics" icon="query_stats" />
        <div className="gc-benchmark-snapshot">
          {benchmarkComparisons.slice(0, 6).map(comparison => (
            <div key={comparison.shipment_id} className="gc-benchmark-snapshot__item">
              <strong>{comparison.shipment_id}</strong>
              <span>{comparison.benchmark_type}</span>
              <p>{comparison.difference.toFixed(2)} vs target, {comparison.percentile.toFixed(0)}th percentile</p>
            </div>
          ))}
          {benchmarkComparisons.length === 0 ? (
            <EmptyState title="No benchmark comparisons" subtitle="This endpoint may still be warming up." icon="compare_arrows" />
          ) : null}
        </div>
      </Card>
    </div>
  );
};
