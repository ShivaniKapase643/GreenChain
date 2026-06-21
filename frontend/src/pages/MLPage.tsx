import React from 'react';
import { useMLInsights } from '../../hooks/useMLInsights';
import { Card, EmptyState, Icon, MetricChip, SectionTitle } from '../components/UI';
import { PageHero } from '../components/Shell';
import { theme } from '../theme';

const gradeColor = (grade: string) => {
  switch (grade) {
    case 'A':
      return theme.colors.primary;
    case 'B':
      return theme.colors.primaryDeep;
    case 'C':
      return theme.colors.accent;
    case 'D':
      return theme.colors.secondary;
    default:
      return theme.colors.danger;
  }
};

const severityColor = (level: string) => {
  switch (level) {
    case 'low':
      return theme.colors.primaryDeep;
    case 'medium':
      return theme.colors.accent;
    case 'high':
      return theme.colors.secondary;
    case 'critical':
      return theme.colors.danger;
    default:
      return '#64748b';
  }
};

const riskColor = (level: string) => {
  switch (level) {
    case 'low':
      return theme.colors.primaryDeep;
    case 'medium':
      return theme.colors.accent;
    case 'high':
      return theme.colors.danger;
    default:
      return '#64748b';
  }
};

const Bar: React.FC<{ value: number; maxValue: number; color: string; label: string; subLabel?: string }> = ({ value, maxValue, color, label, subLabel }) => {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <div className="gc-ml-bar">
      <span>{label}</span>
      <div className="gc-ml-bar__track">
        <div className="gc-ml-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <strong>{subLabel ?? value.toFixed(1)}</strong>
    </div>
  );
};

