import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { OfficeBg } from '../components/ui';

const Field = ({ label, children }: any) => (
  <div>
    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{label}</label>
    {children}
  </div>
);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleName, setRoleName] = useState('USER');
  const [dept, setDept]       = useState('Engineering');
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ep = isLogin ? 'login' : 'signup';
      const payload = isLogin ? { email, password } : {
        email, password, roleName, fullName, departmentName: dept,
        teamName: roleName === 'MANAGER' ? teamName : undefined, teamCode
      };
      const { data } = await axios.post(`http://127.0.0.1:5001/api/auth/${ep}`, payload);
      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userName', data.fullName);
        navigate('/dashboard');
      } else {
        setIsLogin(true);
        alert('Account created! Please sign in.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Authentication failed');
    }
  };

  const sel = "office-input px-4 py-3 text-sm appearance-none";

  return (
    <div className="min-h-screen flex relative" style={{ background: 'var(--bg)' }}>
      <OfficeBg />

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col w-[42%] relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #ea580c 0%, #c2410c 40%, #d97706 100%)' }}>
        {/* Pattern overlay */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        {/* Color accent strips */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          {['#059669','#d97706','#dc2626','#0d9488','#ea580c'].map((c, i) => (
            <div key={i} className="flex-1" style={{ background: c }} />
          ))}
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[22px]">security</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>SecureVault</span>
          </div>

          <div className="mt-auto">
            <h2 className="text-4xl font-black text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Your documents,<br />
              <span className="text-white/70">perfectly secured.</span>
            </h2>
            <p className="text-white/70 text-sm leading-relaxed mb-10">
              Enterprise-grade document management with AES-256 encryption, role-based access, and real-time audit trails.
            </p>

            {/* Feature chips */}
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

          {/* Bottom color swatches */}
          <div className="flex gap-2 mt-10">
            {['bg-emerald-400','bg-amber-400','bg-red-400','bg-teal-400'].map(c => (
              <div key={c} className={`w-6 h-6 rounded-full ${c} opacity-80`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--orange)' }}>
              <span className="material-symbols-outlined text-white text-[18px]">security</span>
            </div>
            <span className="font-black text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--orange)' }}>SecureVault</span>
          </div>

          <h1 className="text-3xl font-black mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
            {isLogin ? 'Sign in to access your vault' : 'Register to get started'}
          </p>

          {/* Tab strip */}
          <div className="flex border-b mb-8" style={{ borderColor: 'var(--divider)' }}>
            {['Sign In', 'Register'].map((t, i) => (
              <button key={t} onClick={() => setIsLogin(i === 0)} className={`tab-btn ${isLogin === (i === 0) ? 'active' : ''}`}>{t}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Field label="Full Name">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: 'var(--muted2)' }}>person</span>
                  <input type="text" required placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} className="office-input pl-10 pr-4 py-3 text-sm" />
                </div>
              </Field>
            )}

            <Field label="Email">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: 'var(--muted2)' }}>mail</span>
                <input type="email" required placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className="office-input pl-10 pr-4 py-3 text-sm" />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: 'var(--muted2)' }}>lock</span>
                <input type={showPw ? 'text' : 'password'} required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="office-input pl-10 pr-12 py-3 text-sm" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity" style={{ color: 'var(--muted2)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {!isLogin && <>
              <Field label="Role">
                <select value={roleName} onChange={e => setRoleName(e.target.value)} className={sel}>
                  <option value="USER">User — Standard Access</option>
                  <option value="MANAGER">Manager — Team Access</option>
                  <option value="ADMIN">Admin — Full Access</option>
                </select>
              </Field>

              <Field label="Department">
                <select value={dept} onChange={e => setDept(e.target.value)} className={sel}>
                  {['Engineering','HR','Finance','Sales','Operations'].map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>

              {roleName === 'MANAGER' ? (
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--orange-bg)', border: '1px solid var(--border-dark)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--orange)' }}>Configure Team</p>
                  <input type="text" required placeholder="Team name" value={teamName} onChange={e => setTeamName(e.target.value)} className="office-input px-4 py-3 text-sm" />
                  <input type="text" required placeholder="Create invite code" value={teamCode} onChange={e => setTeamCode(e.target.value)} className="office-input px-4 py-3 text-sm" style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
              ) : (
                <Field label="Team Code (Optional)">
                  <input type="text" placeholder="Paste invite code" value={teamCode} onChange={e => setTeamCode(e.target.value)} className="office-input px-4 py-3 text-sm" style={{ fontFamily: 'var(--font-mono)' }} />
                </Field>
              )}
            </>}

            <button type="submit" className="btn-primary w-full py-3.5 text-sm justify-center mt-2">
              <span className="material-symbols-outlined text-[18px]">{isLogin ? 'login' : 'person_add'}</span>
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
            {isLogin ? "Don't have access? " : "Already registered? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--orange)' }}>
              {isLogin ? 'Request access' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
