import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, getToken, setToken } from '../api';
export const AuthContext = createContext(null);
const normalizeUser = (u) => ({ ...u, name: [u.first_name, u.last_name].filter(Boolean).join(' '), roleLabel: ({admin:'ผู้ดูแลระบบ',technician:'เจ้าหน้าที่ซ่อม',user:'ผู้ใช้งานทั่วไป'})[u.role] || u.role });
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(getToken()));
  useEffect(() => { let active = true; if (!getToken()) { setAuthLoading(false); return; }
    apiRequest('/auth/me').then(r => { if(active) setUser(normalizeUser(r.user)); }).catch(() => { setToken(null); if(active) setUser(null); }).finally(() => { if(active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);
  const login = async (email, password) => { const r = await apiRequest('/auth/login', { method:'POST', body:JSON.stringify({email:email.trim(),password}) }); setToken(r.token); setUser(normalizeUser(r.user)); return r.user; };
  const register = async (formData) => apiRequest('/auth/register', { method:'POST', body:JSON.stringify({ first_name:formData.firstName.trim(), last_name:formData.lastName.trim(), phone:formData.phone.trim(), email:formData.email.trim().toLowerCase(), password:formData.password, address:formData.address || null, birth_date:formData.birthDate || null, gender:formData.gender || null }) });
  const logout = () => { setToken(null); setUser(null); };
  return <AuthContext.Provider value={{ user, setUser, login, register, logout, authLoading }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
