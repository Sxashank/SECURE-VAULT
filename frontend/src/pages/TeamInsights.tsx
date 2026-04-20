import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { OfficeBg, Badge, SectionHead } from '../components/ui';

export default function TeamInsights() {
  const [insights, setInsights]   = useState<any[]>([]);
  const [suspicious, setSuspicious] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      axios.get('http://127.0.0.1:5001/api/audit/team',      { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('http://127.0.0.1:5001/api/audit/suspicious', { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([i, s]) => {
      setInsights(i.data.insights || []);
      setSuspicious(s.data.alerts || []);
    }).catch(console.error);
  }, []);

  const avatarColors = ['#ea580c','#059669','#d97706','#0d9488','#dc2626','#92400e'];

  const uniqueMembers = [...new Set(insights.map((i: any) => i.user_name))].filter(Boolean);

  return (
    <div className="min-h-screen p-8 relative" style={{ background: 'var(--bg)' }}>
      <OfficeBg />
      <div className="max-w-6xl mx-auto relative z-10 space-y-8">

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Team Insights</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Forensic analysis and live activity streams for your team</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary px-4 py-2.5 text-sm">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </button>
        </header>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Events', val: insights.length, icon: 'timeline', color: 'orange' },
            { label: 'Members Active', val: uniqueMembers.length, icon: 'group', color: 'teal' },
            { label: 'Unique Actions', val: [...new Set(insights.map((i: any) => i.action))].length, icon: 'bolt', color: 'amber' },
            { label: 'Threat Alerts', val: suspicious.length, icon: 'gpp_bad', color: suspicious.length > 0 ? 'red' : 'green' },
          ].map(({ label, val, icon, color }) => (
            <div key={label} className={`office-card card-${color} p-4`}>
              <div className="flex items-center gap-3">
                <div className="icon-box" style={{ background: `rgba(${color === 'orange' ? '234,88,12' : color === 'teal' ? '13,148,136' : color === 'amber' ? '217,119,6' : color === 'red' ? '220,38,38' : '5,150,105'},0.1)` }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ color: `var(--${color})` }}>{icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-black" style={{ fontFamily: 'var(--font-display)', color: `var(--${color})` }}>{val}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Activity feed */}
          <div className="col-span-2 office-card overflow-hidden flex flex-col" style={{ height: '60vh' }}>
            <div className="h-1 flex">
              {['var(--orange)','var(--amber)','var(--teal)','var(--green)'].map((c, i) => (
                <div key={i} className="flex-1" style={{ background: c }} />
              ))}
            </div>
            <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--divider)' }}>
              <SectionHead>Live Activity Feed</SectionHead>
              <div className="flex items-center gap-2">
                <div className="live-dot" />
                <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>Live</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {insights.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <span className="material-symbols-outlined text-5xl mb-3" style={{ color: 'var(--muted2)' }}>timeline</span>
                  <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>No activity recorded yet</p>
                </div>
              ) : insights.map((log: any, i) => (
                <div key={log.id} className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-stone-50" style={{ border: '1px solid var(--divider)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0" style={{ background: avatarColors[i % avatarColors.length], fontFamily: 'var(--font-display)' }}>
                    {log.user_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-bold" style={{ color: 'var(--text)' }}>{log.user_name}</span>
                      <span style={{ color: 'var(--muted)' }}> executed </span>
                      <Badge color="green">{log.action}</Badge>
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
                      {log.resource_id || 'system'} · {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Threat intel */}
          <div className="office-card overflow-hidden flex flex-col" style={{ height: '60vh' }}>
            <div className="h-1" style={{ background: suspicious.length > 0 ? 'var(--red)' : 'var(--green)' }} />
            <div className="px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--divider)' }}>
              <SectionHead>
                <span style={{ color: suspicious.length > 0 ? 'var(--red)' : 'var(--text)' }}>Threat Intel</span>
              </SectionHead>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {suspicious.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="icon-box mx-auto mb-3" style={{ width: 56, height: 56, background: 'var(--green-bg)', borderRadius: 16 }}>
                    <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--green)' }}>verified_user</span>
                  </div>
                  <p className="font-bold text-sm" style={{ color: 'var(--green)' }}>All Clear</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>No suspicious activity in last 10 minutes</p>
                </div>
              ) : suspicious.map((alert: any, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: 'var(--red-bg)', border: '1px solid rgba(220,38,38,0.25)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--red)' }}>warning</span>
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--red)', fontFamily: 'var(--font-display)' }}>Brute Force Detected</span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text2)' }}>
                    IP: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{alert.ip_address}</span>
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>
                    Failed attempts: <span className="font-bold" style={{ color: 'var(--red)' }}>{alert.failed_attempts}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Member activity breakdown */}
        {uniqueMembers.length > 0 && (
          <div className="office-card p-6">
            <SectionHead>Member Activity Breakdown</SectionHead>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
              {uniqueMembers.map((name: string, i) => {
                const count = insights.filter((log: any) => log.user_name === name).length;
                const pct   = Math.round((count / insights.length) * 100);
                return (
                  <div key={name} className="rounded-xl p-4" style={{ background: 'var(--surface3)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: avatarColors[i % avatarColors.length] }}>
                        {name.charAt(0)}
                      </div>
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{name}</p>
                    </div>
                    <p className="text-xl font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--orange)' }}>{count}</p>
                    <p className="text-xs mt-1 mb-2" style={{ color: 'var(--muted)' }}>actions · {pct}% of total</p>
                    <div className="prog-bar">
                      <div className="prog-fill" style={{ width: `${pct}%`, background: avatarColors[i % avatarColors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
