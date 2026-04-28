import { SignIn, SignUp } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import { OfficeBg } from '../components/ui';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  return (
    <div className="min-h-screen flex relative" style={{ background: '#fffaf5', color: '#111827' }}>
      <OfficeBg />

      <div
        className="hidden lg:flex flex-col w-[42%] relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #ea580c 0%, #c2410c 40%, #d97706 100%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="absolute top-0 left-0 right-0 h-1 flex">
          {['#059669', '#d97706', '#dc2626', '#0d9488', '#ea580c'].map((c, i) => (
            <div key={i} className="flex-1" style={{ background: c }} />
          ))}
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[22px]">security</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              SecureVault
            </span>
          </div>

          <div className="mt-auto">
            <h2 className="text-4xl font-black text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Your documents,<br />
              <span className="text-white/70">perfectly secured.</span>
            </h2>
            <p className="text-white/70 text-sm leading-relaxed mb-10">
              Enterprise-grade document management with AES-256 encryption, role-based access, and real-time audit trails.
            </p>

            {[
              { icon: 'shield_lock', text: 'AES-256 Encryption' },
              { icon: 'group', text: 'Team Collaboration' },
              { icon: 'history_edu', text: 'Full Audit Trail' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[18px]">{icon}</span>
                </div>
                <span className="text-white/90 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-10">
            {['bg-emerald-400', 'bg-amber-400', 'bg-red-400', 'bg-teal-400'].map(c => (
              <div key={c} className={`w-6 h-6 rounded-full ${c} opacity-80`} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--orange)' }}>
              <span className="material-symbols-outlined text-white text-[18px]">security</span>
            </div>
            <span className="font-black text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--orange)' }}>
              SecureVault
            </span>
          </div>

          <div className="clerk-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {mode === 'signup' ? (
              <SignUp routing="virtual" afterSignUpUrl="/dashboard" signInUrl="/auth" />
            ) : (
              <SignIn routing="virtual" afterSignInUrl="/dashboard" signUpUrl="/auth?mode=signup" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
