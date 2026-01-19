import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/mockDb';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  departmentId?: string;
  rollNumber?: string;
  subjects?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'admin' | 'faculty' | 'student') => Promise<boolean>;
  logout: () => void;
  switchRole: (role: 'admin' | 'faculty' | 'student') => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedUser = localStorage.getItem('attendanceUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'faculty' | 'student'): Promise<boolean> => {
    setIsLoading(true);
    try {
      const authenticatedUser = db.authenticate(email, password, role);
      if (authenticatedUser) {
        const userData: User = {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          email: authenticatedUser.email,
          role: authenticatedUser.role,
          departmentId: 'departmentId' in authenticatedUser ? authenticatedUser.departmentId : undefined,
          rollNumber: 'rollNumber' in authenticatedUser ? authenticatedUser.rollNumber : undefined,
          subjects: 'subjects' in authenticatedUser ? authenticatedUser.subjects : undefined,
        };
        setUser(userData);
        localStorage.setItem('attendanceUser', JSON.stringify(userData));
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('attendanceUser');
  };

  // Demo function to switch roles easily
  const switchRole = (role: 'admin' | 'faculty' | 'student') => {
    let demoUser: User;
    
    switch (role) {
      case 'admin':
        demoUser = {
          id: 'admin1',
          name: 'System Administrator',
          email: 'admin@university.edu',
          role: 'admin'
        };
        break;
      case 'faculty':
        demoUser = {
          id: 'fac1',
          name: 'Dr. Alex Thompson',
          email: 'alex.thompson@university.edu',
          role: 'faculty',
          departmentId: 'dept1',
          subjects: ['sub1', 'sub3']
        };
        break;
      case 'student':
        demoUser = {
          id: 'std1',
          name: 'John Smith',
          email: 'john.smith@student.university.edu',
          role: 'student',
          departmentId: 'dept1',
          rollNumber: 'CSE2021001'
        };
        break;
    }
    
    setUser(demoUser);
    localStorage.setItem('attendanceUser', JSON.stringify(demoUser));
  };

  const value = {
    user,
    login,
    logout,
    switchRole,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};