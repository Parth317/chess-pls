
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../auth/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Lock, Mail, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'; // Added ArrowLeft

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null); // For reset email sent
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const navigate = useNavigate();
    const location = useLocation();
    const { isConfigured } = useAuth();

    const from = location.state?.from?.pathname || '/';

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (!isConfigured) {
                throw new Error("Supabase is not configured. Please check your source code env variables.");
            }

            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                    }
                });
                if (error) throw error;
                alert('Account created! Please check your email to verify.');
            } else if (mode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password', // We might need to handle this route later, or just let them login with magic link
                });
                if (error) throw error;
                setSuccessMsg("Check your email for the password reset link.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate(from, { replace: true });
            }
        } catch (err: any) {
            console.error("Auth Error:", err);

            // Handle Rate Limits specifically
            if (err.message && (
                err.message.includes('rate limit') ||
                err.message.includes('429') ||
                err.message.toLowerCase().includes('too many requests')
            )) {
                setError("Service is busy (Rate Limit). This is a limitation of the free server. Please wait an hour and try again, or ask the admin to upgrade.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isConfigured) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-red-900/50">
                    <div className="flex items-center gap-3 text-red-500 mb-4">
                        <AlertCircle className="w-8 h-8" />
                        <h2 className="text-xl font-bold">Configuration Missing</h2>
                    </div>
                    <p className="text-slate-300 mb-4">
                        To enable "Super Secure" mode, you need to connect this app to Supabase.
                    </p>
                    <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2 mb-6">
                        <li>Create a project at <a href="https://supabase.com" target="_blank" className="text-blue-400 hover:underline">supabase.com</a></li>
                        <li>Copy your <code>Project URL</code> and <code>Anon Key</code></li>
                        <li>Add them to a <code>.env</code> file in the project root:</li>
                    </ol>
                    <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-green-400 overflow-x-auto mb-6">
                        VITE_SUPABASE_URL=your_url_here<br />
                        VITE_SUPABASE_ANON_KEY=your_key_here
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                    >
                        I've Added The Keys, Reload
                    </button>
                </div>
            </div>
        );
    }

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            console.error("Google Auth Error:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700/50">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img src="/chess_icon.jpg?v=3" alt="Chess Pls Logo" className="w-20 h-20 rounded-2xl shadow-xl border-2 border-slate-700/50" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Chess Pls</h1>
                    <p className="text-slate-400">Adaptive Engine</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                        <ArrowRight className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-green-400">{successMsg}</p>
                    </div>
                )}

                {/* Google Sign In Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3 mb-6 disabled:opacity-70"
                >
                    {/* Simple Google Icon SVG */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Sign in with Google
                </button>

                <div className="relative flex py-2 items-center mb-6">
                    <div className="flex-grow border-t border-slate-700"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase font-bold">Or continue with email</span>
                    <div className="flex-grow border-t border-slate-700"></div>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="grandmaster@example.com"
                            />
                        </div>
                    </div>

                    {mode !== 'forgot' && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Password</label>
                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('forgot');
                                            setError(null);
                                            setSuccessMsg(null);
                                        }}
                                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                    >
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (
                            mode === 'login' ? 'Sign In' :
                                mode === 'signup' ? 'Create Account' :
                                    'Send Reset Link'
                        )}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>

                    {mode === 'forgot' && (
                        <button
                            type="button"
                            onClick={() => {
                                setMode('login');
                                setError(null);
                                setSuccessMsg(null);
                            }}
                            className="w-full py-2 bg-transparent hover:bg-slate-700/50 text-slate-400 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </button>
                    )}
                </form>

                {mode !== 'forgot' && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-400">
                            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => {
                                    setMode(mode === 'login' ? 'signup' : 'login');
                                    setError(null);
                                    setSuccessMsg(null);
                                }}
                                className="text-blue-400 hover:text-blue-300 font-medium hover:underline focus:outline-none"
                            >
                                {mode === 'login' ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
