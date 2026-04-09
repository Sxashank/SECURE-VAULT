import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, LogOut, Upload, Shield, Users, Activity, HardDrive, X, UserPlus, FileUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
    const [documents, setDocuments] = useState([]);
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
    }

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
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Shield className="text-indigo-500" />
                            VaultSecure
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Welcome back, <span className="font-semibold text-white">{userName}</span> 
                            {' '}(Role: <span className="text-indigo-400">{role}</span>
                            {stats?.teamInfo && <span> | Team: <span className="text-emerald-400 uppercase font-mono">{stats.teamInfo.name}</span></span>})
                        </p>
                    </div>
                    <div className="flex gap-4">
                        {role === 'MANAGER' && (
                            <button onClick={() => navigate('/team-insights')} className="px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition shadow-lg">Team Insights Dashboard</button>
                        )}
                        {role === 'ADMIN' && (
                            <button onClick={() => navigate('/audit-logs')} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition">Audit Logs</button>
                        )}
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition">
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </header>

                {/* Optional Join Team Banner */}
                {stats && !stats.teamInfo && (
                    <div className="bg-indigo-900/40 border border-indigo-500/50 rounded-2xl p-6 flex items-center justify-between shadow-lg">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><UserPlus size={20} className="text-indigo-400"/> You are not in a Team workspace!</h2>
                            <p className="text-indigo-200/80 text-sm mt-1">Files you upload right now will be completely orphaned. Join a team to collaborate.</p>
                        </div>
                        <form onSubmit={handleJoinTeam} className="flex gap-3">
                            <input type="text" placeholder="Enter Team Code" value={joinTeamCode} onChange={e => setJoinTeamCode(e.target.value)} required className="px-4 py-2 bg-slate-950 border border-indigo-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition shadow-lg shadow-indigo-500/20">Join</button>
                        </form>
                    </div>
                )}

                {/* Dashboard Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                            <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-xl"><Activity size={24}/></div>
                            <div>
                                <p className="text-slate-400 text-sm">Today's Audits</p>
                                <p className="text-2xl font-bold text-white">{stats.todayAudits}</p>
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl"><Users size={24}/></div>
                            <div>
                                <p className="text-slate-400 text-sm">Active Members</p>
                                <p className="text-2xl font-bold text-white">{stats.activeMembers}</p>
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                            <div className="p-4 bg-cyan-500/10 text-cyan-400 rounded-xl"><HardDrive size={24}/></div>
                            <div>
                                <p className="text-slate-400 text-sm">Accessible Documents</p>
                                <p className="text-2xl font-bold text-white">{stats.totalDocs}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Roster (Managers Only) */}
                {stats?.teamMembers?.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Users className="text-emerald-500" size={20}/> Team Roster</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.teamMembers.map((member: any) => (
                                <div key={member.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
                                        {member.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{member.full_name}</p>
                                        <p className="text-xs text-slate-500">ID: {member.id} • {member.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Category Visualization & Main Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Bar Chart Section */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-1">
                        <h2 className="text-xl font-semibold text-white mb-6">File Categories</h2>
                        <div className="h-64 w-full">
                            {stats?.categories?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.categories}>
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff'}} />
                                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* Documents Table */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl lg:col-span-2 flex flex-col">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-xl font-semibold text-white">Document Registry</h2>
                            <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-lg shadow-indigo-500/20 text-sm font-medium">
                                <Upload size={18} /> Upload New
                            </button>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-900/80 text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Document ID / Title</th>
                                        <th className="px-6 py-4 font-medium border-l border-slate-800/50">Category</th>
                                        <th className="px-6 py-4 font-medium border-l border-slate-800/50">Attribution</th>
                                        <th className="px-6 py-4 font-medium border-l border-slate-800/50">Target</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {documents.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No documents in registry.</td></tr>
                                    ) : documents.map((doc: any) => (
                                        <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-indigo-500/10">
                                                    <FileText className="text-indigo-400" size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-slate-200 font-medium">{doc.title}</div>
                                                    <div className="text-slate-500 text-xs">v{doc.version} • {new Date(doc.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 border-l border-slate-800/50">
                                                <span className="px-2 py-1 bg-slate-800 rounded-md text-xs">{doc.category}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 border-l border-slate-800/50">Modifier: {doc.uploader || 'System'}</td>
                                            <td className="px-6 py-4 text-slate-400 border-l border-slate-800/50">
                                                {doc.is_public_to_team ? (
                                                    <span className="text-indigo-400 font-medium bg-indigo-500/10 px-2 py-1 rounded">Full Team</span>
                                                ) : doc.is_public_to_department ? (
                                                    <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded">Full Department</span>
                                                ) : (
                                                    <span className="text-amber-400 font-medium bg-amber-500/10 px-2 py-1 rounded">Targeted Mapping</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal Overlay */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Upload New Document</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleUploadSubmit} className="space-y-4">
                            
                            {/* File Input */}
                            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center transition cursor-pointer relative">
                                <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <FileUp className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                                {selectedFile ? (
                                    <p className="text-indigo-400 text-sm font-medium">{selectedFile.name}</p>
                                ) : (
                                    <p className="text-slate-400 text-sm">Click or drag physical file here to attach to vault</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Document Title (Optional)</label>
                                <input type="text" placeholder="Defaults to file name" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Category</label>
                                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-indigo-500">
                                    <option value="HR">HR</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Finance">Finance</option>
                                    <option value="General">General</option>
                                </select>
                            </div>
                            
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Visibility Scope</label>
                                    <select value={scopeType} onChange={e => setScopeType(e.target.value)} className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white outline-none focus:border-indigo-500">
                                        <option value="TEAM">Entire Team</option>
                                        <option value="DEPARTMENT">Entire Department</option>
                                        <option value="SPECIFIC">Specific Users (Granular Access)</option>
                                    </select>
                                </div>

                                {scopeType === 'SPECIFIC' && (
                                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                                        <div className="relative mb-3">
                                            <input 
                                                type="text" 
                                                placeholder="Search user by name or email..." 
                                                value={searchQuery} 
                                                onChange={e => setSearchQuery(e.target.value)} 
                                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-indigo-500" 
                                            />
                                            {searchResults.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                                                    {searchResults.map((u: any) => (
                                                        <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-700 border-b border-slate-700/50">
                                                            <div>
                                                                <p className="text-sm text-white font-medium">{u.full_name}</p>
                                                                <p className="text-xs text-slate-400">{u.email}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button type="button" onClick={() => addAssignedUser(u, 'READ')} className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white">Read</button>
                                                                <button type="button" onClick={() => addAssignedUser(u, 'WRITE')} className="text-xs px-2 py-1 bg-amber-600 hover:bg-amber-500 rounded text-white">Write</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Assigned Tags */}
                                        <div className="flex flex-wrap gap-2">
                                            {assignedUsers.length === 0 && <span className="text-xs text-slate-500 italic">No users explicitly assigned. File will be hidden.</span>}
                                            {assignedUsers.map(u => (
                                                <div key={u.id} className="flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full">
                                                    <span className="text-xs text-indigo-300 font-medium">{u.name} <span className="text-slate-400 ml-1">[{u.access}]</span></span>
                                                    <button type="button" onClick={() => setAssignedUsers(assignedUsers.filter(a => a.id !== u.id))} className="text-indigo-400 hover:text-white"><X size={14}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            <button type="submit" className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition">
                                Push to Vault
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
