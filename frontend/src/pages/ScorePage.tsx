import React from 'react';
import { useGreenScore } from '../../hooks/useGreenScore';
import { AchievementBadge, CarbonCreditCard, GreenScoreBadge } from '../components/Cards';
import { Card, EmptyState, SectionTitle } from '../components/UI';
import { PageHero } from '../components/Shell';

const achievements = [
  {
    id: '1',
    title: 'Green Pioneer',
    description: 'Completed first eco-friendly shipment',
    earned: true,
    earned_date: new Date().toISOString(),
    icon: 'eco',
    points: 50,
  },
  {
    id: '2',
    title: 'Efficiency Master',
    description: 'Achieved A+ rating for 5 consecutive shipments',
    earned: true,
    earned_date: new Date(Date.now() - 86400000).toISOString(),
    icon: 'stars',
    points: 100,
  },
  {
    id: '3',
    title: 'Carbon Hero',
    description: 'Saved 1000 kg of CO₂ emissions',
    earned: false,
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
  const overallScore = greenScores[0];

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

      <Card>
        <SectionTitle title="Carbon Credits" subtitle={`Total: ${totalCredits.toFixed(2)} credits`} icon="payments" />
        {loading && carbonCredits.length === 0 ? (
          <div className="gc-inline-state">Loading carbon credits...</div>
        ) : carbonCredits.length === 0 ? (
          <EmptyState title="No carbon credits yet" subtitle="Once the fleet starts saving CO₂, credits will appear here." icon="paid" />
        ) : (
          <div className="gc-stack">
            {carbonCredits.map(credit => (
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