export const MLPage: React.FC = () => {
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
        <PageHero title="ML Insights" subtitle="Loading AI models..." icon="psychology" />
        <Card><div className="gc-inline-state">Loading ML Insights...</div></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gc-page">
        <PageHero title="ML Insights" subtitle="Model response failed" icon="psychology" />
        <Card>
          <EmptyState title="Failed to load insights" subtitle={error} icon="error" />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <button className="gc-button gc-button--primary" onClick={refetch}>Retry</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="gc-page">
      <PageHero title="ML Insights" subtitle="Seven AI models powering the fleet." icon="psychology" />

      {co2Prediction ? (
        <Card>
          <SectionTitle title="CO₂ Emission Prediction" subtitle="RandomForest regression on trip features" icon="cloud" />
          <div className="gc-model-head">
            <div className="gc-score-circle" style={{ background: gradeColor(co2Prediction.grade) }}>{co2Prediction.grade}</div>
            <div>
              <strong>{co2Prediction.predicted_co2_kg} kg CO₂</strong>
              <p>{co2Prediction.delta_kg > 0 ? '↓' : '↑'} {Math.abs(co2Prediction.delta_kg).toFixed(1)} kg vs baseline</p>
            </div>
          </div>
          <div className="gc-grid gc-grid--stats">
            <MetricChip label="CO₂/km" value={`${co2Prediction.co2_per_km} kg`} tone="blue" />
            <MetricChip label="Credits" value={`${co2Prediction.credits_earned}`} tone="green" />
            <MetricChip label="Value" value={`₹${co2Prediction.credits_inr}`} tone="amber" />
          </div>
        </Card>
      ) : null}

      {anomalyResult ? (
        <Card>
          <SectionTitle title="Anomaly Detection" subtitle="IsolationForest on driving telemetry" icon="warning" />
          <div className="gc-model-head">
            <div className="gc-dot" style={{ background: severityColor(anomalyResult.severity_level) }} />
            <div>
              <strong>{anomalyResult.is_anomaly ? 'Anomaly Detected' : 'Normal Behaviour'}</strong>
              <p>{anomalyResult.alert_message}</p>
            </div>
          </div>
          <div className="gc-grid gc-grid--stats">
            <MetricChip label="Severity" value={`${anomalyResult.severity_score}`} tone="amber" />
            <MetricChip label="Level" value={anomalyResult.severity_level.toUpperCase()} tone="red" />
          </div>
          <div className="gc-key-value-list">
            {Object.entries(anomalyResult.factors).map(([key, value]) => (
              <div key={key} className="gc-key-value-list__item">
                <span>{key.replace(/_/g, ' ')}</span>
                <BadgeTone value={value} />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {driverProfile ? (
        <Card>
          <SectionTitle title="Driver Behaviour Profile" subtitle="KMeans clustering (k=4)" icon="person" />
          <div className="gc-model-head">
            <div className="gc-profile-badge" style={{ background: driverProfile.color }}>
              <Icon name="directions_car" size={22} color="#fff" />
            </div>
            <div>
              <strong style={{ color: driverProfile.color }}>{driverProfile.badge}</strong>
              <p>Risk Score: {driverProfile.risk_score}</p>
            </div>
          </div>
          <div className="gc-stack gc-stack--tight">
            {driverProfile.coaching_tips.map((tip, index) => (
              <div key={index} className="gc-tip-row">
                <Icon name="lightbulb" size={14} color={theme.colors.accent} />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {creditForecast ? (
        <Card>
          <SectionTitle title="Carbon Credit Forecast" subtitle="30-day projection" icon="trending_up" />
          <div className="gc-grid gc-grid--stats">
            <MetricChip label="Total Credits" value={`${creditForecast.total_credits}`} tone="green" />
            <MetricChip label="Total Value" value={`₹${creditForecast.total_inr}`} tone="blue" />
            <MetricChip label="Avg/Day" value={`${creditForecast.avg_daily_credits}`} tone="slate" />
          </div>
          <div className="gc-ml-mini-title">Next 14 Days</div>
          <div className="gc-stack gc-stack--tight">
            {creditForecast.forecast.slice(0, 14).map(day => (
              <Bar
                key={day.date}
                value={day.credits}
                maxValue={1.2}
                color={day.day === 'Sat' || day.day === 'Sun' ? theme.colors.textMuted : theme.colors.primaryDeep}
                label={day.day}
                subLabel={`${day.credits.toFixed(3)} cr`}
              />
            ))}
          </div>
        </Card>
      ) : null}

      {routeRec ? (
        <Card>
          <SectionTitle title="Route Mode Recommendation" subtitle="GBClassifier on logistics features" icon="alt_route" />
          <div className="gc-model-head gc-model-head--center">
            <div className="gc-route-badge">
              <Icon name={routeRec.recommended_mode === 'rail' ? 'train' : routeRec.recommended_mode === 'road' ? 'local_shipping' : 'swap_horiz'} size={28} color="#fff" />
            </div>
            <div>
              <strong>{routeRec.recommended_mode.replace(/_/g, ' ').toUpperCase()}</strong>
              <p>{routeRec.confidence}% confidence</p>
            </div>
          </div>
          <div className="gc-grid gc-grid--stats">
            <MetricChip label="CO₂ Saved" value={`${routeRec.co2_saved_kg} kg`} tone="green" />
            <MetricChip label="Credits" value={`${routeRec.credits_earned}`} tone="green" />
            <MetricChip label="Value" value={`₹${routeRec.credits_inr}`} tone="blue" />
          </div>
          <div className="gc-ml-mini-title">Mode Comparison</div>
          <div className="gc-stack gc-stack--tight">
            {Object.entries(routeRec.alternatives).map(([mode, data]) => (
              <Bar key={mode} value={data.score} maxValue={100} color={mode === routeRec.recommended_mode ? theme.colors.primaryDeep : theme.colors.textMuted} label={mode.replace(/_/g, ' ')} subLabel={`${data.score}%`} />
            ))}
          </div>
        </Card>
      ) : null}

      {fuelWaste ? (
        <Card>
          <SectionTitle title="Fuel Waste Early Warning" subtitle="Pre-trip risk assessment" icon="local_gas_station" />
          <div className="gc-model-head gc-model-head--center">
            <div className="gc-risk-circle">
              <strong style={{ color: riskColor(fuelWaste.risk_level) }}>{fuelWaste.risk_pct}%</strong>
              <span>Risk</span>
            </div>
            <div className="gc-risk-badge" style={{ background: riskColor(fuelWaste.risk_level) }}>
              {fuelWaste.risk_level.toUpperCase()}
            </div>
          </div>
          <Card className="gc-inline-banner">
            <Icon name="info" size={16} color={theme.colors.info} />
            <span>{fuelWaste.recommendation}</span>
          </Card>
          <div className="gc-stack gc-stack--tight">
            {fuelWaste.risk_factors.map((factor, index) => (
              <div key={index} className="gc-tip-row">
                <Icon name="report_problem" size={14} color={theme.colors.accent} />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {shipmentScore ? (
        <Card>
          <SectionTitle title="Green Grade Scorer" subtitle="MLP neural network (128-64-32)" icon="verified" />
          <div className="gc-model-head">
            <div className="gc-score-circle gc-score-circle--lg" style={{ background: gradeColor(shipmentScore.grade) }}>
              {shipmentScore.grade}
            </div>
            <div>
              <strong>{shipmentScore.score} / 100</strong>
              <p>CO₂ ratio: {shipmentScore.co2_ratio}x baseline</p>
            </div>
          </div>
          <div className="gc-stack gc-stack--tight">
            {shipmentScore.improvement_tips.map((tip, index) => (
              <div key={index} className="gc-tip-row">
                <Icon name="tips_and_updates" size={14} color={theme.colors.primaryDeep} />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
};

const BadgeTone: React.FC<{ value: string }> = ({ value }) => {
  const tone = value === 'normal' ? 'green' : value === 'warning' ? 'amber' : value === 'high' ? 'red' : 'slate';
  return <span className={`gc-badge gc-badge--${tone}`}>{value}</span>;
};
