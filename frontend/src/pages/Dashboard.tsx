import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { OfficeBg, Badge, StatCard, SectionHead } from '../components/ui';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-secure-vault-e2e-key';

export default function Dashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats]         = useState<any>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scopeType, setScopeType] = useState('TEAM');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<any[]>([]);
  const [joinCode, setJoinCode]   = useState('');
  
  // Editor & Logs State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorDocId, setEditorDocId] = useState<number | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorVersion, setEditorVersion] = useState(1);
  const [editorAccess, setEditorAccess] = useState('READ');
  const [editorCommitMsg, setEditorCommitMsg] = useState('');
  
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsData, setLogsData] = useState<any[]>([]);

  const navigate = useNavigate();

  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave your team?')) return;
    try {
      const token = await getToken();
      await axios.post('http://127.0.0.1:5001/api/users/leave-team', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Left team successfully');
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to leave team');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };
  
  // Local state for synced DB user data (role, etc)
  const [localUser, setLocalUser] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!user) return; // Wait for Clerk to load the user object

    try {
      const token = await getToken();
      if (!token) return;

      const [docR, statR] = await Promise.all([
        axios.get('http://127.0.0.1:5001/api/documents', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://127.0.0.1:5001/api/stats/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setDocuments(docR.data.documents);
      setStats(statR.data);
      if (statR.data.user) {
        setLocalUser(statR.data.user);
      }
    } catch (e) {
      console.error('Dashboard Fetch Error:', e);
    }
  }, [user, getToken]);

  useEffect(() => {
    if (!searchQuery) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const token = await getToken();
        const r = await axios.get(`http://127.0.0.1:5001/api/users/search?q=${searchQuery}`, { headers: { Authorization: `Bearer ${token}` } });
        setSearchResults(r.data.users);
      } catch (err) {
        console.error('User search failed:', err);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addUser = (u: any, access: string) => {
    if (!assignedUsers.find(x => x.id === u.id)) setAssignedUsers([...assignedUsers, { id: u.id, name: u.full_name, access }]);
    setSearchQuery(''); setSearchResults([]);
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const r = await axios.post('http://127.0.0.1:5001/api/auth/join-team', { teamCode: joinCode }, { headers: { Authorization: `Bearer ${token}` } });
      setJoinCode(''); fetchData();
      alert(`Joined ${r.data.teamName}!`);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleUpload = async (e: any) => {
    e.preventDefault();
    try {
      const token = await getToken();
      
      let content = '';
      if (selectedFile) {
        const text = await selectedFile.text();
        content = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
      }

      await axios.post('http://127.0.0.1:5001/api/documents/upload', {
        title: newTitle || selectedFile?.name || 'Untitled',
        encrypted_path: 'vault/' + Date.now() + '_' + (selectedFile?.name || 'file.enc'),
        content,
        category: newCategory, scope_type: scopeType, assigned_users: assignedUsers
      }, { headers: { Authorization: `Bearer ${token}` } });
      setUploadOpen(false); setNewTitle(''); setSelectedFile(null); setAssignedUsers([]); fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed.');
    }
  };

  const handleOpenEditor = async (doc: any) => {
    try {
      const token = await getToken();
      const r = await axios.get(`http://127.0.0.1:5001/api/documents/${doc.id}/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let decrypted = '';
      if (r.data.content) {
        try {
          const bytes = CryptoJS.AES.decrypt(r.data.content, ENCRYPTION_KEY);
          decrypted = bytes.toString(CryptoJS.enc.Utf8);
          // If decryption fails (e.g., old unencrypted data), it might return empty string
          if (!decrypted) decrypted = r.data.content;
        } catch (e) {
          decrypted = r.data.content;
        }
      }

      setEditorDocId(doc.id);
      setEditorTitle(doc.title);
      setEditorContent(decrypted);
      setEditorVersion(r.data.version);
      setEditorAccess(r.data.access);
      setEditorCommitMsg('');
      setEditorOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to open file');
    }
  };

  const handleSaveEdit = async () => {
    if (!editorCommitMsg.trim()) { alert('Please provide a commit message.'); return; }
    try {
      const token = await getToken();
      const encryptedContent = CryptoJS.AES.encrypt(editorContent, ENCRYPTION_KEY).toString();
      
      await axios.post(`http://127.0.0.1:5001/api/documents/${editorDocId}/versions`, {
        content: encryptedContent,
        commit_message: editorCommitMsg
      }, { headers: { Authorization: `Bearer ${token}` } });
      setEditorOpen(false);
      fetchData();
      alert('Version committed successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save changes');
    }
  };

  const handleOpenLogs = async (docId: number) => {
    try {
      const token = await getToken();
      const r = await axios.get(`http://127.0.0.1:5001/api/documents/${docId}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogsData(r.data.logs);
      setLogsOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to fetch logs');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const token = await getToken();
      await axios.delete(`http://127.0.0.1:5001/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const sel = "office-input px-4 py-3 text-sm appearance-none";

  const role     = localUser?.role_name || 'USER';
  const userName = user?.fullName || 'User';

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard', active: true },
    ...(role === 'MANAGER' ? [{ icon: 'group', label: 'Team Insights', path: '/team-insights', active: false }] : []),
    ...(role === 'ADMIN'   ? [{ icon: 'history_edu', label: 'Audit Logs',  path: '/audit-logs',  active: false }] : []),
  ];

  return (
    <div className="flex min-h-screen relative" style={{ background: 'var(--bg)' }}>
      <OfficeBg />

      {/* Sidebar */}
      <aside className="sidebar fixed left-0 top-0 h-screen w-60 z-40 hidden lg:flex flex-col py-6 px-3">
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--orange)' }}>
            <span className="material-symbols-outlined text-white text-[20px]">security</span>
          </div>
          <div>
            <p className="font-black text-sm tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>SecureVault</p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--muted2)' }}>Enterprise Edition</p>
          </div>
        </div>

        {/* Color strip */}
        <div className="color-strip px-3 mb-6">
          {['var(--orange)', 'var(--green)', 'var(--amber)', 'var(--teal)', 'var(--red)'].map((c, i) => (
            <span key={i} style={{ background: c, flexGrow: 1, height: '3px', borderRadius: '2px' }} />
          ))}
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${item.active ? 'nav-active' : 'hover:bg-stone-100'}`}
              style={{ color: item.active ? 'var(--orange)' : 'var(--text2)', fontWeight: item.active ? 700 : 500 }}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User card */}
        <div className="mx-2 p-3 rounded-xl" style={{ background: 'var(--surface3)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white" style={{ background: 'linear-gradient(135deg, var(--orange), var(--amber))' }}>
              {userName?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{userName}</p>
              <span className="badge badge-orange text-[10px]">{role}</span>
            </div>
          </div>
          <div className="space-y-1">
            <button onClick={handleLeaveTeam}
              className="btn-secondary w-full py-1.5 text-xs flex items-center justify-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-[16px]">person_remove</span>
              Leave Team
            </button>
            <button onClick={handleLogout}
              className="btn-secondary w-full py-1.5 text-xs flex items-center justify-center gap-1.5"
              style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-60 flex-1 px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-16 relative z-10 min-w-0">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4 lg:hidden">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--orange)' }}>
                <span className="material-symbols-outlined text-white text-[20px]">security</span>
              </div>
              <div>
                <p className="font-black text-sm tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>SecureVault</p>
                <p className="text-[10px] font-medium" style={{ color: 'var(--muted2)' }}>Enterprise Edition</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="live-dot" />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>System Online</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Good morning, {userName?.split(' ')[0]} 👋
            </h1>
            {stats?.teams && stats.teams.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Workspaces:</span>
                {stats.teams.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--surface3)', border: '1px solid var(--border)' }}>
                    <span className="font-semibold text-sm" style={{ color: 'var(--orange)' }}>{t.name}</span>
                    {(role === 'MANAGER' || role === 'ADMIN') && t.invite_code && (
                      <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: 'var(--teal)', background: 'var(--bg)', border: '1px solid var(--divider)' }}>
                        {t.invite_code}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
            <button className="btn-secondary px-4 py-2.5 text-sm">
              <span className="material-symbols-outlined text-[18px]">notifications</span>
            </button>
            <button onClick={() => setUploadOpen(true)} className="btn-primary px-5 py-2.5 text-sm flex-1 sm:flex-none justify-center">
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              Upload File
            </button>
          </div>
        </div>

        {/* Join team banner */}
        {stats && (!stats.teams || stats.teams.length === 0) && (
          <div className="office-card p-5 mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4" style={{ borderLeft: '4px solid var(--amber)', background: 'var(--amber-bg)' }}>
            <div className="flex items-center gap-3">
              <div className="icon-box" style={{ background: 'rgba(217,119,6,0.15)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--amber)' }}>group_add</span>
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Not in a team workspace</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Join a team to collaborate and share documents.</p>
              </div>
            </div>
            <form onSubmit={handleJoinTeam} className="flex flex-col sm:flex-row gap-2 md:max-w-md w-full md:w-auto">
              <input type="text" placeholder="Enter team code" value={joinCode} onChange={e => setJoinCode(e.target.value)} required className="office-input px-4 py-2 text-sm sm:w-56" style={{ fontFamily: 'var(--font-mono)' }} />
              <button type="submit" className="btn-primary px-5 py-2 text-sm whitespace-nowrap">Join →</button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <StatCard icon="enhanced_encryption" label="Encrypted Docs" value={stats?.totalDocs || 0} sub="Secured in vault" color="orange" cardColor="orange" />
          <StatCard icon="group" label="Active Members" value={stats?.activeMembers || 1} sub="Currently linked" color="teal" cardColor="teal" />
          <StatCard icon="verified_user" label="System Integrity" value="99.98%" sub="Last audit: Today" color="green" cardColor="green" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-8">
          {/* Bar chart */}
          <div className="xl:col-span-8 office-card p-5 sm:p-6">
            <SectionHead action={
              <select className="office-input px-3 py-1.5 text-xs" style={{ width: 'auto' }}>
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
              </select>
            }>Access Frequency</SectionHead>
            <p className="text-xs mt-1 mb-6" style={{ color: 'var(--muted)' }}>Daily interaction density across secured sectors</p>
            <div className="h-44 flex items-end gap-2">
              {[50,66,75,50,80,60,66,50,75,83,66,72,58,88,70].map((h, i) => {
                const colors = ['var(--orange)','var(--amber)','var(--green)','var(--teal)','var(--red)'];
                const c = colors[i % colors.length];
                return (
                  <div key={i} className="flex-1 rounded-t-lg group cursor-pointer relative transition-all hover:opacity-80" style={{ height: `${h}%`, background: c, opacity: 0.75, minWidth: 0 }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity rounded px-1.5 py-0.5 whitespace-nowrap font-bold" style={{ background: 'var(--text)', color: '#fff' }}>{h}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between px-1 mt-3 text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
              <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
            </div>
          </div>

          {/* Security panel */}
          <div className="xl:col-span-4 office-card p-5 sm:p-6 flex flex-col gap-5">
            <div className="section-head">Security Status</div>
            {[
              { label: 'Unauthorized Access', pct: 5,  color: 'var(--red)',    badge: 'Low', bColor: 'red' },
              { label: 'Audits Logged',       pct: 85, color: 'var(--green)',  badge: `${stats?.todayAudits || 0} Today`, bColor: 'green' },
              { label: 'Vault Uptime',        pct: 99, color: 'var(--orange)', badge: '99.98%', bColor: 'orange' },
            ].map(({ label, pct, color, badge, bColor }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>{label}</span>
                  <Badge color={bColor}>{badge}</Badge>
                </div>
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
            <div className="mt-auto rounded-xl p-3 flex gap-3 items-center" style={{ background: 'var(--green-bg)', border: '1px solid rgba(5,150,105,0.2)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--green)' }}>check_circle</span>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--green)' }}>All Clear</p>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>No anomalous patterns detected.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document table */}
        <div className="office-card overflow-hidden">
          <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center" style={{ borderBottom: '1px solid var(--divider)' }}>
            <SectionHead>Document Registry</SectionHead>
            <button onClick={() => setUploadOpen(true)} className="btn-primary px-4 py-2 text-sm">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Document
            </button>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead style={{ background: 'var(--surface3)' }}>
              <tr>
                {['Document', 'Category', 'Uploader', 'Access', 'Date', ''].map((h, i) => (
                  <th key={i} className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--divider)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center">
                  <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: 'var(--muted2)' }}>folder_open</span>
                  <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>No documents yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted2)' }}>Upload your first document to get started</p>
                </td></tr>
              ) : documents.map((doc: any) => (
                <tr key={doc.id} className="tr-row transition-colors" style={{ borderBottom: '1px solid var(--divider)' }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="icon-box" style={{ background: 'var(--orange-bg)' }}>
                        <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--orange)' }}>description</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{doc.title}</p>
                        <p className="text-[10px]" style={{ color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>#DOC-{String(doc.id).substring(0,6).toUpperCase()} · v{doc.version || 1}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><Badge color="amber">{doc.category}</Badge></td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--text2)' }}>{doc.uploader || 'System'}</td>
                  <td className="px-6 py-4">
                    {doc.is_public_to_team ? <Badge color="teal">Full Team</Badge>
                      : doc.is_public_to_department ? <Badge color="orange">Department</Badge>
                      : <Badge color="red">Restricted</Badge>}
                  </td>
                  <td className="px-6 py-4 text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    {doc.uploader === userName && (
                      <button onClick={() => handleOpenLogs(doc.id)} className="p-2 rounded-lg hover:bg-stone-100 transition-colors" title="View Activity Logs">
                        <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--amber)' }}>history</span>
                      </button>
                    )}
                    <button onClick={() => handleOpenEditor(doc)} className="p-2 rounded-lg hover:bg-stone-100 transition-colors" title="Open Document">
                      <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--teal)' }}>open_in_new</span>
                    </button>
                    <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-lg hover:bg-stone-100 transition-colors" title="Delete Document">
                      <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--red)' }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="modal-bg fixed inset-0 flex items-center justify-center p-4 z-[100]">
          <div className="office-card w-full max-w-md" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal header stripe */}
            <div className="h-1 flex rounded-t-2xl overflow-hidden">
              {['var(--orange)','var(--amber)','var(--green)','var(--teal)'].map((c, i) => (
                <div key={i} className="flex-1" style={{ background: c }} />
              ))}
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="icon-box" style={{ background: 'var(--orange-bg)' }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--orange)' }}>cloud_upload</span>
                  </div>
                  <div>
                    <h3 className="font-black text-base" style={{ fontFamily: 'var(--font-display)' }}>Secure Upload</h3>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>AES-256 encrypted</p>
                  </div>
                </div>
                <button onClick={() => setUploadOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 transition-colors" style={{ color: 'var(--muted)' }}>
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <label className="dropzone block">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                  <span className="material-symbols-outlined text-4xl block mb-2" style={{ color: selectedFile ? 'var(--green)' : 'var(--muted2)' }}>cloud_upload</span>
                  <p className="text-sm font-semibold" style={{ color: selectedFile ? 'var(--green)' : 'var(--text2)' }}>
                    {selectedFile ? selectedFile.name : 'Click or drag file here'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted2)' }}>Files are encrypted before upload</p>
                </label>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Document Title</label>
                  <input type="text" placeholder="Auto-generated from filename" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="office-input px-4 py-3 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Category</label>
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className={sel}>
                      {['HR','Engineering','Finance','General'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Scope</label>
                    <select value={scopeType} onChange={e => setScopeType(e.target.value)} className={sel}>
                      <option value="TEAM">Full Team</option>
                      <option value="DEPARTMENT">Department</option>
                      <option value="SPECIFIC">Specific Users</option>
                    </select>
                  </div>
                </div>

                {scopeType === 'SPECIFIC' && (
                  <div className="rounded-xl p-4" style={{ background: 'var(--surface3)', border: '1px solid var(--border)' }}>
                    <div className="relative mb-3">
                      <input type="text" placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="office-input px-4 py-2.5 text-sm" />
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 rounded-xl shadow-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--divider)' }}>
                          {searchResults.map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between p-3 hover:bg-stone-50 transition-colors" style={{ borderBottom: '1px solid var(--divider)' }}>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{u.full_name}</p>
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>{u.email}</p>
                              </div>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => addUser(u, 'READ')} className="badge badge-teal cursor-pointer hover:opacity-80">Read</button>
                                <button type="button" onClick={() => addUser(u, 'WRITE')} className="badge badge-orange cursor-pointer hover:opacity-80">Write</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {assignedUsers.length === 0 && <span className="text-xs" style={{ color: 'var(--red)' }}>No users assigned yet</span>}
                      {assignedUsers.map(u => (
                        <div key={u.id} className="chip">
                          <span>{u.name}</span>
                          <span className="font-bold" style={{ color: 'var(--orange)' }}>[{u.access}]</span>
                          <button type="button" onClick={() => setAssignedUsers(assignedUsers.filter(a => a.id !== u.id))} className="ml-1 hover:text-red-500 transition-colors">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-3.5 text-sm justify-center mt-2">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  Encrypt & Upload
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Editor Modal */}
      {editorOpen && (
        <div className="modal-bg fixed inset-0 flex items-center justify-center p-4 z-[100]">
          <div className="office-card w-full max-w-2xl flex flex-col" style={{ height: '80vh' }}>
            <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--divider)' }}>
              <div className="flex items-center gap-3">
                <div className="icon-box" style={{ background: 'var(--teal-bg)' }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--teal)' }}>edit_document</span>
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ fontFamily: 'var(--font-display)' }}>{editorTitle}</h3>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Version {editorVersion} · Access: {editorAccess}</p>
                </div>
              </div>
              <button onClick={() => setEditorOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 transition-colors" style={{ color: 'var(--muted)' }}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex-1 p-6 flex flex-col overflow-hidden">
              <textarea
                value={editorContent}
                onChange={e => setEditorContent(e.target.value)}
                disabled={editorAccess === 'READ'}
                className="office-input flex-1 p-4 resize-none font-mono text-sm"
                style={{ background: editorAccess === 'READ' ? 'var(--surface3)' : '#fff' }}
                placeholder="File contents here..."
              />
            </div>
            {editorAccess !== 'READ' && (
              <div className="p-6" style={{ borderTop: '1px solid var(--divider)', background: 'var(--surface2)' }}>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Commit Message</label>
                <div className="flex gap-3">
                  <input type="text" value={editorCommitMsg} onChange={e => setEditorCommitMsg(e.target.value)} placeholder="e.g., Updated section 4" className="office-input px-4 py-2 text-sm flex-1" />
                  <button onClick={handleSaveEdit} className="btn-primary px-5 py-2 text-sm">Commit Changes</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logsOpen && (
        <div className="modal-bg fixed inset-0 flex items-center justify-center p-4 z-[100]">
          <div className="office-card w-full max-w-xl flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--divider)' }}>
              <div className="flex items-center gap-3">
                <div className="icon-box" style={{ background: 'var(--amber-bg)' }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--amber)' }}>history</span>
                </div>
                <div>
                  <h3 className="font-black text-base" style={{ fontFamily: 'var(--font-display)' }}>Document Activity</h3>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Full audit trail for this file</p>
                </div>
              </div>
              <button onClick={() => setLogsOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 transition-colors" style={{ color: 'var(--muted)' }}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {logsData.length === 0 ? (
                <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>No activity found.</p>
              ) : (
                logsData.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ border: '1px solid var(--divider)' }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{log.full_name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge color={log.action === 'DOC_EDIT' ? 'orange' : 'teal'}>{log.action}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
