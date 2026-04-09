import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, Activity, ArrowLeft } from 'lucide-react';

export default function TeamInsights() {
    const [insights, setInsights] = useState<any[]>([]);
    const [suspicious, setSuspicious] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInsights = async () => {
            const token = localStorage.getItem('token');
            try {
                const [insRes, suspRes] = await Promise.all([
                    axios.get('http://127.0.0.1:5000/api/audit/team', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://127.0.0.1:5000/api/audit/suspicious', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setInsights(insRes.data.insights || []);
                setSuspicious(suspRes.data.alerts || []);
            } catch (err) {
                console.error('Unauthorized or fetch error:', err);
            }
        };
        fetchInsights();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Activity className="text-emerald-500" />
                            Team Activity Insights
                        </h1>
                        <p className="text-slate-400 mt-1">Forensic analysis and live forensic audit streams for your entire team.</p>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition">
                        <ArrowLeft size={18} /> Back to Vault
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Activity Feed */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl lg:col-span-2 p-6 flex flex-col h-[70vh]">
                        <h2 className="text-xl font-semibold text-white mb-6 border-b border-slate-800 pb-4">Live Activity Feed</h2>
                        <div className="flex-1 overflow-y-auto space-y-4">
                            {insights.length === 0 ? <p className="text-slate-500">No activity recorded yet.</p> : insights.map((log: any) => (
                                <div key={log.id} className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <div className="h-10 w-10 bg-indigo-500/20 text-indigo-400 flex items-center justify-center rounded-full font-bold">
                                        {log.user_name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-slate-200">
                                            <span className="font-semibold text-white">{log.user_name}</span> 
                                            {' '}executed <span className="text-emerald-400 font-mono text-sm px-2 py-0.5 bg-emerald-500/10 rounded">{log.action}</span>
                                        </p>
                                        <p className="text-slate-500 text-xs mt-1">
                                            Target: {log.resource_id || 'System'} • {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Threat Intel Window */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6">
                        <h2 className="text-xl font-semibold text-red-500 mb-6 flex items-center gap-2"><ShieldAlert size={20}/> Threat Intel</h2>
                        <div className="space-y-4">
                            {suspicious.length === 0 ? (
                                <p className="text-slate-500 italic">No brute force or suspicious activity detected in the last 10 minutes.</p>
                            ) : suspicious.map((alert: any, idx: number) => (
                                <div key={idx} className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                                    <p className="text-red-400 font-semibold mb-1">Brute Force Alert</p>
                                    <p className="text-slate-300 text-sm">IP: <span className="font-mono text-red-300">{alert.ip_address}</span></p>
                                    <p className="text-slate-300 text-sm">Failed Attempts: <span className="font-bold text-white">{alert.failed_attempts}</span></p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
