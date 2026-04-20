import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { OfficeBg, Badge, SectionHead } from '../components/ui';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role  = localStorage.getItem('userRole');
    if (!token || role !== 'ADMIN') { navigate('/dashboard'); return; }
    axios.get('http://127.0.0.1:5001/api/audit', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setLogs(r.data.logs)).catch(console.error);
  }, [navigate]);

  const isError = (action: string) => action.includes('FAILED') || action.includes('ERROR');

  return (
    <div className="min-h-screen p-8 relative" style={{ background: 'var(--bg)' }}>
      <OfficeBg />
      <div className="max-w-7xl mx-auto relative z-10 space-y-8">

        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary px-3 py-2.5 text-sm">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-3xl font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Audit Logs</h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Immutable record of all system events</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--divider)' }}>
            <div className="live-dot" />
            <span className="text-sm font-semibold" style={{ color: 'var(--green)' }}>Live</span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>{logs.length} events</span>
          </div>
        </header>

        {/* Summary chips */}
        <div className="flex gap-3">
          {[
            { label: 'Total Events', val: logs.length, color: 'orange' },
            { label: 'Errors', val: logs.filter((l: any) => isError(l.action)).length, color: 'red' },
            { label: 'Success', val: logs.filter((l: any) => !isError(l.action)).length, color: 'green' },
          ].map(({ label, val, color }) => (
            <div key={label} className="office-card px-5 py-3 flex items-center gap-3">
              <span className="text-xl font-black" style={{ fontFamily: 'var(--font-display)', color: `var(--${color})` }}>{val}</span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="office-card overflow-hidden">
          <div className="h-1 flex">
            {['var(--orange)','var(--amber)','var(--green)','var(--teal)','var(--red)'].map((c, i) => (
              <div key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
            <SectionHead>Event Stream</SectionHead>
          </div>
          <table className="w-full text-left">
            <thead style={{ background: 'var(--surface3)' }}>
              <tr>
                {['Timestamp','Action','User','IP Address','Resource'].map(h => (
                  <th key={h} className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--divider)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center">
                  <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: 'var(--muted2)' }}>receipt_long</span>
                  <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>No events recorded yet</p>
                </td></tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="tr-row transition-colors" style={{ borderBottom: '1px solid var(--divider)' }}>
                  <td className="px-6 py-4 text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={isError(log.action) ? 'red' : 'green'}>{log.action}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text2)' }}>{log.user_email || 'System'}</td>
                  <td className="px-6 py-4 text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{log.ip_address}</td>
                  <td className="px-6 py-4 text-xs" style={{ color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>{log.resource_id || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
