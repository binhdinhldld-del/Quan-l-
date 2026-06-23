/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount, Employee, ActivityLog, BackupHistory } from '../types';
import TradeUnionLogo from './TradeUnionLogo';
import MemberTable from './MemberTable';
import MemberModal from './MemberModal';
import StatsView from './StatsView';
import AdminPanel from './AdminPanel';
import BackupView from './BackupView';
import ConfirmModal from './ConfirmModal';
import { LogOut, User, Bell, Radio, Database, Shield, LayoutGrid, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  currentUser: UserAccount;
  onLogout: () => void;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  userPasswords: Record<string, string>;
  setUserPasswords: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  logs: ActivityLog[];
  setLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  backups: BackupHistory[];
  onTriggerBackup: (type: 'auto' | 'manual') => void;
  onRestoreBackup: (backupData: string) => boolean;
  onDeleteBackup: (id: string) => void;
}

interface NotificationMsg {
  id: string;
  title: string;
  text: string;
  timestamp: string;
}

export default function Dashboard({
  currentUser,
  onLogout,
  employees,
  setEmployees,
  users,
  setUsers,
  userPasswords,
  setUserPasswords,
  logs,
  setLogs,
  backups,
  onTriggerBackup,
  onRestoreBackup,
  onDeleteBackup
}: DashboardProps) {
  // Tabs navigation
  const [activeTab, setActiveTab] = useState<'employees' | 'stats' | 'admin' | 'backup'>('employees');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationMsg[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Reusable custom dialogs for confirm and alert
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'danger' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    isAlertOnly?: boolean;
  } | null>(null);

  const customConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'warning' | 'danger' | 'info' | 'success' = 'warning',
    confirmText = 'Xác nhận'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      onCancel: () => {
        setConfirmDialog(null);
      }
    });
  };

  // Push notification helper definition
  const triggerPushNotification = (title: string, text: string) => {
    const newNotice = {
      id: `notice-${Date.now()}`,
      title,
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN')
    };
    setNotifications(prev => [newNotice, ...prev].slice(0, 5)); // Keep last 5
    // Optionally auto-open or flash
  };

  // Pre-load default welcome notice
  useEffect(() => {
    triggerPushNotification(
      'Hệ thống trực tuyến',
      `Chào mừng đồng chí ${currentUser.fullName} đăng nhập thành công. Giao thức bảo mật đã sẵn sàng.`
    );
  }, []);

  // Sync / Action Hooks for system-wide notifications
  const handleAddNewEmployee = () => {
    setEditTarget(null);
    setIsModalOpen(true);
  };

  const handleEditEmployeeStart = (emp: Employee) => {
    setEditTarget(emp);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = (id: string) => {
    const target = employees.find(e => e.id === id);
    if (!target) return;

    customConfirm(
      'Xác nhận xoá cán bộ',
      `Bạn có chắc chắn muốn xóa vĩnh viễn dữ liệu cán bộ "${target.fullName}" khỏi sổ cái? Hành động này không thể hoàn tác.`,
      () => {
        setEmployees(prev => prev.filter(e => e.id !== id));
        
        // Update Log
        const auditLog: ActivityLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          username: currentUser.username,
          userFullName: currentUser.fullName,
          role: currentUser.role,
          action: 'DELETE_EMPLOYEE',
          target: target.fullName,
          details: `Đã xóa vĩnh viễn hồ sơ cán bộ thuộc đơn vị: ${target.unit}`
        };
        setLogs(prev => [auditLog, ...prev]);
        
        // Push Announcement
        triggerPushNotification('Xóa cán bộ', `Đã loại khỏi danh sách cán bộ: ${target.fullName}.`);
      },
      'danger',
      'Xóa vĩnh viễn'
    );
  };

  // Export/Import bulk of employees from file
  const handleImportEmployees = (imported: Omit<Employee, 'id' | 'createdAt' | 'modifiedAt' | 'attachments'>[]) => {
    const now = new Date().toISOString();
    const newEmployees: Employee[] = imported.map((item, index) => ({
      ...item,
      id: `emp-bulk-${Date.now()}-${index}`,
      attachments: [],
      createdAt: now,
      modifiedAt: now
    }));

    setEmployees(prev => [...newEmployees, ...prev]);

    // Create a batch activity log
    const auditLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      username: currentUser.username,
      userFullName: currentUser.fullName,
      role: currentUser.role,
      action: 'IMPORT_EMPLOYEES',
      target: `${newEmployees.length} cán bộ`,
      details: `Đã nhập khẩu hàng loạt hồ sơ cán bộ từ tệp mẫu .CSV (${newEmployees.length} cán bộ).`
    };
    setLogs(prev => [auditLog, ...prev]);

    // Push notification
    triggerPushNotification(
      'Nhập hàng loạt',
      `Đã nhập khẩu thành công hồ sơ của ${newEmployees.length} cán bộ đoàn viên.`
    );
  };

  // Save or update an employee
  const handleSaveEmployee = (formData: Omit<Employee, 'id' | 'createdAt' | 'modifiedAt'> & { id?: string }) => {
    const now = new Date().toISOString();

    if (formData.id) {
      // Edit existing member
      setEmployees(prev => prev.map(emp => {
        if (emp.id === formData.id) {
          return {
            ...emp,
            fullName: formData.fullName,
            dob: formData.dob,
            phoneNumber: formData.phoneNumber,
            position: formData.position,
            unit: formData.unit,
            avatar: formData.avatar,
            customNotes: formData.customNotes,
            workProgress: formData.workProgress,
            status: formData.status,
            attachments: formData.attachments,
            modifiedAt: now
          };
        }
        return emp;
      }));

      // Log action
      const auditLog: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: now,
        username: currentUser.username,
        userFullName: currentUser.fullName,
        role: currentUser.role,
        action: 'UPDATE_EMPLOYEE',
        target: formData.fullName,
        details: `Đã cập nhật các thông số lý lịch, tệp đính kèm và tiến độ: ${formData.workProgress}%`
      };
      setLogs(prev => [auditLog, ...prev]);

      // Notice
      triggerPushNotification('Cập nhật cán bộ', `Đã ghi nhận sửa đổi hồ sơ đồng chí: ${formData.fullName}.`);
    } else {
      // Add a fresh member
      const newId = `emp-${Date.now()}`;
      const newEmp: Employee = {
        id: newId,
        fullName: formData.fullName,
        dob: formData.dob,
        phoneNumber: formData.phoneNumber,
        position: formData.position,
        unit: formData.unit,
        avatar: formData.avatar,
        customNotes: formData.customNotes,
        workProgress: formData.workProgress,
        status: formData.status,
        attachments: formData.attachments,
        createdAt: now,
        modifiedAt: now
      };

      setEmployees(prev => [newEmp, ...prev]);

      // Log Action
      const auditLog: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: now,
        username: currentUser.username,
        userFullName: currentUser.fullName,
        role: currentUser.role,
        action: 'CREATE_EMPLOYEE',
        target: formData.fullName,
        details: `Thêm mới cán bộ vào đơn vị: ${formData.unit}`
      };
      setLogs(prev => [auditLog, ...prev]);

      // Notice
      triggerPushNotification('Thêm mới cán bộ', `Đã bổ sung thành công hồ sơ đồng chí: ${formData.fullName}.`);
    }
  };

  // User accounts administration interfaces
  const handleAddUser = (
    username: string, 
    fullName: string, 
    email: string, 
    role: 'admin' | 'user', 
    department: string, 
    rawPass: string
  ): boolean => {
    // Duplication check
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return false;
    }

    const newUser: UserAccount = {
      id: `u-${Date.now()}`,
      username: username.toLowerCase(),
      fullName,
      email,
      role,
      department,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    setUserPasswords(prev => ({ ...prev, [username.toLowerCase()]: rawPass }));

    // Log action
    const auditLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      userFullName: currentUser.fullName,
      role: currentUser.role,
      action: 'CREATE_USER',
      target: username,
      details: `Được khởi tạo cấp quyền truy cập: ${role.toUpperCase()}`
    };
    setLogs(prev => [auditLog, ...prev]);

    triggerPushNotification('Thêm tài khoản', `Đã cấp tài khoản bổ sung cho đồng chí: ${fullName}.`);
    return true;
  };

  const handleResetPassword = (username: string, newPass: string) => {
    setUserPasswords(prev => ({ ...prev, [username]: newPass }));
    
    // Log action
    const auditLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      userFullName: currentUser.fullName,
      role: currentUser.role,
      action: 'RESET_PASSWORD',
      target: username,
      details: 'Ghi mới ghi đè mật khẩu bảo mật'
    };
    setLogs(prev => [auditLog, ...prev]);
    
    triggerPushNotification('Đặt lại mật khẩu', `Hệ thống vừa cập nhật khóa của tài khoản: ${username}.`);
  };

  const handleToggleUserStatus = (username: string) => {
    setUsers(prev => prev.map(u => {
      if (u.username === username) {
        const nextState = !u.isActive;
        
        // Log action
        const auditLog: ActivityLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          username: currentUser.username,
          userFullName: currentUser.fullName,
          role: currentUser.role,
          action: 'UPDATE_EMPLOYEE',
          target: username,
          details: `Thay đổi trạng thái tài khoản thành: ${nextState ? 'Kích hoạt' : 'Khóa'}`
        };
        setLogs(prev => [auditLog, ...prev]);
        
        triggerPushNotification('Trạng thái tài khoản', `Đã ${nextState ? 'kích hoạt' : 'khóa'} tài khoản ${username}.`);
        return { ...u, isActive: nextState };
      }
      return u;
    }));
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden select-none">
      
      {/* 1. Header Area conforming with the Sleek Design Theme */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40 print:hidden shadow-sm">
        
        {/* Left Emblem and Unit Name */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center shadow-sm rounded-full overflow-hidden">
            <TradeUnionLogo size={40} />
          </div>
          <div className="leading-tight">
            <h1 className="font-extrabold text-base sm:text-lg text-blue-900 tracking-tight">LIÊN ĐOÀN LAO ĐỘNG TỈNH GIA LAI</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest">Hệ thống Quản lý Nhân sự Cán bộ</p>
          </div>
        </div>

        {/* Right Controls & Profile */}
        <div className="flex items-center gap-3 shrink-0 text-xs">
          
          {/* Real-time Network / Offline Status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-100 font-bold">
            <Radio size={12} className="animate-pulse" />
            <span>Thời gian thực & Ngoại tuyến</span>
          </div>

          {/* Notifications System Bell icon with absolute dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowNotificationCenter(!showNotificationCenter)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 relative transition-colors focus:outline-none cursor-pointer"
              title="Thông báo cập nhật từ hệ thống"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-bounce" />
              )}
            </button>

            {/* Float notification box listing */}
            {showNotificationCenter && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2.5 z-50 text-xs animate-slide-down">
                <div className="px-3 pb-2 border-b border-slate-150 flex justify-between items-center bg-slate-50/70">
                  <span className="font-bold text-slate-800">Thông báo đẩy hệ thống ({notifications.length})</span>
                  <button 
                    onClick={() => setNotifications([])}
                    className="text-[10px] text-blue-600 hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto pt-1 divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center italic text-slate-400">Không có cập nhật mới.</p>
                  ) : (
                    notifications.map(notice => (
                      <div key={notice.id} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between font-semibold text-slate-900 text-[11px] mb-0.5">
                          <span>{notice.title}</span>
                          <span className="text-[9px] text-slate-400 font-mono font-normal">{notice.timestamp}</span>
                        </div>
                        <p className="text-slate-500 text-[10.5px] leading-relaxed">{notice.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Block */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=0054A6&color=fff`} 
                alt="User"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden sm:block leading-tight text-left">
              <div className="text-slate-800 text-xs font-black">
                Xin chào: <span className="text-blue-900">{currentUser.fullName}</span>
              </div>
              <div className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>Chức vụ: {currentUser.role === 'admin' ? 'Quản trị viên cấp cao' : 'Cán bộ tác nghiệp'}</span>
              </div>
            </div>
          </div>

          {/* Logout Trigger button */}
          <button 
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none cursor-pointer"
            title="Đăng xuất khỏi phiên tác nghiệp"
          >
            <LogOut size={18} />
          </button>
        </div>

      </header>

      {/* Outer Flex row split between Sidebar and Main Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* 2. Left side navigation sidebar aligned to Sleek Interface */}
        <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col shrink-0">
          <nav className="flex-1 py-6 px-3 space-y-1">
            
            <div className="px-3 mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Danh mục chính</span>
            </div>

            <button
              onClick={() => setActiveTab('employees')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left font-semibold text-sm cursor-pointer ${
                activeTab === 'employees' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutGrid size={17} />
              <span>Quản lý Cán bộ</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left font-semibold text-sm cursor-pointer ${
                activeTab === 'stats' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Bell size={17} className={notifications.length > 0 ? "text-yellow-400 animate-pulse" : ""} />
              <span>Báo cáo Thống kê</span>
            </button>

            <div className="pt-6 px-3 mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hệ thống</span>
            </div>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left font-semibold text-sm cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Shield size={17} />
                <span>Phân quyền & Bảo mật</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('backup')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left font-semibold text-sm cursor-pointer ${
                activeTab === 'backup' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Database size={17} />
              <span>Sao lưu dữ liệu</span>
            </button>

          </nav>

          {/* Backup meta status custom widget */}
          <div className="p-4 bg-slate-800/50 m-3 rounded-xl border border-slate-700/50 text-xs">
            <p className="text-[10px] text-slate-400 mb-2 font-semibold tracking-wider uppercase">DỮ LIỆU ĐÃ SAO LƯU</p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300">
                {backups.length > 0 
                  ? `Điểm lưu: ${new Date(backups[0].timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}` 
                  : 'Bảo mật tuyệt đối'}
              </span>
              <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold font-mono">
                OK
              </span>
            </div>
          </div>
        </aside>

        {/* Right main workspace layout */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          
          <main className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
            
            {/* 3. Majestic 4-card statistics dynamic summary grid from the Sleek Design */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <p className="text-xs text-slate-500 font-bold lowercase first-letter:uppercase">Tổng số cán bộ</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{employees.length}</h3>
                <div className="mt-1.5 text-[10px] text-blue-600 font-extrabold flex items-center gap-1">
                  <span>+0{employees.length}</span> danh sách thực tế
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <p className="text-xs text-slate-500 font-bold lowercase first-letter:uppercase">Công đoàn cơ sở</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {new Set(employees.map(e => e.unit)).size}
                </h3>
                <div className="mt-1.5 text-[10px] text-slate-400 font-semibold">Tỉnh Gia Lai</div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <p className="text-xs text-slate-500 font-bold lowercase first-letter:uppercase">Tệp tin đính kèm</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {employees.reduce((acc, current) => acc + (current.attachments?.length || 0), 0)}
                </h3>
                <div className="mt-1.5 text-[10px] text-slate-400 font-semibold">Hồ sơ bảo mật an toàn</div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <p className="text-xs text-slate-500 font-bold lowercase first-letter:uppercase">Thử việc huấn luyện</p>
                <h3 className="text-2xl font-black text-orange-600 mt-1">
                  {employees.filter(e => e.status === 'probation').length}
                </h3>
                <div className="mt-1.5 text-[10px] text-orange-500 font-semibold">Chờ hướng dẫn</div>
              </div>
            </div>

            {/* 4. Active tab visual display component panel */}
            <div className="flex-1 min-h-0">
              {activeTab === 'employees' && (
                <MemberTable 
                  currentUser={currentUser}
                  employees={employees}
                  onEditEmployee={handleEditEmployeeStart}
                  onDeleteEmployee={handleDeleteEmployee}
                  onOpenAddModal={handleAddNewEmployee}
                  onImportEmployees={handleImportEmployees}
                />
              )}

              {activeTab === 'stats' && (
                <StatsView employees={employees} />
              )}

              {activeTab === 'admin' && (
                <AdminPanel 
                  currentUser={currentUser}
                  users={users}
                  userPasswords={userPasswords}
                  onAddUser={handleAddUser}
                  onResetPassword={handleResetPassword}
                  onToggleUserStatus={handleToggleUserStatus}
                  logs={logs}
                />
              )}

              {activeTab === 'backup' && (
                <BackupView 
                  onTriggerBackup={onTriggerBackup}
                  onRestoreBackup={onRestoreBackup}
                  backups={backups}
                  onDeleteBackup={onDeleteBackup}
                  employeeCount={employees.length}
                  userCount={users.length}
                />
              )}
            </div>

          </main>

          {/* Persistent subtle footer inside the portal layout */}
          <footer className="h-10 bg-white border-t border-slate-200 px-6 shrink-0 flex items-center justify-between text-[11px] text-slate-400 print:hidden">
            <p>Hệ thống Quản lý Liên đoàn Lao động Tỉnh Gia Lai • Phiên bản v2.1</p>
            <div className="flex items-center gap-1.5 font-bold text-slate-500">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Tự động mã hóa sao lưu cục bộ</span>
            </div>
          </footer>

        </div>

      </div>

      {/* 5. Details Editing Overlay Modal */}
      <MemberModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSaveEmployee}
        employeeToEdit={editTarget}
      />

      {/* 6. Custom Reusable Confirmation and Alert Overlay Modal */}
      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          isAlertOnly={confirmDialog.isAlertOnly}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel || (() => setConfirmDialog(null))}
          onClose={() => setConfirmDialog(null)}
        />
      )}

    </div>
  );
}
