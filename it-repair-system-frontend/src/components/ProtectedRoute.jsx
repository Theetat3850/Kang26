import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function ProtectedRoute({ adminOnly = false }) {
 const { user, authLoading } = useAuth();
 if (authLoading) return <div className="min-h-screen grid place-items-center text-slate-600">กำลังตรวจสอบเซสชัน...</div>;
 if (!user) return <Navigate to="/login" replace />;
 if (adminOnly && user.role !== 'admin') return <Navigate to="/repair-form" replace />;
 return <Outlet />;
}
