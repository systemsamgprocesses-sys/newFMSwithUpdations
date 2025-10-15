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
    const savedExpiry = localStorage.getItem('fms_user_expiry');
    
    if (savedUser && savedExpiry) {
      const expiryDate = new Date(savedExpiry);
      const now = new Date();
      
      // Check if session is still valid (30 days)
      if (now < expiryDate) {
        return JSON.parse(savedUser);
      } else {
        // Session expired, clear storage
        localStorage.removeItem('fms_user');
        localStorage.removeItem('fms_user_expiry');
      }
    }
    
    return null;
  });

  useEffect(() => {
    if (user) {
      // Set expiry to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      localStorage.setItem('fms_user', JSON.stringify(user));
      localStorage.setItem('fms_user_expiry', expiryDate.toISOString());
    } else {
      localStorage.removeItem('fms_user');
      localStorage.removeItem('fms_user_expiry');
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

  // Session refresh mechanism - extend session on user activity
  useEffect(() => {
    if (!user) return;

    const refreshSession = () => {
      const savedUser = localStorage.getItem('fms_user');
      if (savedUser) {
        // Refresh the expiry date to 30 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        localStorage.setItem('fms_user_expiry', expiryDate.toISOString());
      }
    };

    // Refresh session on user activity (mousemove, click, keypress)
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, refreshSession, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, refreshSession, true);
      });
    };
  }, [user]);

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
