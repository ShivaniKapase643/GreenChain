import React from 'react';
import { useMLInsights } from '../../hooks/useMLInsights';
import { Card, EmptyState, Icon, MetricChip, SectionTitle } from '../components/UI';
import { PageHero } from '../components/Shell';
import { BarChart, type BarPoint } from '../components/Charts';
import { useToast } from '../components/Toast';
import { theme } from '../theme';

const gradeColor = (grade: string) => {
  switch ((grade || '').toUpperCase()) {
    case 'A':
    case 'A+':
      return '#16a34a';
    case 'B':
      return '#65a30d';
    case 'C':
      return '#f59e0b';
    case 'D':
      return '#f97316';
    case 'F':
      return '#dc2626';
    default:
      return theme.colors.textMuted;
  }
};

const severityColor = (level: string) => {
  switch ((level || '').toLowerCase()) {
    case 'low':      return theme.colors.primaryDeep;
    case 'medium':   return theme.colors.warning;
    case 'high':     return '#f97316';
    case 'critical': return theme.colors.danger;
    default:         return theme.colors.textMuted;
  }
};

const riskColor = (level: string) => {
  switch ((level || '').toLowerCase()) {
    case 'low':    return theme.colors.primaryDeep;
    case 'medium': return theme.colors.warning;
    case 'high':   return theme.colors.danger;
    default:       return theme.colors.textMuted;
  }
};

const tonalBadge = (value: string): 'green' | 'amber' | 'red' | 'slate' => {
  const v = (value || '').toLowerCase();
  if (v === 'normal' || v === 'good') return 'green';
  if (v === 'warning' || v === 'medium') return 'amber';
  if (v === 'high' || v === 'critical') return 'red';
  return 'slate';
};

