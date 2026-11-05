import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import RepairForm from './pages/RepairForm';
import RepairList from './pages/RepairList';
import EquipmentManage from './pages/EquipmentM';
import UserManage from './pages/UserM';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* หน้าที่ 1 และ 2: เข้าสู่ระบบ และ สมัครสมาชิก */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* หน้าภายในระบบ (ต้องล็อกอินก่อน) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* หน้าที่ 3 และ 4: เข้าได้ทุกคนที่ล็อกอิน */}
              <Route path="/repair-form" element={<RepairForm />} />
              <Route path="/repairs" element={<RepairList />} />

              {/* หน้าที่ 5 และ 6: เข้าได้เฉพาะคนที่มีบทบาท "ผู้ดูแลระบบ" ในข้อมูล */}
              <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route path="/users" element={<UserManage />} />
                <Route path="/equipment" element={<EquipmentManage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}