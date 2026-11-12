import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Wrench, Home, FilePlus, ListOrdered,
  Users, Monitor, Activity, LogOut, ChevronDown, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'หน้าแรก', path: '/repair-form', icon: Home, adminOnly: false },
    { name: 'แจ้งซ่อมอุปกรณ์', path: '/repair-form', icon: FilePlus, adminOnly: false },
    { name: 'รายการแจ้งซ่อม', path: '/repairs', icon: ListOrdered, adminOnly: false },
    { name: 'จัดการผู้ใช้งาน', path: '/users', icon: Users, adminOnly: true },
    { name: 'จัดการอุปกรณ์ไอที', path: '/equipment', icon: Monitor, adminOnly: true },
    { name: 'IoT Dashboard', path: '/iot', icon: Activity, roles: ['admin', 'technician'] },
  ];

  // แสดงเมนูแอดมินเฉพาะคนที่มีตำแหน่ง (role) เป็น "ผู้ดูแลระบบ" ในข้อมูล
  const visibleMenus = menuItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'admin') {
      return false;
    }

    if (item.roles && !item.roles.includes(user?.role)) {
      return false;
    }

    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#eef3f9]">
      {/* แถบเมนูด้านซ้าย */}
      <aside className="w-64 bg-[#0f2d59] text-white flex flex-col shrink-0">
        <div className="p-6 flex flex-col items-center border-b border-blue-800/50">
          <div className="w-16 h-14 border-2 border-white rounded-lg flex items-center justify-center mb-3 relative">
            <Wrench className="w-7 h-7 text-white" />
            <div className="absolute -bottom-2 w-6 h-1.5 bg-white rounded-full" />
          </div>
          <h1 className="text-lg font-bold text-center leading-snug">
            ระบบแจ้งซ่อม<br />อุปกรณ์ไอทีในออฟฟิศ
          </h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {visibleMenus.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#0b76ef] text-white shadow-md'
                      : 'text-blue-100 hover:bg-blue-900/50'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-4 mt-4 border-t border-blue-800/60">
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-100 hover:bg-red-600/80 hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* พื้นที่ฝั่งขวา */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white px-8 flex items-center justify-end shadow-sm">
          <div className="flex items-center gap-2.5 text-gray-700">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#0f2d59]">
              <User className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold block leading-tight">{user?.name}</span>
              <span className="text-[11px] text-slate-400 block leading-tight">{user?.roleLabel || user?.role}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </header>

        {/* เนื้อหาหลักของแต่ละหน้า */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}