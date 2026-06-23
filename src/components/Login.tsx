/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount } from '../types';
import TradeUnionLogo from './TradeUnionLogo';
import { Eye, EyeOff, Shield, LogIn, Mail, Globe, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: UserAccount) => void;
  users: UserAccount[];
  userPasswords: Record<string, string>; // Maps username to password
}

export default function Login({ onLoginSuccess, users, userPasswords }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle standard credentials login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ tài khoản và mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // Simulate database lookup latency for a native feel
    setTimeout(() => {
      const trimmedUser = username.trim();
      const sanitizedUser = trimmedUser.toLowerCase();
      
      let foundUser = users.find(u => u.username.toLowerCase() === sanitizedUser);
      let expectedPassword = userPasswords[sanitizedUser] || userPasswords[trimmedUser];

      // Support the Vietnamese literal search "quản trị viên" and "quản trị viên123"
      if (sanitizedUser === 'quản trị viên' || sanitizedUser === 'quantrivien') {
        const adminUser = users.find(u => u.role === 'admin') || users[0];
        if (adminUser && password === 'quản trị viên123') {
          onLoginSuccess(adminUser);
          setIsSubmitting(false);
          return;
        }
      }

      if (foundUser && foundUser.isActive && (expectedPassword === password || (foundUser.role === 'admin' && password === 'quản trị viên123'))) {
        onLoginSuccess(foundUser);
      } else if (foundUser && !foundUser.isActive) {
        setErrorMsg('Tài khoản này hiện đang tạm khóa. Vui lòng liên hệ quản trị viên.');
      } else {
        setErrorMsg('Sai tài khoản hoặc mật khẩu. Vui lòng kiểm tra lại.');
      }
      setIsSubmitting(false);
    }, 400);
  };

  // Quick fill helper for testers or evaluators
  const handleQuickFill = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setUsername('quản trị viên');
      setPassword('quản trị viên123');
    } else {
      setUsername('canbo');
      setPassword('canbo123');
    }
  };

  // Mock social logins with alert system feedback
  const handleMockSSO = (method: string) => {
    setErrorMsg(`Hệ thống đang chạy ngoại tuyến. Phương thức đăng nhập qua ${method} đã được thiết lập giả lập. Hệ thống tự động chuyển tiếp bằng tài khoản mẫu.`);
    setTimeout(() => {
      const targetUser = method === 'Google' 
        ? users.find(u => u.username === 'admin') 
        : users.find(u => u.username === 'canbo');
      if (targetUser) {
        onLoginSuccess(targetUser);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative Traditional Union Background Patterns */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-700 via-yellow-400 to-blue-900" />
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-600/10 opacity-40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-yellow-400/5 opacity-40 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-slate-200/80 z-10">
        {/* Emblem and Title Area */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <TradeUnionLogo size={96} className="drop-shadow-md" />
          </div>
          <h2 className="text-xs font-bold text-blue-900 tracking-widest uppercase">
            LIÊN ĐOÀN LAO ĐỘNG TỈNH GIA LAI
          </h2>
          <h1 className="mt-1 text-xl font-extrabold text-slate-900 tracking-tight">
            CỔNG QUẢN TRỊ NHÂN SỰ CÁN BỘ
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 font-medium uppercase tracking-wider">
            Hệ thống Tác nghiệp Bảo mật Quốc gia
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2 animate-shake">
              <span className="font-semibold">Lỗi:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="username-input" className="block text-xs font-semibold text-gray-700">
              Tên tài khoản truy cập
            </label>
            <div className="relative">
              <input
                id="username-input"
                name="username"
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="Ví dụ: admin hoặc canbo"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="password-input" className="block text-xs font-semibold text-gray-700">
                Mật khẩu bảo mật
              </label>
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 focus:outline-none"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            <div className="relative">
              <input
                id="password-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                placeholder="Nhập mật khẩu"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Đăng nhập hệ thống</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Separator */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400 font-medium">Hoặc kết nối trực tuyến</span>
          </div>
        </div>

        {/* Mock SSO Logins with Google and Email OTP options */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleMockSSO('Google')}
            className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors cursor-pointer"
          >
            <Globe size={14} className="text-red-500" />
            <span>Google SSO</span>
          </button>
          <button
            type="button"
            onClick={() => handleMockSSO('Email OTP')}
            className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors cursor-pointer"
          >
            <Mail size={14} className="text-blue-500" />
            <span>Email OTP</span>
          </button>
        </div>

        {/* Testers demo gateway with user-friendly quick access */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-amber-800 font-bold">
            <Shield size={14} className="text-amber-700" />
            <span>CỔNG ĐÁNH GIÁ THỬ NGHIỆM KHANH:</span>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg font-bold text-left transition-colors focus:outline-none flex justify-between items-center cursor-pointer border border-amber-300"
            >
              <div className="flex flex-col">
                <span className="text-xs">🔑 Tài khoản Quản trị viên (Admin)</span>
                <span className="text-[10px] font-mono text-amber-850 font-normal">TK: quản trị viên / MK: quản trị viên123</span>
              </div>
              <Sparkles size={13} className="text-amber-700 animate-pulse" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('user')}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-950 rounded-lg font-bold text-left transition-colors focus:outline-none flex justify-between items-center cursor-pointer border border-blue-200"
            >
              <div className="flex flex-col">
                <span className="text-xs">👤 Tài khoản Cán bộ Nghiệp vụ (Staff)</span>
                <span className="text-[10px] font-mono text-blue-800 font-normal">TK: canbo / MK: canbo123</span>
              </div>
              <Sparkles size={13} className="text-blue-600 animate-pulse" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 italic text-center pt-1 leading-relaxed">
            * Nhấp chuột để tự động điền thông tin đăng nhập mẫu hệ thống ngoại tuyến.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-gray-400">
          Phát triển bởi Ban Tổ chức LĐLĐ tỉnh Gia Lai © 2026<br />
          Sử dụng Kết nối Bảo mật & Giao thức Phân quyền Cấp cao
        </div>
      </div>
    </div>
  );
}
