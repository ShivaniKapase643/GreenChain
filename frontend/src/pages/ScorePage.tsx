import React, { useMemo } from 'react';
import { useGreenScore } from '../../hooks/useGreenScore';
import { useShipments } from '../../hooks/useShipments';
import { AchievementBadge, CarbonCreditCard, GreenScoreBadge } from '../components/Cards';
import { Card, EmptyState, Icon, SectionTitle } from '../components/UI';
import { PageHero } from '../components/Shell';
import { theme } from '../theme';

const INDIA_BASELINE_CO2_PER_KM = 0.9;
const CREDIT_PRICE_INR = 800;

const baseAchievements = (totalCredits: number, savings: number) => [
  {
    id: '1',
    title: 'Green Pioneer',
    description: 'Completed first eco-friendly shipment',
    earned: totalCredits > 0,
    earned_date: new Date().toISOString(),
    icon: 'eco',
    points: 50,
  },
  {
    id: '2',
    title: 'Efficiency Master',
    description: 'Achieved A+ rating for 5 consecutive shipments',
    earned: totalCredits >= 0.5,
    earned_date: new Date(Date.now() - 86400000).toISOString(),
    icon: 'stars',
    points: 100,
  },
  {
    id: '3',
    title: 'Carbon Hero',
    description: 'Saved 1000 kg of CO₂ emissions',
    earned: savings >= 1000,
    icon: 'favorite',
    points: 200,
  },
  {
    id: '4',
    title: 'Route Optimizer',
    description: 'Used alternative routes 10 times',
    earned: false,
    icon: 'route',
    points: 150,
  },
];

export const ScorePage: React.FC = () => {
  const { greenScores, carbonCredits, totalCredits, loading } = useGreenScore();
  const { shipments } = useShipments();

  const overallScore = greenScores[0];

  // Always derive from shipments if API didn't return credits, so the page is never empty.
  const derivedCredits = useMemo(() => {
    if (carbonCredits.length > 0) return carbonCredits;
    if (shipments.length === 0) return [];

    return shipments
      .filter(s => (s.distance_covered_km ?? 0) > 0)
      .map(s => {
        const distance = s.distance_covered_km ?? 0;
        const actual = s.total_co2_kg ?? 0;
        const baseline = distance * INDIA_BASELINE_CO2_PER_KM;
        const saved = Math.max(0, baseline - actual);
        const credits = Number((saved / 1000).toFixed(3));
        return {
          id: `derived-${s.shipment_id}`,
          shipment_id: s.shipment_id,
          credits_earned: credits,
          baseline_co2_kg: baseline,
          actual_co2_kg: actual,
          co2_saved_kg: saved,
          credit_value_inr: Number((credits * CREDIT_PRICE_INR).toFixed(2)),
          created_at: s.updated_at,
        };
      })
      .filter(c => c.credits_earned > 0)
      .sort((a, b) => b.credits_earned - a.credits_earned);
  }, [carbonCredits, shipments]);

  const totals = useMemo(() => {
    const credits = derivedCredits.reduce((sum, c) => sum + c.credits_earned, 0);
    const savings = derivedCredits.reduce((sum, c) => sum + c.co2_saved_kg, 0);
    const value = derivedCredits.reduce((sum, c) => sum + c.credit_value_inr, 0);
    return { credits, savings, value };
  }, [derivedCredits]);

  const effectiveTotalCredits = totalCredits > 0 ? totalCredits : totals.credits;
  const achievements = baseAchievements(effectiveTotalCredits, totals.savings);

  return (
    <div className="gc-page">
      <PageHero
        title="Green Score"
        subtitle="Track sustainability metrics, carbon credit value, and milestone progress."
        icon="eco"
      />

      <div className="gc-score-hero">
        <GreenScoreBadge
          score={overallScore?.green_score ?? 'B'}
          value={overallScore?.green_score_value ?? 75}
          label="Overall Green Score"
          size="large"
        />
      </div>

      <div className="gc-kpi-strip">
        <div className="gc-kpi">
          <div className="gc-kpi__label">
            <Icon name="paid" size={14} color={theme.colors.primaryDeep} />
            Credits earned
          </div>
          <div className="gc-kpi__value">{effectiveTotalCredits.toFixed(2)}</div>
          <div className="gc-kpi__sub">across the fleet</div>
        </div>
        <div className="gc-kpi">
          <div className="gc-kpi__label">
            <Icon name="currency_rupee" size={14} color={theme.colors.primaryDeep} />
            Estimated value
          </div>
          <div className="gc-kpi__value">₹{totals.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="gc-kpi__sub">at ₹{CREDIT_PRICE_INR} / credit</div>
        </div>
        <div className="gc-kpi">
          <div className="gc-kpi__label">
            <Icon name="cloud_off" size={14} color={theme.colors.primaryDeep} />
            CO₂ saved
          </div>
          <div className="gc-kpi__value">{totals.savings.toFixed(0)} kg</div>
          <div className="gc-kpi__sub">vs India baseline</div>
        </div>
        <div className="gc-kpi">
          <div className="gc-kpi__label">
            <Icon name="local_shipping" size={14} color={theme.colors.primaryDeep} />
            Qualifying shipments
          </div>
          <div className="gc-kpi__value">{derivedCredits.length}</div>
          <div className="gc-kpi__sub">earned credits</div>
        </div>
      </div>

      <Card>
        <SectionTitle
          title="Carbon Credits Ledger"
          subtitle={`Total: ${effectiveTotalCredits.toFixed(2)} credits · ₹${totals.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })} value`}
          icon="payments"
        />
        {loading && derivedCredits.length === 0 ? (
          <div className="gc-inline-state">Loading carbon credits…</div>
        ) : derivedCredits.length === 0 ? (
          <EmptyState title="No carbon credits yet" subtitle="Once the fleet starts saving CO₂, credits will appear here." icon="paid" />
        ) : (
          <div className="gc-stack">
            {derivedCredits.map(credit => (
              <CarbonCreditCard key={credit.id} credit={credit} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle title="Achievements" subtitle="Your sustainability milestones" icon="emoji_events" />
        <div className="gc-stack">
          {achievements.map(achievement => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </Card>
    </div>
  );
};
