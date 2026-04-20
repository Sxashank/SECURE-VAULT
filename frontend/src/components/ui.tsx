import React from 'react';

export const OfficeBg = () => (
  <>
    <div className="deco-blob" style={{ width: 500, height: 500, top: -150, right: -100, background: 'radial-gradient(circle, rgba(234,88,12,0.07), transparent 70%)' }} />
    <div className="deco-blob" style={{ width: 400, height: 400, bottom: -100, left: -80, background: 'radial-gradient(circle, rgba(5,150,105,0.06), transparent 70%)' }} />
    <div className="deco-blob" style={{ width: 300, height: 300, top: '45%', left: '50%', background: 'radial-gradient(circle, rgba(217,119,6,0.06), transparent 70%)' }} />
  </>
);

const COLORS: Record<string, { bg: string; text: string; border: string }> = {
  orange: { bg: 'rgba(234,88,12,0.08)', text: '#ea580c', border: 'rgba(234,88,12,0.2)' },
  red:    { bg: 'rgba(220,38,38,0.08)', text: '#dc2626', border: 'rgba(220,38,38,0.2)' },
  green:  { bg: 'rgba(5,150,105,0.08)', text: '#059669', border: 'rgba(5,150,105,0.2)' },
  amber:  { bg: 'rgba(217,119,6,0.10)', text: '#d97706', border: 'rgba(217,119,6,0.2)' },
  teal:   { bg: 'rgba(13,148,136,0.08)', text: '#0d9488', border: 'rgba(13,148,136,0.2)' },
};

export const Badge = ({ children, color = 'orange' }: { children: React.ReactNode; color?: string }) => {
  const c = COLORS[color] || COLORS.orange;
  return (
    <span className="badge" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {children}
    </span>
  );
};

export const StatCard = ({ icon, label, value, sub, color = 'orange', cardColor = 'orange' }: any) => {
  const c = COLORS[color] || COLORS.orange;
  return (
    <div className={`office-card card-${cardColor} p-6 relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-4">
        <div className="icon-box" style={{ background: c.bg }}>
          <span className="material-symbols-outlined text-[22px]" style={{ color: c.text }}>{icon}</span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>{label}</span>
      </div>
      <p className="stat-num" style={{ color: c.text }}>{value}</p>
      <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{sub}</p>
    </div>
  );
};

export const SectionHead = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="flex justify-between items-center">
    <div className="section-head">{children}</div>
    {action}
  </div>
);
