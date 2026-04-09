import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, ShieldAlert, Eye, EyeOff, User, Users } from 'lucide-react';

const EmailInput = ({ email, setEmail }: any) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Mail className="w-5 h-5" />
        </div>
        <input
            type="email" required placeholder="Email address"
            className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
            value={email} onChange={(e) => setEmail(e.target.value)}
        />
    </div>
);

const PasswordInput = ({ password, setPassword, showPassword, setShowPassword }: any) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <ShieldAlert className="w-5 h-5" />
        </div>
        <input
            type={showPassword ? 'text' : 'password'} required placeholder="Password"
            className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
            value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-indigo-400 transition-colors"
            title={showPassword ? "Hide password" : "Show password"}
        >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
    </div>
);

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [roleName, setRoleName] = useState('USER');
    
    // V2 Architecture Additions
    const [departmentName, setDepartmentName] = useState('Engineering');
    const [teamName, setTeamName] = useState('');
    const [teamCode, setTeamCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const endpoint = isLogin ? 'login' : 'signup';
        try {
            const payload = isLogin ? { email, password } : { 
                email, 
                password, 
                roleName, 
                fullName, 
                departmentName,
                teamName: roleName === 'MANAGER' ? teamName : undefined,
                teamCode 
            };

            const { data } = await axios.post(`http://127.0.0.1:5000/api/auth/${endpoint}`, payload);
            if (isLogin) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('userName', data.fullName);
                navigate('/dashboard');
            } else {
                setIsLogin(true);
                alert('Account created! Please sign in with your new credentials.');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900 shadow-2xl rounded-2xl border border-slate-800 overflow-hidden relative">
                
                <div 
                    className="flex w-[200%] transition-transform duration-500 ease-in-out"
                    style={{ transform: isLogin ? 'translateX(0)' : 'translateX(-50%)' }}
                >
                    {/* --- LOGIN PANEL --- */}
                    <div className="w-1/2 p-8 space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 mb-4">
                                <Lock className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                                SecureDocs
                            </h2>
                            <p className="text-slate-400 mt-2">Sign in to access your vault</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <EmailInput email={email} setEmail={setEmail} />
                            <PasswordInput password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} />
                            <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]">
                                Authenticate
                            </button>
                        </form>

                        <div className="text-center text-sm text-slate-400">
                            Don't have access?{' '}
                            <button type="button" onClick={() => setIsLogin(false)} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer">
                                Request access
                            </button>
                        </div>
                    </div>

                    {/* --- SIGNUP PANEL --- */}
                    <div className="w-1/2 p-8 space-y-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-4 transition-colors">
                                <Lock className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">
                                Create Identity
                            </h2>
                            <p className="text-slate-400 mt-2">Register a secure account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text" required placeholder="Full Name"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 text-slate-200"
                                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>

                            <EmailInput email={email} setEmail={setEmail} />
                            <PasswordInput password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} />
                            
                            <select
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-slate-300"
                            >
                                <option value="USER">User (Standard Access)</option>
                                <option value="MANAGER">Manager (Elevated Access)</option>
                                <option value="ADMIN">Admin (Full System Access)</option>
                            </select>

                            {/* Department Dropdown */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Department</label>
                                <select 
                                    value={departmentName} 
                                    onChange={(e) => setDepartmentName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="Engineering">Engineering</option>
                                    <option value="HR">HR</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Operations">Operations</option>
                                </select>
                            </div>

                            {/* Dynamic Team Interface */}
                            {roleName === 'MANAGER' ? (
                                <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl space-y-4">
                                    <h4 className="text-sm font-semibold text-indigo-400 mb-2">Configure Your Network</h4>
                                    <div>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="New Team Name" 
                                            value={teamName} 
                                            onChange={(e) => setTeamName(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Create the Invite Code" 
                                            value={teamCode} 
                                            onChange={(e) => setTeamCode(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Team Invite Code (Optional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Paste exact code from Manager" 
                                        value={teamCode} 
                                        onChange={(e) => setTeamCode(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                    />
                                </div>
                            )}

                            <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]">
                                Create Account
                            </button>
                        </form>

                        <div className="text-center text-sm text-slate-400">
                            Already registered?{' '}
                            <button type="button" onClick={() => setIsLogin(true)} className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer">
                                Sign in
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Auth;
