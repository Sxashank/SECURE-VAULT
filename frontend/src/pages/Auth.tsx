import { SignIn, SignUp } from '@clerk/clerk-react';
import { useState, useEffect, useRef } from 'react';

/* ─── Animated particle canvas ───────────────────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      r: number; alpha: number;
      color: string;
    }

    const COLORS = ['#ff5e00','#ff0033','#39ff14','#00ffcc','#ffcc00'];
    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      // Draw connecting lines
      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = particles[i].color;
            ctx.globalAlpha = (1 - dist / 120) * 0.08;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

/* ─── Animated counter ────────────────────────────────────────────────────── */
function AnimCount({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 40);
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(id); }
      else setVal(start);
    }, 30);
    return () => clearInterval(id);
  }, [to]);
  return <>{val.toLocaleString()}{suffix}</>;
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const stats = [
    { value: 12500, suffix: '+', label: 'Documents Secured' },
    { value: 99,    suffix: '.9%', label: 'Uptime Guaranteed' },
    { value: 256,   suffix: '-bit', label: 'AES Encryption' },
  ];

  const features = [
    { icon: 'shield_lock',    title: 'Military-grade Encryption', desc: 'AES-256 end-to-end protection on every document', color: '#ff5e00' },
    { icon: 'group',          title: 'Team Collaboration',        desc: 'Role-based access across your entire organization', color: '#39ff14' },
    { icon: 'history_edu',    title: 'Full Audit Trail',          desc: 'Every action logged and timestamped in real-time', color: '#00ffcc' },
    { icon: 'manage_accounts', title: 'RBAC Controls',            desc: 'Admin, Manager, and User permission layers', color: '#ffcc00' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#020202',
        fontFamily: 'var(--font-display)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Global animated BG glows ─────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 700, height: 700, top: -200, left: -200,
          background: 'radial-gradient(circle, rgba(255,94,0,0.10) 0%, transparent 65%)',
          borderRadius: '50%', filter: 'blur(80px)',
          animation: 'floatA 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 600, height: 600, bottom: -150, right: -150,
          background: 'radial-gradient(circle, rgba(57,255,20,0.07) 0%, transparent 65%)',
          borderRadius: '50%', filter: 'blur(80px)',
          animation: 'floatB 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, top: '40%', left: '40%',
          background: 'radial-gradient(circle, rgba(255,0,51,0.06) 0%, transparent 65%)',
          borderRadius: '50%', filter: 'blur(60px)',
          animation: 'floatC 14s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes floatA { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,-40px) scale(1.1); } }
        @keyframes floatB { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,50px) scale(1.08); } }
        @keyframes floatC { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,-30px); } }
        @keyframes slideInLeft  { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px);  } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp       { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0); } }
        @keyframes scanline     { 0% { top: -2px; } 100% { top: 100%; } }
        @keyframes shimmer      { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        @keyframes spin         { to { transform: rotate(360deg); } }

        .auth-left  { animation: slideInLeft  0.7s cubic-bezier(.22,1,.36,1) both; }
        .auth-right { animation: slideInRight 0.7s cubic-bezier(.22,1,.36,1) both; }

        .feature-row {
          display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px;
          border-radius: 14px; border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
          transition: all 0.25s ease;
          cursor: default;
        }
        .feature-row:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
          transform: translateX(4px);
        }

        .stat-chip {
          text-align: center; padding: 14px 10px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: all 0.25s;
        }
        .stat-chip:hover {
          background: rgba(255,94,0,0.06);
          border-color: rgba(255,94,0,0.2);
        }

        .tab-pill {
          flex: 1; padding: 10px; border-radius: 10px; border: none;
          font-family: var(--font-display); font-weight: 700; font-size: 13px;
          letter-spacing: 0.5px; cursor: pointer; transition: all 0.25s;
        }
        .tab-pill.active {
          background: linear-gradient(135deg, #ff5e00, #ff0033);
          color: #fff;
          box-shadow: 0 4px 20px rgba(255,94,0,0.4);
        }
        .tab-pill.inactive {
          background: transparent; color: rgba(255,255,255,0.4);
        }
        .tab-pill.inactive:hover { color: rgba(255,255,255,0.8); }

        .clerk-container .cl-card {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        .clerk-container .cl-headerTitle,
        .clerk-container .cl-headerSubtitle { display: none !important; }

        .scan-line {
          position: absolute; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255,94,0,0.6), transparent);
          animation: scanline 4s linear infinite;
          pointer-events: none; z-index: 5;
        }

        .makee-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 20px;
          background: rgba(255,94,0,0.1); border: 1px solid rgba(255,94,0,0.3);
          font-size: 11px; font-weight: 800; letter-spacing: 2px;
          text-transform: uppercase; color: #ff5e00;
          font-family: var(--font-mono);
        }

        .glow-ring {
          position: absolute; border-radius: 50%;
          border: 1px solid rgba(255,94,0,0.15);
          animation: spin 20s linear infinite;
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════
          LEFT PANEL — Branding
      ═══════════════════════════════════════════════════════════════════ */}
      {mounted && (
        <div
          className="auth-left"
          style={{
            display: 'none',
            width: '48%',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            borderRight: '1px solid rgba(255,94,0,0.12)',
            flexDirection: 'column',
          }}
          id="auth-left-panel"
        >
          {/* Make visible via media query approach — use inline style trick */}
          <style>{`
            @media (min-width: 1024px) {
              #auth-left-panel { display: flex !important; }
            }
          `}</style>

          {/* Particle canvas */}
          <ParticleField />
          {/* Scan line */}
          <div className="scan-line" />

          {/* Decorative rotating rings */}
          <div className="glow-ring" style={{ width: 400, height: 400, top: '10%', left: '-100px' }} />
          <div className="glow-ring" style={{ width: 600, height: 600, top: '25%', left: '-200px', animationDirection: 'reverse', animationDuration: '30s', borderColor: 'rgba(57,255,20,0.08)' }} />

          {/* Top color bar */}
          <div style={{ display: 'flex', height: 3 }}>
            {['#059669','#ff5e00','#dc2626','#00ffcc','#ffcc00','#ff5e00','#39ff14'].map((c, i) => (
              <div key={i} style={{ flex: 1, background: c }} />
            ))}
          </div>

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '40px 48px' }}>

            {/* Logo block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, #ff5e00, #ff0033)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(255,94,0,0.5)',
                flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 24 }}>security</span>
              </div>
              <div>
                <p style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>SecureVault</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>ENTERPRISE EDITION</p>
              </div>
            </div>

            {/* MAKEE team badge */}
            <div style={{ marginBottom: 48, marginTop: 6 }}>
              <span className="makee-badge">
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>corporate_fare</span>
                MAKEE Team
              </span>
            </div>

            {/* Hero text */}
            <div style={{ marginBottom: 40 }}>
              <h1 style={{
                fontSize: 'clamp(32px, 3.5vw, 48px)', fontWeight: 900,
                lineHeight: 1.1, margin: 0, marginBottom: 16,
                color: '#fff', letterSpacing: '-1px',
              }}>
                Your documents,{' '}
                <span style={{
                  background: 'linear-gradient(90deg, #ff5e00, #ff0033)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(255,94,0,0.4))',
                }}>
                  perfectly secured.
                </span>
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0, maxWidth: 380 }}>
                Enterprise-grade document management with AES-256 encryption,
                role-based access, and real-time audit trails — built for the <strong style={{ color: '#ff5e00' }}>MAKEE</strong> team.
              </p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 40 }}>
              {stats.map((s, i) => (
                <div key={i} className="stat-chip">
                  <p style={{
                    fontSize: 22, fontWeight: 900, margin: 0, marginBottom: 2,
                    background: 'linear-gradient(90deg, #ff5e00, #ffcc00)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    <AnimCount to={s.value} suffix={s.suffix} />
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {features.map(({ icon, title, desc, color }) => (
                <div key={title} className="feature-row">
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${color}1a`, border: `1px solid ${color}30`,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>{icon}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 2 }}>{title}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer color dots */}
            <div style={{ display: 'flex', gap: 8, marginTop: 32 }}>
              {['#ff5e00','#39ff14','#ff0033','#00ffcc','#ffcc00'].map(c => (
                <div key={c} style={{
                  width: 8, height: 8, borderRadius: '50%', background: c,
                  boxShadow: `0 0 8px ${c}`,
                  animation: 'shimmer 2s ease-in-out infinite',
                  animationDelay: `${Math.random() * 1.5}s`,
                }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT PANEL — Auth Form
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1, minHeight: '100vh', position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '32px 24px', overflowY: 'auto',
        }}
      >
        {mounted && (
          <div
            className="auth-right"
            style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Mobile logo */}
            <div
              id="mobile-logo"
              style={{ display: 'none', alignItems: 'center', gap: 12, marginBottom: 28 }}
            >
              <style>{`
                @media (max-width: 1023px) { #mobile-logo { display: flex !important; } }
              `}</style>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #ff5e00, #ff0033)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(255,94,0,0.4)',
              }}>
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 20 }}>security</span>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 900, fontSize: 18, color: '#fff' }}>SecureVault</p>
                <span className="makee-badge" style={{ fontSize: 9, padding: '2px 8px' }}>MAKEE Team</span>
              </div>
            </div>

            {/* Card container */}
            <div style={{
              width: '100%',
              background: 'rgba(10,10,10,0.7)',
              border: '1px solid rgba(255,94,0,0.15)',
              borderRadius: 24,
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)',
              overflow: 'hidden',
            }}>
              {/* Top accent bar */}
              <div style={{ height: 3, display: 'flex', borderRadius: '24px 24px 0 0' }}>
                {['#ff5e00','#ff0033','#ffcc00','#39ff14','#00ffcc'].map((c, i) => (
                  <div key={i} style={{ flex: 1, background: c }} />
                ))}
              </div>

              <div style={{ padding: '32px 32px 28px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                    background: 'linear-gradient(135deg, rgba(255,94,0,0.2), rgba(255,0,51,0.15))',
                    border: '1px solid rgba(255,94,0,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(255,94,0,0.2)',
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#ff5e00', fontSize: 26 }}>
                      {isLogin ? 'login' : 'person_add'}
                    </span>
                  </div>
                  <h2 style={{ margin: 0, marginBottom: 6, fontWeight: 900, fontSize: 22, color: '#fff' }}>
                    {isLogin ? 'Welcome back' : 'Create your account'}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                    {isLogin
                      ? 'Sign in to your MAKEE SecureVault workspace'
                      : 'Join the MAKEE team on SecureVault'}
                  </p>
                </div>

                {/* Tab switcher */}
                <div style={{
                  display: 'flex', gap: 6, padding: 6,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 14, marginBottom: 28,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <button
                    className={`tab-pill ${isLogin ? 'active' : 'inactive'}`}
                    onClick={() => setIsLogin(true)}
                  >
                    Sign In
                  </button>
                  <button
                    className={`tab-pill ${!isLogin ? 'active' : 'inactive'}`}
                    onClick={() => setIsLogin(false)}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Clerk component */}
                <div className="clerk-container" style={{ width: '100%' }}>
                  {isLogin ? (
                    <SignIn routing="virtual" afterSignInUrl="/dashboard" />
                  ) : (
                    <SignUp routing="virtual" afterSignUpUrl="/dashboard" />
                  )}
                </div>
              </div>

              {/* Footer strip */}
              <div style={{
                padding: '14px 32px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#39ff14',
                  boxShadow: '0 0 8px #39ff14', animation: 'shimmer 2s ease-in-out infinite',
                }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
                  MAKEE · SECURED BY SECUREVAULT · AES-256
                </span>
              </div>
            </div>

            {/* Toggle link below card */}
            <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 20 }}>
              {isLogin ? "Don't have access? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#ff5e00', fontWeight: 700, fontSize: 13,
                  fontFamily: 'var(--font-display)',
                  textDecoration: 'underline', textDecorationStyle: 'dotted',
                }}
              >
                {isLogin ? 'Create an account →' : 'Sign in →'}
              </button>
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { icon: 'shield_lock', label: 'AES-256', color: '#ff5e00' },
                { icon: 'verified_user', label: 'SOC 2', color: '#39ff14' },
                { icon: 'lock', label: 'End-to-End', color: '#00ffcc' },
              ].map(({ icon, label, color }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color }}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
