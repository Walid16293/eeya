import React from 'react';

export default function FastInput({
  label,
  value,
  onChange,
  suffix = 'DA',
  placeholder = '0',
  quickSteps = null,
  min = 0,
}) {
  const handleStep = (amount) => {
    const current = parseFloat(value) || 0;
    const nextVal = Math.max(min, current + amount);
    onChange(nextVal.toString());
  };

  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="fast-input"
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {quickSteps && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          {quickSteps.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => handleStep(step)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              +{step}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
