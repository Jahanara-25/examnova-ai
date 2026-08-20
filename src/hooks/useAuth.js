import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const seedUsers = {
  student: { email: 'student@examai.com', password: 'Student@123', role: 'student' },
  teacher: { email: 'teacher@examai.com', password: 'Teacher@123', role: 'teacher' },
  admin: { email: 'admin@examai.com', password: 'Admin@123', role: 'admin' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('examnova-user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      localStorage.setItem('examnova-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('examnova-user');
    }
  }, [user]);

  const login = (role, email, password) => {
    const foundUser = seedUsers[role];
    if (foundUser && email === foundUser.email && password === foundUser.password) {
      const authenticatedUser = { ...foundUser, name: `${role.charAt(0).toUpperCase()}${role.slice(1)}` };
      setUser(authenticatedUser);
      navigate(`/${role}/dashboard`);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    navigate('/');
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout }),
    [user],
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}
