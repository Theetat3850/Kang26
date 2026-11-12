
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiRequest, getToken, setToken } from '../api';

export const AuthContext = createContext(null);

const normalizeUser = (u) => ({
  ...u,
  name: [u.first_name, u.last_name].filter(Boolean).join(' '),
  roleLabel: ({
    admin: 'ผู้ดูแลระบบ',
    technician: 'เจ้าหน้าที่ซ่อม',
    user: 'ผู้ใช้งานทั่วไป',
  })[u.role] || u.role,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(getToken()));

  // โหลดข้อมูลผู้ใช้และ Role ล่าสุดจาก Backend
  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return null;
    }

    try {
      const r = await apiRequest('/auth/me');
      const updatedUser = normalizeUser(r.user);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      setToken(null);
      setUser(null);
      throw error;
    }
  }, []);

  // ตรวจสอบ Session ตอนเปิดเว็บ
  useEffect(() => {
    let active = true;

    if (!getToken()) {
      setAuthLoading(false);
      return;
    }

    refreshUser()
      .catch(() => {})
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshUser]);

  // ตรวจสอบ Role ใหม่ทุก 30 วินาที
  useEffect(() => {
    if (!user || !getToken()) return;

    const interval = setInterval(() => {
      refreshUser().catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, refreshUser]);

  const login = async (email, password) => {
    const r = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });

    setToken(r.token);
    setUser(normalizeUser(r.user));
    return r.user;
  };

  const register = async (formData) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        address: formData.address || null,
        birth_date: formData.birthDate || null,
        gender: formData.gender || null,
      }),
    });

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        authLoading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
