import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, ArrowLeft } from 'lucide-react';

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (!token || role !== 'ADMIN') {
            navigate('/dashboard');
            return;
        }

        axios.get('http://127.0.0.1:5000/api/audit', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setLogs(res.data.logs)).catch(console.error);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Activity className="text-cyan-500" />
                            System Audit Logs
                        </h1>
                        <p className="text-slate-400 mt-1">Immutable record of all system events</p>
                    </div>
                </header>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/80 text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Timestamp</th>
                                    <th className="px-6 py-4 font-medium">Action</th>
                                    <th className="px-6 py-4 font-medium">User Email</th>
                                    <th className="px-6 py-4 font-medium">IP Address</th>
                                    <th className="px-6 py-4 font-medium">Resource ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {logs.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${log.action.includes('FAILED') || log.action.includes('ERROR') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{log.user_email || 'System / Unauth'}</td>
                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{log.ip_address}</td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.resource_id || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
