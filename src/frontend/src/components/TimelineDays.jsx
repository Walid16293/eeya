import React from 'react';
import { Check } from 'lucide-react';

export default function TimelineDays({ currentDay, metrics = [], selectedDay, onSelectDay }) {
  const days = [1, 2, 3, 4, 5, 6];

  return (
    <div style={{ margin: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Cycle de Test (6 Jours)
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
          {currentDay > 0 ? `Jour ${currentDay} sur 6` : 'Prêt à démarrer'}
        </span>
      </div>

      <div className="timeline-track">
        {days.map((day) => {
          const metric = metrics.find((m) => m.dayNumber === day);
          const isCompleted = !!metric;
          const isSelected = selectedDay === day;
          const isToday = currentDay === day;

          return (
            <div
              key={day}
              className={`day-node ${isSelected ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => onSelectDay(day)}
            >
              <div
                className="day-circle"
                style={{
                  background: isSelected
                    ? 'var(--accent-cyan)'
                    : isCompleted
                    ? 'var(--accent-fayda)'
                    : '#1e293b',
                  borderColor: isSelected
                    ? '#fff'
                    : isCompleted
                    ? '#34d399'
                    : isToday
                    ? 'var(--accent-cyan)'
                    : '#334155',
                  color: isSelected ? '#000' : '#fff',
                }}
              >
                {isCompleted && !isSelected ? <Check size={16} /> : day}
              </div>
              <span
                className="day-label"
                style={{
                  color: isSelected
                    ? 'var(--accent-cyan)'
                    : isCompleted
                    ? 'var(--accent-fayda)'
                    : 'var(--text-dim)',
                  fontWeight: isSelected || isCompleted ? 700 : 500,
                }}
              >
                J{day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