export const MLPage: React.FC = () => {
  const toast = useToast();
  const {
    co2Prediction,
    anomalyResult,
    driverProfile,
    creditForecast,
    routeRec,
    fuelWaste,
    shipmentScore,
    loading,
    error,
    refetch,
  } = useMLInsights();

  if (loading) {
    return (
      <div className="gc-page">
        <PageHero title="ML Insights" subtitle="Loading AI models…" icon="psychology" />
        <Card><div className="gc-inline-state">Loading ML Insights…</div></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gc-page">
        <PageHero title="ML Insights" subtitle="Model response failed" icon="psychology" />
        <Card>
          <EmptyState title="Failed to load insights" subtitle={error} icon="error" />
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 20px 20px' }}>
            <button
              className="gc-button gc-button--primary"
              onClick={() => {
                refetch();
                toast.info('Retrying ML models…', 'Refreshing');
              }}
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="gc-page">
      <PageHero
        title="ML Insights"
        subtitle="Seven AI models powering the fleet."
        icon="psychology"
        actions={
          <button
            className="gc-button gc-button--secondary"
            onClick={() => { refetch(); toast.info('Re-running models…', 'Refreshing'); }}
          >
            <Icon name="refresh" size={14} color={theme.colors.primaryDeep} />
            Refresh
          </button>
        }
      />

      {co2Prediction ? (
        <Card>
          <SectionTitle title="CO₂ Emission Prediction" subtitle="RandomForest regression on trip features" icon="cloud" />
          <div className="gc-model-head">
            <div className="gc-score-circle" style={{ background: `linear-gradient(135deg, ${gradeColor(co2Prediction.grade)}, ${gradeColor(co2Prediction.grade)}cc)` }}>
              {co2Prediction.grade}
            </div>
            <div>
              <strong>{co2Prediction.predicted_co2_kg.toFixed(1)} kg CO₂ predicted</strong>
              <p>
                {co2Prediction.delta_kg > 0 ? '↓' : '↑'} {Math.abs(co2Prediction.delta_kg).toFixed(1)} kg vs baseline · {co2Prediction.credit_status}
              </p>
            </div>
          </div>
          <div className="gc-grid gc-grid--stats">
            <MetricChip label="CO₂ per km" value={`${co2Prediction.co2_per_km.toFixed(2)} kg`} tone="blue" />
            <MetricChip label="Credits earned" value={co2Prediction.credits_earned.toFixed(3)} tone="green" />
            <MetricChip label="Estimated value" value={`₹${co2Prediction.credits_inr.toFixed(0)}`} tone="amber" />
          </div>
        </Card>
      ) : null}

      {anomalyResult ? (
        <Card>
          <SectionTitle title="Anomaly Detection" subtitle="IsolationForest on driving telemetry" icon="warning" />
          <div className="gc-model-head">
            <div
              className="gc-score-circle"
              style={{ background: `linear-gradient(135deg, ${severityColor(anomalyResult.severity_level)}, ${severityColor(anomalyResult.severity_level)}cc)` }}
            >
              <Icon name={anomalyResult.is_anomaly ? 'priority_high' : 'check'} size={22} color="#ffffff" />
            </div>
            <div>
              <strong>{anomalyResult.is_anomaly ? 'Anomaly detected' : 'Normal behaviour'}</strong>
              <p>{anomalyResult.alert_message}</p>
            </div>
          </div>
          <div className="gc-grid gc-grid--stats">
            <MetricChip label="Severity score" value={anomalyResult.severity_score.toFixed(2)} tone="amber" />
            <MetricChip label="Severity level" value={anomalyResult.severity_level.toUpperCase()} tone={anomalyResult.is_anomaly ? 'red' : 'green'} />
          </div>
          <div className="gc-key-value-list">
            {Object.entries(anomalyResult.factors).map(([key, value]) => (
              <div key={key} className="gc-key-value-list__item">
                <span>{key.replace(/_/g, ' ')}</span>
                <span className={`gc-badge gc-badge--${tonalBadge(value)}`}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {driverProfile ? (
        <Card>
          <SectionTitle title="Driver Behaviour Profile" subtitle="KMeans clustering (k=4)" icon="person" />
          <div className="gc-model-head">
            <div className="gc-profile-badge" style={{ background: `linear-gradient(135deg, ${driverProfile.color}, ${driverProfile.color}cc)` }}>
              <Icon name="directions_car" size={22} color="#ffffff" />
            </div>
            <div>
              <strong style={{ color: driverProfile.color }}>{driverProfile.badge}</strong>
              <p>Risk score: {driverProfile.risk_score.toFixed(1)}</p>
            </div>
          </div>
          <div className="gc-stack gc-stack--tight">
            {driverProfile.coaching_tips.map((tip, index) => (
              <div key={index} className="gc-tip-row">
                <Icon name="lightbulb" size={16} color={theme.colors.primaryDeep} />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {creditForecast ? (
        <>
          <Card>
            <SectionTitle title="Carbon Credit Forecast" subtitle="30-day projection" icon="trending_up" />
            <div className="gc-grid gc-grid--stats">
              <MetricChip label="Total credits" value={creditForecast.total_credits.toFixed(2)} tone="green" />
              <MetricChip label="Total value" value={`₹${creditForecast.total_inr.toFixed(0)}`} tone="blue" />
              <MetricChip label="Avg / day" value={creditForecast.avg_daily_credits.toFixed(2)} tone="slate" />
            </div>
          </Card>

          <BarChart
            title="Credits earned per day"
            subtitle="Next 14 days · weekends in muted tone"
            icon="bar_chart"
            unit="cr"
            color={theme.colors.primary}
            highlightColor="#94a3b8"
            data={creditForecast.forecast.slice(0, 14).map<BarPoint>(day => ({
              label: day.day,
              value: day.credits,
              highlight: day.day === 'Sat' || day.day === 'Sun',
              formattedValue: day.credits.toFixed(2),
            }))}
          />
        </>
      ) : null}

      {routeRec ? (
        <>
          <Card>
            <SectionTitle title="Route Mode Recommendation" subtitle="GBClassifier on logistics features" icon="alt_route" />
            <div className="gc-model-head">
              <div className="gc-route-badge">
                <Icon name={routeRec.recommended_mode === 'rail' ? 'train' : routeRec.recommended_mode === 'road' ? 'local_shipping' : 'swap_horiz'} size={26} color="#ffffff" />
              </div>
              <div>
                <strong>{routeRec.recommended_mode.replace(/_/g, ' ').toUpperCase()}</strong>
                <p>{routeRec.confidence}% confidence · {routeRec.co2_saved_kg.toFixed(0)} kg CO₂ saved</p>
              </div>
            </div>
            <div className="gc-grid gc-grid--stats">
              <MetricChip label="CO₂ saved" value={`${routeRec.co2_saved_kg.toFixed(1)} kg`} tone="green" />
              <MetricChip label="Credits" value={routeRec.credits_earned.toFixed(3)} tone="green" />
              <MetricChip label="Value" value={`₹${routeRec.credits_inr.toFixed(0)}`} tone="blue" />
            </div>
          </Card>

          <BarChart
            title="Mode comparison"
            subtitle="Recommended mode highlighted"
            icon="compare_arrows"
            unit="%"
            color="#94a3b8"
            highlightColor={theme.colors.primary}
            data={Object.entries(routeRec.alternatives).map<BarPoint>(([mode, data]) => ({
              label: mode.replace(/_/g, ' '),
              value: data.score,
              highlight: mode === routeRec.recommended_mode,
              formattedValue: `${data.score.toFixed(0)}%`,
            }))}
          />
        </>
      ) : null}

      {fuelWaste ? (
        <Card>
          <SectionTitle title="Fuel Waste Early Warning" subtitle="Pre-trip risk assessment" icon="local_gas_station" />
          <div className="gc-model-head">
            <div className="gc-risk-circle" style={{ borderColor: riskColor(fuelWaste.risk_level) }}>
              <strong style={{ color: riskColor(fuelWaste.risk_level) }}>{fuelWaste.risk_pct.toFixed(0)}%</strong>
              <span>Risk</span>
            </div>
            <div>
              <strong>Predicted fuel-waste risk</strong>
              <p>{fuelWaste.recommendation}</p>
            </div>
            <span
              className="gc-risk-badge"
              style={{ background: `linear-gradient(135deg, ${riskColor(fuelWaste.risk_level)}, ${riskColor(fuelWaste.risk_level)}cc)` }}
            >
              {fuelWaste.risk_level.toUpperCase()}
            </span>
          </div>
          <div className="gc-stack gc-stack--tight">
            {fuelWaste.risk_factors.map((factor, index) => (
              <div key={index} className="gc-tip-row">
                <Icon name="report_problem" size={16} color={theme.colors.warning} />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {shipmentScore ? (
        <Card>
          <SectionTitle title="Green Grade Scorer" subtitle="MLP neural network (128–64–32)" icon="verified" />
          <div className="gc-model-head">
            <div
              className="gc-score-circle gc-score-circle--lg"
              style={{ background: `linear-gradient(135deg, ${gradeColor(shipmentScore.grade)}, ${gradeColor(shipmentScore.grade)}cc)` }}
            >
              {shipmentScore.grade}
            </div>
            <div>
              <strong>{shipmentScore.score.toFixed(0)} / 100</strong>
              <p>CO₂ ratio: {shipmentScore.co2_ratio.toFixed(2)}× baseline</p>
            </div>
          </div>
          <div className="gc-stack gc-stack--tight">
            {shipmentScore.improvement_tips.map((tip, index) => (
              <div key={index} className="gc-tip-row">
                <Icon name="tips_and_updates" size={16} color={theme.colors.primaryDeep} />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
};
