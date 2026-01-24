import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthProvider';

export default function Layout() {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-blue-500/30">
                <Outlet />
            </div>
        </AuthProvider>
    );
}
