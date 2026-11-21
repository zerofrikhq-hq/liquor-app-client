import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerRequest: (data: { email: string; password: string; full_name: string; phone_number?: string }) => Promise<{ devOtp?: string }>;
  verifyRegistrationOtp: (email: string, otp_code: string) => Promise<User>;
  forgotPasswordRequest: (email: string) => Promise<{ devOtp?: string }>;
  verifyResetOtp: (email: string, otp_code: string) => Promise<void>;
  resetPasswordVerify: (email: string, otp_code: string, new_password: string) => Promise<void>;
  updateProfile: (full_name: string, phone_number: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerRequest = async (data: { email: string; password: string; full_name: string; phone_number?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.registerRequest(data);
      return { devOtp: res.devOtp };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyRegistrationOtp = async (email: string, otp_code: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.verifyRegistrationOtp({ email, otp_code });
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPasswordRequest = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await api.forgotPasswordRequest({ email });
      return { devOtp: res.devOtp };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyResetOtp = async (email: string, otp_code: string) => {
    setIsLoading(true);
    try {
      await api.verifyResetOtp({ email, otp_code });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordVerify = async (email: string, otp_code: string, new_password: string) => {
    setIsLoading(true);
    try {
      await api.resetPasswordVerify({ email, otp_code, new_password });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (full_name: string, phone_number: string): Promise<User> => {
    if (!user) throw new Error('Not logged in');
    setIsLoading(true);
    try {
      const res = await api.updateProfile(user.id, { full_name, phone_number });
      setUser({ ...user, ...res.profile });
      return res.profile;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerRequest,
        verifyRegistrationOtp,
        forgotPasswordRequest,
        verifyResetOtp,
        resetPasswordVerify,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
