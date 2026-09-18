import React from 'react';
import { AlertOctagon, AlertTriangle, TrendingUp, Info } from 'lucide-react';

export default function SentinelBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 16px' }}>
      {alerts.map((alert, idx) => {
        const isDanger = alert.severity === 'danger';
        const isWarning = alert.severity === 'warning';
        const isSuccess = alert.severity === 'success';

        const Icon = isDanger
          ? AlertOctagon
          : isWarning
          ? AlertTriangle
          : isSuccess
          ? TrendingUp
          : Info;

        return (
          <div key={idx} className={`sentinel-banner ${alert.severity}`}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              <Icon size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '2px' }}>
                {alert.title}
              </div>
              <div style={{ fontSize: '0.82rem', opacity: 0.9, lineHeight: 1.4 }}>
                {alert.message}
              </div>
              {alert.recommendedAction && (
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  👉 {alert.recommendedAction}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
