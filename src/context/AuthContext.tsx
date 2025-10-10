import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('fms_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('fms_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fms_user');
    }
  }, [user]);

  const login = async (username: string) => {
    try {
      // First set basic user data
      const newUser = {
        username,
        loginTime: new Date().toISOString(),
      };
      setUser(newUser);
      
      // Then fetch complete user data including role and department
      const usersResult = await api.getUsers();
      if (usersResult.success && usersResult.users) {
        const userData = usersResult.users.find((u: any) => u.username === username);
        if (userData) {
          setUser({
            username: userData.username,
            name: userData.name,
            role: userData.role,
            department: userData.department,
            loginTime: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Keep basic user data even if fetching complete data fails
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
