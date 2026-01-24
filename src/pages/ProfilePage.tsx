
import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../auth/supabase';
import { useAuth } from '../auth/AuthProvider';
import { User, Check, ArrowLeft, AlertCircle, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        getProfile();
    }, [user]);

    const getProfile = async () => {
        try {
            setLoading(true);
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();

            if (error) {
                console.warn('Error loading profile:', error);
            }

            if (data) {
                setUsername(data.username || '');
            }
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (!user) throw new Error('No user');

            const updates = {
                id: user.id,
                username,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) {
                if (error.code === '23505') {
                    throw new Error('This username is already taken. Please choose another.');
                }
                throw error;
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-8">
            <div className="max-w-2xl mx-auto">
                <Link to="/game" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Game
                </Link>

                <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-blue-600 p-3 rounded-full">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Your Profile</h1>
                            <p className="text-slate-400">{user?.email || 'Guest'}</p>
                        </div>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                            {message.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                            <p>{message.text}</p>
                        </div>
                    )}

                    <form onSubmit={updateProfile} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                minLength={3}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Choose a unique username"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !user}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? 'Saving...' : 'Update Profile'}
                        </button>
                    </form>
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => signOut()}
                        className="text-red-400 hover:text-red-300 font-bold transition-colors flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
