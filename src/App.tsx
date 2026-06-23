/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount, Employee, ActivityLog, BackupHistory } from './types';
import { DEFAULT_USERS, INITIAL_EMPLOYEES, INITIAL_LOGS } from './data/mockData';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  // Global auth states
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Core database tables
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [backups, setBackups] = useState<BackupHistory[]>([]);

  // 1. Initial Seeding and Database Loading on App Mount
  useEffect(() => {
    // A. Users
    const storedUsersText = localStorage.getItem('gialai_users');
    let loadedUsers: UserAccount[] = [];
    if (storedUsersText) {
      try {
        loadedUsers = JSON.parse(storedUsersText);
      } catch (e) {
        console.error('Failed to parse stored users:', e);
        loadedUsers = DEFAULT_USERS;
      }
    } else {
      loadedUsers = DEFAULT_USERS;
    }
    if (!Array.isArray(loadedUsers)) {
      loadedUsers = DEFAULT_USERS;
    }
    // Auto-migrate names and departments
    loadedUsers = loadedUsers.map(u => {
      let updated = { ...u };
      if (updated.fullName === 'Nguyễn Văn Hải') updated.fullName = 'Phan Thanh Trình';
      if (updated.fullName === 'Lê Thị Phương Thảo') updated.fullName = 'Phan Thanh Quyền';
      if (updated.fullName === 'Trần Minh Tuấn') updated.fullName = 'Huỳnh Thị Kim Hoàng';
      if (updated.fullName === 'Huỳnh Thị Kim Hoàng' || updated.username === 'thuky') {
        updated.department = 'Ban Tổ chức- Kiểm tra';
      }
      if (!updated.department || updated.department === 'Ban Thường trực' || updated.department.toLowerCase() === 'ban thường trực' || updated.department.toLowerCase() === 'ban thuong truc') {
        updated.department = 'Văn phòng LĐLĐ';
      }
      return updated;
    });
    localStorage.setItem('gialai_users', JSON.stringify(loadedUsers));
    setUsers(loadedUsers);

    // B. Credentials Dictionary
    const storedPasswordsText = localStorage.getItem('gialai_userpasswords');
    let loadedPasswords: Record<string, string> = {};
    if (storedPasswordsText) {
      try {
        loadedPasswords = JSON.parse(storedPasswordsText);
      } catch (e) {
        console.error('Failed to parse stored passwords:', e);
        loadedPasswords = {
          admin: 'admin123',
          canbo: 'canbo123',
          thuky: 'thuky123'
        };
      }
    } else {
      loadedPasswords = {
        admin: 'admin123',
        canbo: 'canbo123',
        thuky: 'thuky123'
      };
      localStorage.setItem('gialai_userpasswords', JSON.stringify(loadedPasswords));
    }
    setUserPasswords(loadedPasswords);

    // C. Employees Table
    const storedEmployeesText = localStorage.getItem('gialai_employees');
    let loadedEmployees: Employee[] = [];
    if (storedEmployeesText) {
      try {
        loadedEmployees = JSON.parse(storedEmployeesText);
      } catch (e) {
        console.error('Failed to parse stored employees:', e);
        loadedEmployees = INITIAL_EMPLOYEES;
      }
    } else {
      loadedEmployees = INITIAL_EMPLOYEES;
    }
    if (!Array.isArray(loadedEmployees)) {
      loadedEmployees = INITIAL_EMPLOYEES;
    }
    // Auto-migrate names and departments
    loadedEmployees = loadedEmployees.map(e => {
      let updated = { ...e };
      if (updated.fullName === 'Nguyễn Văn Hải') updated.fullName = 'Phan Thanh Trình';
      if (updated.fullName === 'Lê Thị Phương Thảo') updated.fullName = 'Phan Thanh Quyền';
      if (updated.unit && (updated.unit === 'Ban Thường trực LĐLĐ Tỉnh Gia Lai' || updated.unit.toLowerCase().includes('ban thường trực'))) {
        updated.unit = 'Văn phòng LĐLĐ Tỉnh Gia Lai';
      }
      return updated;
    });
    localStorage.setItem('gialai_employees', JSON.stringify(loadedEmployees));
    setEmployees(loadedEmployees);

    // D. Audit Logs
    const storedLogsText = localStorage.getItem('gialai_logs');
    let loadedLogs: ActivityLog[] = [];
    if (storedLogsText) {
      try {
        loadedLogs = JSON.parse(storedLogsText);
      } catch (e) {
        console.error('Failed to parse stored logs:', e);
        loadedLogs = INITIAL_LOGS;
      }
    } else {
      loadedLogs = INITIAL_LOGS;
    }
    if (!Array.isArray(loadedLogs)) {
      loadedLogs = INITIAL_LOGS;
    }
    // Auto-migrate names
    loadedLogs = loadedLogs.map(l => {
      if (l.userFullName === 'Nguyễn Văn Hải') return { ...l, userFullName: 'Phan Thanh Trình' };
      if (l.userFullName === 'Lê Thị Phương Thảo') return { ...l, userFullName: 'Phan Thanh Quyền' };
      return l;
    });
    localStorage.setItem('gialai_logs', JSON.stringify(loadedLogs));
    setLogs(loadedLogs);

    // E. Backups History
    const storedBackupsText = localStorage.getItem('gialai_backups');
    if (storedBackupsText) {
      try {
        const parsedBackups = JSON.parse(storedBackupsText);
        if (Array.isArray(parsedBackups)) {
          setBackups(parsedBackups);
        }
      } catch (e) {
        console.error('Failed to parse stored backups:', e);
      }
    }

    // F. Try restoring active session if browser reloads
    const activeSessionUser = localStorage.getItem('gialai_activesession');
    if (activeSessionUser) {
      try {
        let userObj = JSON.parse(activeSessionUser);
        if (userObj && typeof userObj === 'object') {
          if (userObj.fullName === 'Nguyễn Văn Hải') {
            userObj.fullName = 'Phan Thanh Trình';
            localStorage.setItem('gialai_activesession', JSON.stringify(userObj));
          } else if (userObj.fullName === 'Lê Thị Phương Thảo') {
            userObj.fullName = 'Phan Thanh Quyền';
            localStorage.setItem('gialai_activesession', JSON.stringify(userObj));
          }
          // Verify user is still active in DB
          const stillActive = loadedUsers.find(u => u.username === userObj.username && u.isActive);
          if (stillActive) {
            setCurrentUser(stillActive);
          } else {
            localStorage.removeItem('gialai_activesession');
          }
        }
      } catch (err) {
        localStorage.removeItem('gialai_activesession');
      }
    }

    setIsInitializing(false);
  }, []);

  // 2. Local database table writers on state changes (Declarative sync)
  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('gialai_users', JSON.stringify(users));
  }, [users, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('gialai_userpasswords', JSON.stringify(userPasswords));
  }, [userPasswords, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('gialai_logs', JSON.stringify(logs));
  }, [logs, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('gialai_backups', JSON.stringify(backups));
  }, [backups, isInitializing]);

  // Special listener for employee edits to trigger AUTOMATIC backup options
  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('gialai_employees', JSON.stringify(employees));

    // Realtime incremental backup hook if enabled (default)
    const sch = localStorage.getItem('gia_lai_union_sch_perf') || 'realtime';
    if (sch === 'realtime' && employees.length > 0) {
      handleTriggerAutoBackup();
    }
  }, [employees, isInitializing]);

  // 3. Authenticate Success Callbacks
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('gialai_activesession', JSON.stringify(user));
    
    // Register event
    const loginLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      username: user.username,
      userFullName: user.fullName,
      role: user.role,
      action: 'LOGIN',
      target: 'Hệ thống',
      details: 'Nhân sự đăng nhập quản lý thành công'
    };
    setLogs(prev => [loginLog, ...prev]);
  };

  const handleLogout = () => {
    if (currentUser) {
      // Register departure event
      const logoutLog: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: currentUser.username,
        userFullName: currentUser.fullName,
        role: currentUser.role,
        action: 'LOGIN',
        target: 'Hệ thống',
        details: 'Đăng xuất khỏi phiên tác nghiệp an toàn'
      };
      setLogs(prev => [logoutLog, ...prev]);
    }
    setCurrentUser(null);
    localStorage.removeItem('gialai_activesession');
  };

  // 4. Backup & Restore mechanisms (Auto / Manual)
  const handleTriggerAutoBackup = () => {
    // Generate db payload
    const payload = {
      employees: JSON.stringify(employees),
      users: JSON.stringify(users),
      userPasswords: JSON.stringify(userPasswords),
      logs: JSON.stringify(logs),
      backedUpAt: new Date().toISOString()
    };
    const dataStr = JSON.stringify(payload);
    
    const newBackup: BackupHistory = {
      id: `bak-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fileName: `SAOLUU_TUDONG_${new Date().toISOString().slice(0,10).replace(/-/g, '')}`,
      recordCount: employees.length,
      userCount: users.length,
      sizeKb: (dataStr.length) / 1024,
      type: 'auto',
      data: dataStr
    };

    setBackups(prev => {
      const filtered = prev.filter(b => b.type !== 'auto'); // override old auto points to minimize memory footprint
      return [newBackup, ...filtered].slice(0, 5); // Keep top 5 rolling restores
    });
  };

  const handleTriggerManualBackup = () => {
    const payload = {
      employees: JSON.stringify(employees),
      users: JSON.stringify(users),
      userPasswords: JSON.stringify(userPasswords),
      logs: JSON.stringify(logs),
      backedUpAt: new Date().toISOString()
    };
    const dataStr = JSON.stringify(payload);

    const formatTime = new Date().toLocaleTimeString('vi-VN').replace(/[^a-zA-Z0-9]/g, '');
    const newBackup: BackupHistory = {
      id: `bak-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fileName: `SAOLUU_THUCONG_${formatTime}`,
      recordCount: employees.length,
      userCount: users.length,
      sizeKb: (dataStr.length) / 1024,
      type: 'manual',
      data: dataStr
    };

    setBackups(prev => [newBackup, ...prev].slice(0, 5));

    // Register log
    if (currentUser) {
      const logItem: ActivityLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: currentUser.username,
        userFullName: currentUser.fullName,
        role: currentUser.role,
        action: 'BACKUP',
        target: 'Sao lưu cục bộ',
        details: `Tạo thủ công điểm phục hồi "${newBackup.fileName}" thành công`
      };
      setLogs(p => [logItem, ...p]);
    }

    alert('Đã tạo thành công điểm sao lưu nội bộ đề phòng rủi ro!');
  };

  const handleRestoreBackup = (backupJsonStringText: string): boolean => {
    try {
      const outerDB = JSON.parse(backupJsonStringText);
      
      // Check for standalone files downloaded from browser (.json fully compiled)
      if (outerDB.source && outerDB.source.includes('LĐLĐ Tỉnh Gia Lai')) {
        const parsedEmpList = JSON.parse(outerDB.employees);
        const parsedUsersList = JSON.parse(outerDB.users);
        const parsedCredList = JSON.parse(outerDB.userPasswords);
        const parsedLogsList = JSON.parse(outerDB.logs);

        setEmployees(parsedEmpList);
        setUsers(parsedUsersList);
        setUserPasswords(parsedCredList);
        setLogs(parsedLogsList);

        localStorage.setItem('gialai_employees', outerDB.employees);
        localStorage.setItem('gialai_users', outerDB.users);
        localStorage.setItem('gialai_userpasswords', outerDB.userPasswords);
        localStorage.setItem('gialai_logs', outerDB.logs);

        // Restore attachment contents to IndexedDB
        if (outerDB.attachments) {
          import('./utils/indexedDBHelper').then(({ saveAllAttachmentContents }) => {
            saveAllAttachmentContents(outerDB.attachments).catch(err => {
              console.error('Failed to restore nested files to IndexedDB:', err);
            });
          });
        }
        
        return true;
      }

      // Checking for inner backups slots string format
      if (outerDB.employees) {
        const parsedEmpList = JSON.parse(outerDB.employees);
        const parsedUsersList = JSON.parse(outerDB.users);
        const parsedCredList = JSON.parse(outerDB.userPasswords);
        const parsedLogsList = JSON.parse(outerDB.logs);

        setEmployees(parsedEmpList);
        setUsers(parsedUsersList);
        setUserPasswords(parsedCredList);
        setLogs(parsedLogsList);

        localStorage.setItem('gialai_employees', outerDB.employees);
        localStorage.setItem('gialai_users', outerDB.users);
        localStorage.setItem('gialai_userpasswords', outerDB.userPasswords);
        localStorage.setItem('gialai_logs', outerDB.logs);

        // Restore attachment contents to IndexedDB
        if (outerDB.attachments) {
          import('./utils/indexedDBHelper').then(({ saveAllAttachmentContents }) => {
            saveAllAttachmentContents(outerDB.attachments).catch(err => {
              console.error('Failed to restore nested files to IndexedDB:', err);
            });
          });
        }

        return true;
      }

      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteBackupRecord = (id: string) => {
    setBackups(prev => prev.filter(b => b.id !== id));
  };

  // Loading Splash Screen while mounting storage state
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent border-b-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold tracking-wider uppercase text-yellow-400">
            HỆ THỐNG LIÊN ĐOÀN GIA LAI • ĐANG KHỞI CHẠY KHÔNG GIAN BẢO MẬT
          </p>
          <span className="text-[10px] text-slate-500 italic">Kiểm tra tính an toàn của Cơ sở dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div id="applet-primary-container-root">
      {currentUser ? (
        <Dashboard 
          currentUser={currentUser}
          onLogout={handleLogout}
          employees={employees}
          setEmployees={setEmployees}
          users={users}
          setUsers={setUsers}
          userPasswords={userPasswords}
          setUserPasswords={setUserPasswords}
          logs={logs}
          setLogs={setLogs}
          backups={backups}
          onTriggerBackup={handleTriggerManualBackup}
          onRestoreBackup={handleRestoreBackup}
          onDeleteBackup={handleDeleteBackupRecord}
        />
      ) : (
        <Login 
          onLoginSuccess={handleLoginSuccess}
          users={users}
          userPasswords={userPasswords}
        />
      )}
    </div>
  );
}
