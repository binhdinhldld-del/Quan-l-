/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, ActivityLog } from '../types';
import { exportLogsToCSV } from '../utils/fileExporter';
import { Shield, UserPlus, RefreshCw, Lock, CheckCircle2, AlertTriangle, FileSpreadsheet, Search, Filter } from 'lucide-react';

interface AdminPanelProps {
  currentUser: UserAccount;
  users: UserAccount[];
  userPasswords: Record<string, string>;
  onAddUser: (username: string, fullName: string, email: string, role: 'admin' | 'user', department: string, rawPass: string) => boolean;
  onResetPassword: (username: string, newPass: string) => void;
  onToggleUserStatus: (username: string) => void;
  logs: ActivityLog[];
}

export default function AdminPanel({
  currentUser,
  users,
  userPasswords,
  onAddUser,
  onResetPassword,
  onToggleUserStatus,
  logs
}: AdminPanelProps) {
  // Creating user state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newDept, setNewDept] = useState('');
  const [newPass, setNewPass] = useState('');
  const [addUserMsg, setAddUserMsg] = useState({ type: '', text: '' });

  // Resetting pass states
  const [selectedUserToReset, setSelectedUserToReset] = useState('');
  const [resetPassVal, setResetPassVal] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  // Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Guard view
  if (currentUser.role !== 'admin') {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-red-800 text-center space-y-3">
        <AlertTriangle size={40} className="mx-auto text-red-600 animate-bounce" />
        <h3 className="text-base font-bold">KHÔNG CÓ QUYỀN TRUY CẬP</h3>
        <p className="text-xs max-w-md mx-auto">
          Phân khu này thuộc thẩm quyền tối mật của Quản trị viên hệ thống Liên đoàn Lao động Gia Lai. Vui lòng quay lại bằng tài khoản cấp cao hơn.
        </p>
      </div>
    );
  }

  // Handle user creation
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim() || !newPass.trim()) {
      setAddUserMsg({ type: 'error', text: 'Vui lòng cung cấp Tài khoản, Họ tên, và Mật khẩu khởi tạo.' });
      return;
    }

    const trimmedUsername = newUsername.trim().toLowerCase();
    const success = onAddUser(trimmedUsername, newFullName.trim(), newEmail.trim(), newRole, newDept.trim(), newPass.trim());
    if (success) {
      setAddUserMsg({ type: 'success', text: `Tạo tài khoản cán bộ "${newUsername}" thành công!` });
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      setNewDept('');
      setNewPass('');
      // Auto clear after some time
      setTimeout(() => setAddUserMsg({ type: '', text: '' }), 4000);
    } else {
      setAddUserMsg({ type: 'error', text: 'Tên tài khoản này đã tồn tại trên cơ sở dữ liệu.' });
    }
  };

  // Handle password reset
  const handleResetPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToReset || !resetPassVal.trim()) {
      setResetMsg('Vui lòng chọn tài khoản và điền mật khẩu mới.');
      return;
    }

    onResetPassword(selectedUserToReset, resetPassVal.trim());
    setResetMsg(`Đã đặt lại mật khẩu của tài khoản "${selectedUserToReset}" thành công!`);
    setResetPassVal('');
    setSelectedUserToReset('');
    setTimeout(() => setResetMsg(''), 4000);
  };

  // Filter security logs dynamically
  const filteredLogs = logs.filter(log => {
    const query = logSearch.toLowerCase();
    const matchText = 
      log.username.toLowerCase().includes(query) ||
      log.userFullName.toLowerCase().includes(query) ||
      log.target.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query);

    const matchAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchText && matchAction;
  });

  return (
    <div id="admin-control-panel-wrapper" className="space-y-6">

      {/* Grid: Create User & Reset Password forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Create User panel */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 border-b pb-2">
            <UserPlus size={16} className="text-blue-600" />
            <span>Đăng ký Tài khoản Cán bộ Tác nghiệp</span>
          </h3>

          <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
            {addUserMsg.text && (
              <div className={`p-2 rounded text-xs leading-5 ${
                addUserMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-red-50 border border-red-100 text-red-800'
              }`}>
                {addUserMsg.text}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Tài khoản (Viết liền, không dấu) *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value.replace(/\s+/g, ''))}
                  placeholder="Ví dụ: tuancb"
                  className="w-full px-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mật khẩu ban đầu *</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Mật khẩu bảo mật"
                  className="w-full px-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Họ và tên cán bộ đầy đủ *</label>
              <input
                type="text"
                required
                value={newFullName}
                onChange={e => setNewFullName(e.target.value)}
                placeholder="Ví dụ: Trần Văn Cường"
                className="w-full px-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Email liên lạc</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="cuong.t@congdoan.vn"
                  className="w-full px-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Cấp bậc phân quyền</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as 'admin' | 'user')}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option value="user">Người dùng (Tác nghiệp)</option>
                  <option value="admin">Quản trị viên (Toàn quyền)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Đơn vị công tác / Ban ngành phụ trách</label>
              <input
                type="text"
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                placeholder="Ví dụ: Ban Chính sách pháp luật, LĐLĐ TP. Pleiku"
                className="w-full px-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded cursor-pointer transition-colors"
            >
              Phê duyệt bổ sung tài khoản
            </button>
          </form>
        </div>

        {/* Reset Password & Controls */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 border-b pb-2">
              <Lock size={16} className="text-yellow-600" />
              <span>Cấp Lại Mật Khẩu Khẩn Thiết</span>
            </h3>

            <p className="text-xs text-gray-500">
              Quản trị viên có tôn quyền cấp lại ngay mật khẩu cho cán bộ trực thuộc khi họ báo mất mật khẩu hoặc bị vô hiệu truy cập.
            </p>

            <form onSubmit={handleResetPass} className="space-y-3 text-xs">
              {resetMsg && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
                  {resetMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Chọn tài khoản cán bộ</label>
                  <select
                    value={selectedUserToReset}
                    onChange={e => setSelectedUserToReset(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  >
                    <option value="">-- Chọn tài khoản --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.username}>
                        {u.username} ({u.fullName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mật khẩu mới thay thế</label>
                  <input
                    type="text"
                    value={resetPassVal}
                    onChange={e => setResetPassVal(e.target.value)}
                    placeholder="Nhập mật khẩu an toàn mới"
                    className="w-full px-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded cursor-pointer transition-colors"
              >
                Tiến hành ghi đè mật khẩu bảo mật
              </button>
            </form>
          </div>

          {/* Secure Information note representing the strict union guidelines */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-950 flex items-start gap-2.5">
            <Shield size={18} className="text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Chính sách bảo vệ bí mật công tác:</span>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Mọi hành vi khởi tạo cán bộ hoặc reset tài khoản đều được ghi nhớ trực tiếp vào sổ cái Nhật ký hoạt động tối mật để phục vụ công tác hậu kiểm từ cấp trên.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Directory list of User Accounts */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-800">
          Danh Sách Tài Khoản Đang Cấp Quyền Truy Cập
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-2">Tên đăng nhập</th>
                <th className="py-2">Họ tên cán bộ</th>
                <th className="py-2">Văn phòng / Ban ngành</th>
                <th className="py-2">Quyền lực</th>
                <th className="py-2">Trực chỉ mật khẩu hiện thời</th>
                <th className="py-2 text-right">Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 font-bold text-blue-800">{u.username}</td>
                  <td className="py-2.5 font-medium text-gray-900">{u.fullName}</td>
                  <td className="py-2.5 text-gray-500">{u.department || 'Chưa định nghĩa'}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'admin' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {u.role === 'admin' ? 'QUẢN TRỊ VIÊN' : 'CÁN BỘ NGHIỆP VỤ'}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-gray-400 text-[11px]">
                    {/* Render plain passwords because of simple local sandbox testing demand */}
                    <span>{userPasswords[u.username] || '********'}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => {
                        if (u.username === currentUser.username) {
                          alert('Bạn không thể tự khóa tài khoản của chính mình!');
                          return;
                        }
                        onToggleUserStatus(u.username);
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all focus:outline-none ${
                        u.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' 
                          : 'bg-red-50 text-red-700 border border-red-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                      }`}
                      title="Bấm để kích hoạt hoặc tạm ngưng tài khoản"
                    >
                      {u.isActive ? 'Đang kích hoạt' : 'Đăng Khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trails Logs Section */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <span>Sổ Cái Hệ Thống: Nhật Ký Tác Nghiệp An Ninh</span>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">Bảo mật cao</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Tất cả quá trình tạo, chỉnh lý, nhập xuất danh sách đều được tự động lưu trữ.</p>
          </div>
          <button 
            type="button"
            onClick={() => exportLogsToCSV(logs)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <FileSpreadsheet size={14} className="text-green-600" />
            <span>Xuất ký sự hệ thống (.CSV)</span>
          </button>
        </div>

        {/* Searching & Action Filter console */}
        <div className="flex flex-col sm:flex-row gap-3 text-xs">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={14} />
            </span>
            <input 
              type="text" 
              value={logSearch}
              onChange={e => setLogSearch(e.target.value)}
              placeholder="Kiếm cứu log theo tên, nội dung hoặc tài khoản tác động..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="w-full sm:w-52 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Filter size={14} />
            </span>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">Mọi hành động LOG</option>
              <option value="LOGIN">LOGIN (Đăng nhập)</option>
              <option value="CREATE_USER">CREATE USER (Tạo tài khoản)</option>
              <option value="RESET_PASSWORD">RESET PASSWORD (Mật khẩu)</option>
              <option value="CREATE_EMPLOYEE">CREATE EMPLOYEE (Thêm CB)</option>
              <option value="UPDATE_EMPLOYEE">UPDATE EMPLOYEE (Sửa CB)</option>
              <option value="DELETE_EMPLOYEE">DELETE EMPLOYEE (Xóa CB)</option>
              <option value="BACKUP">BACKUP (Ghi sao lưu)</option>
              <option value="RESTORE">RESTORE (Khôi phục)</option>
            </select>
          </div>
        </div>

        {/* Action Logger Directory Log Table */}
        <div className="overflow-x-auto max-h-72 overflow-y-auto border border-gray-100 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/75 sticky top-0 backdrop-blur-sm">
              <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-2 px-3">Thời gian</th>
                <th className="py-2 px-3">Người vận hành</th>
                <th className="py-2 px-3">Hành động</th>
                <th className="py-2 px-3">Đối tượng</th>
                <th className="py-2 px-3">Ghi chú sự vụ</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center italic text-gray-400">
                    Không tìm thấy bản ghi nhật ký phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2 px-3 font-semibold text-gray-700">
                      {log.userFullName} <span className="font-normal text-gray-400 text-[10px]">({log.username})</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        log.action === 'LOGIN' ? 'bg-indigo-100 text-indigo-800' :
                        log.action.includes('CREATE') ? 'bg-emerald-100 text-emerald-800' :
                        log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-800' :
                        log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-gray-800 truncate max-w-[120px]">{log.target}</td>
                    <td className="py-2 px-3 text-gray-600 truncate max-w-[280px]" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
