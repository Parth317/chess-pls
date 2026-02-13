import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthProvider';
import { useAppearance } from '../hooks/useAppearance';

export default function Layout() {
    const { appBackground } = useAppearance();

    return (
        <AuthProvider>
            <div className={`min-h-screen text-slate-200 font-sans selection:bg-blue-500/30 app-bg-${appBackground}`}>
                <Outlet />
            </div>
        </AuthProvider>
    );
}
