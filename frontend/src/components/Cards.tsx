import React from 'react';
import { Card, Icon, Badge } from './UI';
import { theme } from '../theme';

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));

const formatTime = (dateString: string) =>
  new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));

const formatCurrency = (value: number) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)}`;

const gradeColor = (score?: string) => {
  const normalized = (score ?? '').toUpperCase();
  switch (normalized) {
    case 'A+':
    case 'A':
      return theme.colors.success;
    case 'B':
      return theme.colors.primaryDeep;
    case 'C':
      return theme.colors.warning;
    case 'D':
      return theme.colors.secondary;
    case 'F':
      return theme.colors.danger;
    default:
      return '#64748b';
  }
};

const vehicleIcon = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized.includes('train') || normalized.includes('rail')) return 'train';
  if (normalized.includes('ev') || normalized.includes('electric')) return 'electric_bolt';
  if (normalized.includes('ship')) return 'directions_boat';
  return 'local_shipping';
};

const vehicleLabel = (type: string) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

export type Shipment = {
  id: string;
  shipment_id: string;
  origin: string;
  destination: string;
  current_lat?: number;
  current_lng?: number;
  speed_kmh?: number;
  fuel_consumed_liters?: number;
  distance_covered_km?: number;
  total_distance_km: number;
  eta_minutes?: number;
  status: string;
  vehicle_type: string;
  cargo_weight_tons?: number;
  driver_score?: number;
  green_score?: string;
  green_score_value?: number;
  predicted_final_co2_kg?: number;
  total_co2_kg?: number;
  co2_per_km?: number;
  created_at: string;
  updated_at: string;
};

export const ShipmentCard: React.FC<{ shipment: Shipment; onClick?: () => void }> = ({ shipment, onClick }) => {
  const progress = shipment.distance_covered_km
    ? Math.min(100, (shipment.distance_covered_km / Math.max(1, shipment.total_distance_km)) * 100)
    : 0;

  return (
    <button className="gc-entity-card gc-entity-card--clickable" onClick={onClick}>
      <div className="gc-entity-card__head">
        <div>
          <div className="gc-entity-card__id">{shipment.shipment_id}</div>
          <div className="gc-entity-card__route">{shipment.origin} → {shipment.destination}</div>
        </div>
        <div className="gc-entity-card__meta">
          <Badge tone={shipment.status === 'in_transit' ? 'green' : 'amber'}>
            {shipment.status.replace(/_/g, ' ')}
          </Badge>
          <span className="gc-score-chip" style={{ background: `${gradeColor(shipment.green_score)}22`, color: gradeColor(shipment.green_score) }}>
            {shipment.green_score ?? 'N/A'}
          </span>
        </div>
      </div>

      <div className="gc-route-progress">
        <span>{shipment.origin}</span>
        <div className="gc-route-progress__track">
          <div className="gc-route-progress__fill" style={{ width: `${progress}%` }} />
        </div>
        <span>{shipment.destination}</span>
      </div>

      <div className="gc-entity-grid">
        <div><Icon name="speed" size={16} color={theme.colors.textSoft} /><strong>{shipment.speed_kmh?.toFixed(1) ?? '0'} km/h</strong></div>
        <div><Icon name="local_gas_station" size={16} color={theme.colors.textSoft} /><strong>{shipment.fuel_consumed_liters?.toFixed(1) ?? '0'} L</strong></div>
        <div><Icon name={vehicleIcon(shipment.vehicle_type)} size={16} color={theme.colors.textSoft} /><strong>{vehicleLabel(shipment.vehicle_type)}</strong></div>
        <div><Icon name="eco" size={16} color={theme.colors.textSoft} /><strong>{shipment.predicted_final_co2_kg?.toFixed(1) ?? '0'} kg CO₂</strong></div>
      </div>
    </button>
  );
};

export const AlertBanner: React.FC<{
  alert: {
    id: string;
    shipment_id: string;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    is_read: boolean;
    created_at: string;
  };
  onDismiss?: (id: string) => void;
  onClick?: (id: string) => void;
}> = ({ alert, onDismiss, onClick }) => {
  const severityColor = alert.severity === 'low'
    ? theme.colors.info
    : alert.severity === 'medium'
      ? theme.colors.warning
      : alert.severity === 'high'
        ? theme.colors.secondary
        : theme.colors.danger;

  const alertIcon = alert.alert_type.includes('emission')
    ? 'warning'
    : alert.alert_type.includes('fuel')
      ? 'local_gas_station'
      : alert.alert_type.includes('delay')
        ? 'schedule'
        : alert.alert_type.includes('route')
          ? 'route'
          : 'notifications';

  return (
    <div className="gc-alert" role="button" tabIndex={0} onClick={() => onClick?.(alert.id)}>
      <div className="gc-alert__icon" style={{ color: severityColor, background: `${severityColor}15` }}>
        <Icon name={alertIcon} size={20} color={severityColor} />
      </div>
      <div className="gc-alert__body">
        <div className="gc-alert__top">
          <strong style={{ color: severityColor }}>{alert.alert_type.replace(/_/g, ' ')}</strong>
          <span>{formatTime(alert.created_at)}</span>
        </div>
        <p>{alert.message}</p>
        <small>Shipment {alert.shipment_id}</small>
      </div>
      {onDismiss ? (
        <button className="gc-icon-button" onClick={(event) => { event.stopPropagation(); onDismiss(alert.id); }} aria-label="Dismiss alert">
          <Icon name="close" size={18} color={theme.colors.textSoft} />
        </button>
      ) : null}
    </div>
  );
};

export const GreenScoreBadge: React.FC<{
  score: string;
  value?: number;
  label?: string;
  size?: 'small' | 'normal' | 'large';
}> = ({ score, value, label = 'Green Score', size = 'normal' }) => {
  const color = gradeColor(score);

  const sizeClass = size === 'small' ? 'gc-green-score--sm' : size === 'large' ? 'gc-green-score--lg' : 'gc-green-score--md';

  return (
    <div className={`gc-green-score ${sizeClass}`} style={{ borderColor: color }}>
      <div className="gc-green-score__head">
        <strong style={{ color }}>{label}</strong>
        {typeof value === 'number' ? <span>{value.toFixed(1)}</span> : null}
      </div>
      <div className="gc-green-score__value">
        <div style={{ color }}>{score}</div>
        <Icon name="eco" size={size === 'large' ? 28 : size === 'small' ? 16 : 22} color={color} />
      </div>
    </div>
  );
};

export const CarbonCreditCard: React.FC<{
  credit: {
    id: string;
    shipment_id: string;
    credits_earned: number;
    baseline_co2_kg: number;
    actual_co2_kg: number;
    co2_saved_kg: number;
    credit_value_inr: number;
    created_at: string;
  };
}> = ({ credit }) => (
  <Card className="gc-credit-card">
    <div className="gc-credit-card__head">
      <div className="gc-credit-card__amount">
        <Icon name="paid" size={24} color={theme.colors.success} />
        <div>
          <strong>{credit.credits_earned.toFixed(2)}</strong>
          <span>Carbon Credits Earned</span>
        </div>
      </div>
      <Badge tone="green">{formatDate(credit.created_at)}</Badge>
    </div>
    <div className="gc-credit-card__grid">
      <div><Icon name="trending_up" size={16} color={theme.colors.success} /><span>CO₂ Saved</span><strong>{credit.co2_saved_kg.toFixed(2)} kg</strong></div>
      <div><Icon name="currency_exchange" size={16} color={theme.colors.info} /><span>Value</span><strong>{formatCurrency(credit.credit_value_inr)}</strong></div>
      <div><Icon name="flag_circle" size={16} color={theme.colors.textSoft} /><span>Baseline</span><strong>{credit.baseline_co2_kg.toFixed(2)} kg</strong></div>
      <div><Icon name="check_circle" size={16} color={theme.colors.success} /><span>Actual</span><strong>{credit.actual_co2_kg.toFixed(2)} kg</strong></div>
    </div>
    <div className="gc-credit-card__foot">Shipment {credit.shipment_id}</div>
  </Card>
);

export const AchievementBadge: React.FC<{
  achievement: {
    id: string;
    title: string;
    description: string;
    earned: boolean;
    earned_date?: string;
    icon: string;
    points: number;
  };
}> = ({ achievement }) => (
  <div className={`gc-achievement ${achievement.earned ? 'gc-achievement--earned' : 'gc-achievement--locked'}`}>
    <div className={`gc-achievement__icon ${achievement.earned ? 'is-earned' : 'is-locked'}`}>
      <Icon name={achievement.icon} size={32} color={achievement.earned ? '#fff' : theme.colors.textSoft} />
      {!achievement.earned ? <Icon name="lock" size={14} color="#fff" className="gc-achievement__lock" /> : null}
    </div>
    <div className="gc-achievement__content">
      <strong>{achievement.title}</strong>
      <p>{achievement.description}</p>
      {achievement.earned && achievement.earned_date ? <small>Earned {formatDate(achievement.earned_date)}</small> : null}
    </div>
    <div className="gc-achievement__points">
      <strong>{achievement.points}</strong>
      <Icon name="emoji_events" size={16} color={theme.colors.warning} />
    </div>
  </div>
);

export const DriverScoreCard: React.FC<{
  driver: {
    driver_id: string;
    name: string;
    score: number;
    shipments_completed: number;
    avg_eta_accuracy: number;
    co2_efficiency: number;
    ranking: number;
  };
}> = ({ driver }) => {
  const rankTone = driver.ranking === 1 ? 'amber' : driver.ranking <= 3 ? 'blue' : 'slate';
  const scoreColor = driver.score >= 90 ? theme.colors.success : driver.score >= 80 ? theme.colors.primaryDeep : driver.score >= 70 ? theme.colors.warning : driver.score >= 60 ? theme.colors.secondary : theme.colors.danger;
  const rankLabel = driver.ranking === 1 ? '1st' : driver.ranking === 2 ? '2nd' : driver.ranking === 3 ? '3rd' : `#${driver.ranking}`;
  const rankIcon = driver.ranking <= 3 ? 'emoji_events' : 'grading';

  return (
    <Card className="gc-driver-card">
      <div className="gc-driver-card__head">
        <div className="gc-driver-card__rank">
          <div className={`gc-driver-card__rank-badge gc-driver-card__rank-badge--${rankTone}`}>
            <Icon name={rankIcon} size={22} color={driver.ranking <= 3 ? '#fff' : theme.colors.textSoft} />
            <span>{rankLabel}</span>
          </div>
        </div>
        <div className="gc-driver-card__info">
          <strong>{driver.name}</strong>
          <span>ID: {driver.driver_id}</span>
        </div>
      </div>
      <div className="gc-driver-card__score" style={{ borderColor: scoreColor }}>
        <strong style={{ color: scoreColor }}>{driver.score.toFixed(0)}</strong>
        <span>Driver Score</span>
      </div>
      <div className="gc-driver-card__metrics">
        <div><Icon name="local_shipping" size={16} color={theme.colors.textSoft} /><span>Shipments</span><strong>{driver.shipments_completed}</strong></div>
        <div><Icon name="schedule" size={16} color={theme.colors.textSoft} /><span>ETA Acc.</span><strong>{driver.avg_eta_accuracy.toFixed(1)}%</strong></div>
        <div><Icon name="eco" size={16} color={theme.colors.textSoft} /><span>CO₂ Eff.</span><strong>{driver.co2_efficiency.toFixed(2)}</strong></div>
      </div>
    </Card>
  );
};
