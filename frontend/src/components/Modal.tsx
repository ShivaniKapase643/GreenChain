import React, { useEffect, useState } from 'react';
import { Card, Icon, Button, Badge } from './UI';
import { theme } from '../theme';

export type RouteAlternative = {
  id: string;
  original_co2_kg: number;
  alternative_route: string;
  alternative_vehicle: string;
  estimated_co2_saving_pct: number;
  estimated_time_delta_mins: number;
  cost_implication_inr: number;
  gemini_reasoning: string;
  created_at: string;
};

export const RouteCompareModal: React.FC<{
  visible: boolean;
  shipmentId: string;
  alternatives: RouteAlternative[];
  loading?: boolean;
  onClose: () => void;
  onConfirm?: (alternative: RouteAlternative) => void;
}> = ({ visible, shipmentId, alternatives, loading = false, onClose, onConfirm }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedId(null);
    }
  }, [visible]);

  if (!visible) return null;

  const selected = alternatives.find(alternative => alternative.id === selectedId) ?? null;

  return (
    <div className="gc-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="gc-modal" role="dialog" aria-modal="true" aria-labelledby="route-modal-title" onClick={event => event.stopPropagation()}>
        <div className="gc-modal__head">
          <div>
            <h3 id="route-modal-title">Route Alternatives</h3>
            <p>Shipment {shipmentId}</p>
          </div>
          <button className="gc-icon-button" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" size={18} color={theme.colors.textSoft} />
          </button>
        </div>

        <div className="gc-modal__body">
          {loading ? (
            <div className="gc-inline-state">Loading route alternatives...</div>
          ) : alternatives.length === 0 ? (
            <div className="gc-empty-state gc-empty-state--compact">
              <div className="gc-empty-state__icon">
                <Icon name="route" size={30} color={theme.colors.textSoft} />
              </div>
              <h3>No alternative routes available</h3>
              <p>Try again later or contact support.</p>
            </div>
          ) : alternatives.map((alternative, index) => {
            const isSelected = selectedId === alternative.id;
            const timeDelta = alternative.estimated_time_delta_mins;
            const costDelta = alternative.cost_implication_inr;

            return (
              <div key={alternative.id} className={`gc-route-option ${isSelected ? 'is-selected' : ''}`}>
                <div className="gc-route-option__top">
                  <strong>Alternative #{index + 1}: {alternative.alternative_vehicle}</strong>
                  <Badge tone="green">{Math.abs(alternative.estimated_co2_saving_pct).toFixed(1)}% CO₂ saving</Badge>
                </div>
                <div className="gc-route-option__grid">
                  <div>
                    <span>Original CO₂</span>
                    <strong>{alternative.original_co2_kg.toFixed(2)} kg</strong>
                  </div>
                  <div>
                    <span>Time Change</span>
                    <strong style={{ color: timeDelta >= 0 ? theme.colors.danger : theme.colors.success }}>
                      {timeDelta === 0 ? 'No change' : timeDelta > 0 ? `+${timeDelta} min` : `${timeDelta} min`}
                    </strong>
                  </div>
                  <div>
                    <span>Cost Impact</span>
                    <strong style={{ color: costDelta >= 0 ? theme.colors.danger : theme.colors.success }}>
                      {costDelta === 0 ? 'No change' : costDelta > 0 ? `+₹${Math.abs(costDelta).toFixed(2)}` : `-₹${Math.abs(costDelta).toFixed(2)}`}
                    </strong>
                  </div>
                  <div>
                    <span>Reasoning</span>
                    <p>{alternative.gemini_reasoning}</p>
                  </div>
                </div>
                <button className="gc-button gc-button--secondary gc-route-option__select" onClick={() => setSelectedId(alternative.id)}>
                  {isSelected ? 'Selected' : 'Select Route'}
                </button>
              </div>
            );
          })}
        </div>

        {alternatives.length > 0 ? (
          <div className="gc-modal__footer">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!selected}
              onClick={() => {
                if (selected && onConfirm) {
                  onConfirm(selected);
                }
                onClose();
              }}
            >
              Confirm Selection
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
