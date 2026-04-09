import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    
    // Upload Form State
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('General');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [scopeType, setScopeType] = useState('TEAM');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [assignedUsers, setAssignedUsers] = useState<any[]>([]);

    // Join Team State
    const [joinTeamCode, setJoinTeamCode] = useState('');
    
    const navigate = useNavigate();
    const role = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    // Debounced Smart Search
    useEffect(() => {
        if (!searchQuery) { setSearchResults([]); return; }
        const timer = setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://127.0.0.1:5000/api/users/search?q=${searchQuery}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSearchResults(res.data.users);
            } catch (err) {}
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const addAssignedUser = (user: any, access: string) => {
        if (!assignedUsers.find(u => u.id === user.id)) {
            setAssignedUsers([...assignedUsers, { id: user.id, name: user.full_name, access }]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/auth');
            return;
        }

        try {
            const docRes = await axios.get('http://127.0.0.1:5000/api/documents', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments(docRes.data.documents);

            const statsRes = await axios.get('http://127.0.0.1:5000/api/stats/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/auth');
    };

    const handleJoinTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://127.0.0.1:5000/api/auth/join-team', { teamCode: joinTeamCode }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.setItem('token', res.data.token);
            setJoinTeamCode('');
            fetchData();
            alert(`Successfully joined ${res.data.teamName}!`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to join team');
        }
    };

    const handleUploadSubmit = async (e: any) => {
        e.preventDefault();
        if (!selectedFile && !newTitle) {
            alert('Please select a file or provide a title.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://127.0.0.1:5000/api/documents/upload', {
                title: newTitle || selectedFile?.name || 'Untitled Document',
                encrypted_path: 'vault/' + Date.now() + '_' + (selectedFile?.name || 'file.enc'),
                category: newCategory,
                scope_type: scopeType,
                assigned_users: assignedUsers
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsUploadModalOpen(false);
            setNewTitle('');
            setSelectedFile(null);
            setAssignedUsers([]);
            setSearchQuery('');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Upload failed.');
        }
    };

    return (
        <div className="bg-surface text-on-surface flex font-body">
            {/* TopNavBar */}
            <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 h-20 bg-[#111318]/80 backdrop-blur-xl bg-gradient-to-b from-[#1a1c20] to-transparent shadow-[0px_24px_48px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-12">
                    <span className="text-2xl font-black tracking-tighter text-[#b0c6ff] uppercase">VAULT</span>
                    <div className="hidden md:flex items-center gap-8">
                        <a className="text-[#b0c6ff] font-bold border-b-2 border-[#b0c6ff] tracking-tight h-20 flex items-center" href="#">Overview</a>
                        <a className="text-[#a8adbd] hover:text-[#f0f0f0] transition-all duration-300 tracking-tight" href="#">Security</a>
                        <a className="text-[#a8adbd] hover:text-[#f0f0f0] transition-all duration-300 tracking-tight" href="#" onClick={() => navigate('/audit-logs')}>Audit</a>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[10px] text-outline font-bold leading-none">{userName}</span>
                        <span className="text-[10px] text-primary">{role}</span>
                    </div>
                    <button className="p-2 text-[#a8adbd] hover:bg-[#333539]/40 rounded-full transition-all active:scale-95 duration-200">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <button className="p-2 text-[#a8adbd] hover:bg-[#333539]/40 rounded-full transition-all active:scale-95 duration-200">
                        <span className="material-symbols-outlined">security</span>
                    </button>
                    <div className="ml-2 h-10 w-10 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden flex items-center justify-center text-xs font-bold text-primary">
                        {userName?.charAt(0) || 'U'}
                    </div>
                </div>
            </nav>

            {/* SideNavBar */}
            <aside className="h-screen w-72 fixed left-0 top-0 z-40 bg-[#1a1c20] shadow-2xl shadow-black flex flex-col py-8 px-4 space-y-6 pt-24">
                <div className="px-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-tertiary-container/20 rounded-xl">
                            <span className="material-symbols-outlined text-[#00daf3]">shield</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#00daf3] leading-none">Fortified Vault</h3>
                            <p className="text-[10px] uppercase tracking-widest text-outline mt-1">AES-256 Active</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    <a className="flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-[#b0c6ff]/10 to-transparent text-[#b0c6ff] border-r-2 border-[#00daf3] text-sm font-medium tracking-wide transition-all" href="#">
                        <span className="material-symbols-outlined">dashboard</span>
                        Dashboard
                    </a>
                    {role === 'MANAGER' && (
                        <a className="flex items-center gap-4 px-4 py-3 text-[#a8adbd] opacity-70 hover:bg-[#282a2e] hover:opacity-100 transition-all hover:translate-x-1 duration-200" href="#" onClick={(e) => { e.preventDefault(); navigate('/team-insights'); }}>
                            <span className="material-symbols-outlined">group</span>
                            Team Management
                        </a>
                    )}
                    {role === 'ADMIN' && (
                        <a className="flex items-center gap-4 px-4 py-3 text-[#a8adbd] opacity-70 hover:bg-[#282a2e] hover:opacity-100 transition-all hover:translate-x-1 duration-200" href="#" onClick={(e) => { e.preventDefault(); navigate('/audit-logs'); }}>
                            <span className="material-symbols-outlined">history_edu</span>
                            Audit Logs
                        </a>
                    )}
                </nav>
                <div className="pt-6 border-t border-outline-variant/10 space-y-2">
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 text-error/80 hover:bg-error/10 transition-all rounded-xl">
                        <span className="material-symbols-outlined">logout</span>
                        Sign Out
                    </button>
                    <button className="mt-4 w-full py-3 bg-gradient-to-br from-[#b0c6ff] to-[#568dff] text-[#001945] font-bold rounded-xl active:scale-95 transition-all">
                        Lock Session
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="ml-72 pt-24 min-h-screen px-8 pb-12 w-full">
                
                {/* Hero Header */}
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <p className="text-tertiary text-xs font-bold tracking-[0.2em] uppercase mb-2">Enterprise Security Control</p>
                        <h1 className="text-5xl font-black tracking-tighter text-on-surface">Dynamic Dashboard</h1>
                        {stats && stats.teamInfo && (
                            <p className="mt-4 text-sm text-outline border-l-2 border-primary pl-3 py-1">
                                Team Workspace: <span className="font-mono text-primary font-bold uppercase">{stats.teamInfo.name}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-xl border border-outline-variant/20">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-outline uppercase font-semibold">System Pulse</span>
                            <span className="text-secondary font-bold text-sm">Optimal</span>
                        </div>
                        <div className="w-3 h-3 bg-secondary rounded-full animate-pulse shadow-[0_0_8px_rgba(64,229,108,0.6)]"></div>
                    </div>
                </header>

                {/* Optional Join Team Banner */}
                {stats && !stats.teamInfo && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between mb-8 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <span className="material-symbols-outlined text-9xl">admin_panel_settings</span>
                        </div>
                        <div className="relative z-10 mb-4 md:mb-0">
                            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined">group_add</span> You are not in a Team workspace!
                            </h2>
                            <p className="text-outline text-sm mt-1">Files you upload right now will be completely orphaned. Join a team to collaborate.</p>
                        </div>
                        <form onSubmit={handleJoinTeam} className="flex gap-3 relative z-10 w-full md:w-auto">
                            <input type="text" placeholder="Enter Team Code" value={joinTeamCode} onChange={e => setJoinTeamCode(e.target.value)} required className="px-4 py-2 bg-surface border border-outline/30 rounded-lg text-white focus:outline-none focus:border-primary w-full md:w-48" />
                            <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-bold transition shadow-lg shrink-0">Join Team</button>
                        </form>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Encrypted Files */}
                    <div className="bg-surface-container-high p-8 rounded-xl relative overflow-hidden group hover:bg-surface-bright transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-8xl">enhanced_encryption</span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-on-surface-variant text-sm font-medium mb-1">Encrypted Documents</p>
                            <h2 className="text-4xl font-bold text-primary mb-4 tracking-tight">{stats?.totalDocs || 0}</h2>
                            <div className="flex items-center gap-2 text-xs text-secondary font-semibold">
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                Secured in Vault
                            </div>
                        </div>
                    </div>
                    {/* Active Users */}
                    <div className="bg-surface-container-high p-8 rounded-xl relative overflow-hidden group hover:bg-surface-bright transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-8xl">group</span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-on-surface-variant text-sm font-medium mb-1">Active Team Members</p>
                            <h2 className="text-4xl font-bold text-primary mb-4 tracking-tight">{stats?.activeMembers || 1}</h2>
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    {(stats?.teamMembers?.slice(0,3) || []).map((m:any) => (
                                        <div key={m.id} className="h-6 w-6 rounded-full border-2 border-surface-container-high bg-primary-container text-on-primary font-bold text-[10px] flex items-center justify-center">
                                            {m.full_name.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs text-on-surface-variant font-medium">Currently linked</span>
                            </div>
                        </div>
                    </div>
                    {/* System Integrity Status */}
                    <div className="bg-surface-container-high p-8 rounded-xl relative overflow-hidden group hover:bg-surface-bright transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-8xl">verified_user</span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-on-surface-variant text-sm font-medium mb-1">System Integrity Status</p>
                            <h2 className="text-4xl font-bold text-secondary mb-4 tracking-tight">99.98%</h2>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-on-secondary-container/30 text-secondary text-[10px] font-bold rounded uppercase tracking-wider">Secure</span>
                                <span className="text-xs text-on-surface-variant">Last audit: Today</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bento Grid: Data Visualizations (Static Representation from Design + minimal dynamic numbers) */}
                <div className="grid grid-cols-12 gap-6 mb-8">
                    {/* Document Access Over Time (Line Chart Representation) */}
                    <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight">Access Frequency Heatmap</h3>
                                <p className="text-on-surface-variant text-xs mt-1">Daily interaction density across all secured sectors</p>
                            </div>
                            <select className="bg-surface-container-highest border-none rounded-lg text-xs font-bold text-primary focus:ring-0 px-3 py-1">
                                <option>Last 30 Days</option>
                                <option>Last 7 Days</option>
                            </select>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-2 px-2 relative">
                            {/* Fake Line Chart via CSS Gradients & Shapes */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                                <div className="w-full h-[1px] bg-outline-variant"></div>
                            </div>
                            <div className="w-full h-full flex items-end justify-between px-4 pb-8 relative">
                                {[50, 66, 75, 50, 80, 60, 66, 50, 75, 83, 66].map((h, i) => (
                                    <div key={i} className="w-4 bg-primary-container/20 rounded-t-sm group relative" style={{ height: `${h}%` }}>
                                        <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-primary/40 to-primary group-hover:scale-y-110 transition-transform origin-bottom"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between px-6 text-[10px] text-outline font-bold uppercase tracking-widest pt-4">
                            <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
                        </div>
                    </div>
                    
                    {/* Security Alerts (Bar Chart) */}
                    <div className="col-span-12 lg:col-span-4 bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-bold tracking-tight mb-6">Security Alerts</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-medium">Unauthorized Access</span>
                                        <span className="text-xs text-error font-bold">Low (0)</span>
                                    </div>
                                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                        <div className="h-full bg-error rounded-full" style={{ width: '5%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-medium">Daily Audits Logged</span>
                                        <span className="text-xs text-primary font-bold">Stable ({stats?.todayAudits || 0})</span>
                                    </div>
                                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 p-4 glass-panel rounded-xl border border-secondary/20 bg-secondary/5">
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-secondary">shield_lock</span>
                                <div>
                                    <p className="text-xs font-bold text-on-surface">Vault Secure</p>
                                    <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">No anomalous data access patterns detected.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Document Registry (Using the provided Table Design) */}
                    <div className="col-span-12 bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
                        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest/50">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight">Encrypted Document Registry</h3>
                                <p className="text-xs text-outline mt-1">Live overview of securely managed files in this workspace.</p>
                            </div>
                            <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg transition font-bold shadow-[0_0_15px_rgba(176,198,255,0.2)]">
                                <span className="material-symbols-outlined text-[18px]">cloud_upload</span> Upload Secure File
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-widest text-outline border-b border-outline-variant/10 bg-surface-container-highest/20">
                                        <th className="px-6 py-4 font-bold">Identifier / Title</th>
                                        <th className="px-6 py-4 font-bold">Category</th>
                                        <th className="px-6 py-4 font-bold">Attribution</th>
                                        <th className="px-6 py-4 font-bold">Target Access</th>
                                        <th className="px-6 py-4 font-bold">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/5">
                                    {documents.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-outline">
                                                <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">folder_off</span>
                                                No documents found in registry.
                                            </td>
                                        </tr>
                                    ) : documents.map((doc: any) => (
                                        <tr key={doc.id} className="hover:bg-surface-container-highest/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center text-primary">
                                                        <span className="material-symbols-outlined text-[18px]">lock_doc</span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-surface-tint">{doc.title}</div>
                                                        <div className="text-xs font-mono text-outline">#DOC-{doc.id.substring(0,6).toUpperCase()} • v{doc.version}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{doc.category}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-outline">
                                                {doc.uploader || 'System'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {doc.is_public_to_team ? (
                                                    <span className="px-2 py-0.5 bg-tertiary-container/20 text-tertiary text-[10px] font-bold rounded uppercase">Full Team</span>
                                                ) : doc.is_public_to_department ? (
                                                    <span className="px-2 py-0.5 bg-primary-container/20 text-primary text-[10px] font-bold rounded uppercase">Department</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-error-container/20 text-error text-[10px] font-bold rounded uppercase">Restricted</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-outline font-mono">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </main>

            {/* Floating Security Status Overlay */}
            <div className="fixed bottom-6 right-6 z-50">
                <div className="group relative">
                    <button className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0_0_24px_rgba(176,198,255,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>security</span>
                    </button>
                    <div className="absolute bottom-full right-0 mb-4 w-64 glass-panel p-4 rounded-2xl border border-outline-variant/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <h4 className="text-sm font-bold text-primary mb-2">Live Security Matrix</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-outline uppercase font-bold tracking-widest">
                                <span>Firewall</span>
                                <span className="text-secondary">Active</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-outline uppercase font-bold tracking-widest">
                                <span>Encryption</span>
                                <span className="text-secondary">AES-256</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-outline uppercase font-bold tracking-widest">
                                <span>Zero-Trust</span>
                                <span className="text-secondary">Enforced</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal Overlay */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-[#0c0e12]/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
                    <div className="glass-panel border border-outline-variant/30 p-8 rounded-2xl max-w-md w-full shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">encrypted</span> Secure Upload
                            </h3>
                            <button type="button" onClick={() => setIsUploadModalOpen(false)} className="text-outline hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleUploadSubmit} className="space-y-5">
                            {/* File Input */}
                            <div className="border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low rounded-xl p-6 text-center transition-colors cursor-pointer relative group">
                                <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <span className="material-symbols-outlined text-4xl text-outline group-hover:text-primary transition-colors mb-3">cloud_upload</span>
                                {selectedFile ? (
                                    <p className="text-secondary text-sm font-bold">{selectedFile.name}</p>
                                ) : (
                                    <p className="text-outline text-xs">Click or drag payload here for AES-256 encryption</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Vault Filename</label>
                                <input type="text" placeholder="Autogenerates if empty" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm" />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Category Tag</label>
                                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm appearance-none cursor-pointer">
                                    <option value="HR">HR</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Finance">Finance</option>
                                    <option value="General">General</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Deployment Scope</label>
                                <select value={scopeType} onChange={e => setScopeType(e.target.value)} className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm appearance-none cursor-pointer">
                                    <option value="TEAM">Entire Team</option>
                                    <option value="DEPARTMENT">Entire Department</option>
                                    <option value="SPECIFIC">Granular Routing</option>
                                </select>
                            </div>

                            {scopeType === 'SPECIFIC' && (
                                <div className="bg-surface-container border border-outline-variant/30 p-4 rounded-xl">
                                    <div className="relative mb-3">
                                        <input 
                                            type="text" 
                                            placeholder="Query user identity index..." 
                                            value={searchQuery} 
                                            onChange={e => setSearchQuery(e.target.value)} 
                                            className="w-full px-4 py-2 bg-surface-container-highest border border-outline-variant/50 rounded-lg text-sm text-on-surface outline-none focus:border-primary" 
                                        />
                                        {searchResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-surface-container-high border border-outline-variant rounded-lg shadow-xl max-h-40 overflow-y-auto">
                                                {searchResults.map((u: any) => (
                                                    <div key={u.id} className="flex items-center justify-between p-3 hover:bg-surface-container-highest border-b border-outline-variant/20 last:border-0">
                                                        <div>
                                                            <p className="text-sm font-bold text-primary">{u.full_name}</p>
                                                            <p className="text-xs text-outline">{u.email}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={() => addAssignedUser(u, 'READ')} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-tertiary-container/20 text-tertiary rounded hover:bg-tertiary-container/40">Read</button>
                                                            <button type="button" onClick={() => addAssignedUser(u, 'WRITE')} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-primary-container/20 text-primary rounded hover:bg-primary-container/40">Write</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {assignedUsers.length === 0 && <span className="text-[10px] text-error font-bold uppercase">No nodes bound. Object will be orphaned.</span>}
                                        {assignedUsers.map(u => (
                                            <div key={u.id} className="flex items-center gap-1 bg-primary/10 border border-primary/30 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                                <span className="text-on-surface">{u.name} <span className="text-primary ml-1">[{u.access}]</span></span>
                                                <button type="button" onClick={() => setAssignedUsers(assignedUsers.filter(a => a.id !== u.id))} className="text-outline hover:text-error ml-1"><span className="material-symbols-outlined text-[12px]">close</span></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="w-full py-4 mt-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-[0_0_15px_rgba(176,198,255,0.2)]">
                                Encrypt & Sync Object
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
