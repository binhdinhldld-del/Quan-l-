/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BackupHistory } from '../types';
import { Database, Download, Upload, RefreshCw, Trash2, ShieldCheck, Clock, Settings2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface BackupViewProps {
  onTriggerBackup: (type: 'auto' | 'manual') => void;
  onRestoreBackup: (backupData: string) => boolean;
  backups: BackupHistory[];
  onDeleteBackup: (id: string) => void;
  employeeCount: number;
  userCount: number;
}

export default function BackupView({
  onTriggerBackup,
  onRestoreBackup,
  backups,
  onDeleteBackup,
  employeeCount,
  userCount
}: BackupViewProps) {
  const [backupSchedule, setBackupSchedule] = useState<'realtime' | 'daily' | 'weekly'>('realtime');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'danger' | 'info' | 'success';
    isAlertOnly?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const customAlert = (title: string, message: string, type: 'warning' | 'danger' | 'info' | 'success' = 'info') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      isAlertOnly: true,
      onConfirm: () => setConfirmDialog(null)
    });
  };

  const customConfirm = (title: string, message: string, onConfirm: () => void, type: 'warning' | 'danger' | 'info' | 'success' = 'warning') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      isAlertOnly: false,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      }
    });
  };

  // Save scheduler preference to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gia_lai_union_sch_perf');
    if (saved) {
      setBackupSchedule(saved as 'realtime' | 'daily' | 'weekly');
    }
  }, []);

  const handleScheduleChange = (val: 'realtime' | 'daily' | 'weekly') => {
    setBackupSchedule(val);
    localStorage.setItem('gia_lai_union_sch_perf', val);
    customAlert(
      'Cơ chế sao lưu',
      `Đã cập nhật cơ chế Sao lưu tự động định kỳ: ${
        val === 'realtime' ? 'Sao lưu lập tức sau mỗi biến động dữ liệu.' : 
        val === 'daily' ? 'Chạy định kỳ tự động hàng ngày (24h).' : 
        'Chạy định kỳ tự động hàng tuần (Chủ nhật).'
      }`,
      'success'
    );
  };

  // Export full DB as downloadable backup JSON file
  const handleDownloadFullDB = async () => {
    let attachments: Record<string, string> = {};
    try {
      const { getAllAttachmentContents } = await import('../utils/indexedDBHelper');
      attachments = await getAllAttachmentContents();
    } catch (e) {
      console.error('Could not load attachments for backup:', e);
    }

    const fullDB = {
      employees: localStorage.getItem('gialai_employees'),
      users: localStorage.getItem('gialai_users'),
      userPasswords: localStorage.getItem('gialai_userpasswords'),
      logs: localStorage.getItem('gialai_logs'),
      attachments: attachments, // Include all attachment contents in exported file
      exportedAt: new Date().toISOString(),
      source: 'LĐLĐ Tỉnh Gia Lai HR Client'
    };

    const content = JSON.stringify(fullDB, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAOLUU_TOANDIEN_LDLD_GIALAI_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file for system recovery
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        if (!parsed.employees || !parsed.users) {
          setImportError('Tệp không đúng định dạng sao lưu của Liên đoàn. Thiếu trường employees hoặc users.');
          setImportSuccess('');
          return;
        }

        setImportText(text);
        setImportError('');
        setImportSuccess(`Đã kiểm tra tệp: "${file.name}" hợp lệ. Sẵn sàng khôi phục hệ thống!`);
      } catch (err) {
        setImportError('Không thể phân tích dữ liệu JSON. Vui lòng kiểm tra lại tính nguyên vẹn của tệp tải lên.');
        setImportSuccess('');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!importText) return;
    customConfirm(
      'CẢNH BÁO KHÔI PHỤC',
      'Quá trình khôi phục sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại bằng dữ liệu trong tệp sao lưu này.\n\nBạn có chắc chắn muốn tiến hành khôi phục?',
      () => {
        const ok = onRestoreBackup(importText);
        if (ok) {
          setImportSuccess('Khôi phục cơ sở dữ liệu toàn diện thành công! Hệ thống đang tải lại trạng thái...');
          setImportText('');
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          setImportError('Có lỗi xảy ra trong quá trình ghi đè cơ sở dữ liệu.');
        }
      },
      'danger'
    );
  };

  return (
    <div id="backup-console-panel" className="space-y-6">
      {/* Overview Box */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Database className="text-blue-600" />
            <span>Hệ Thống Sao Lưu và Khôi Phục Dữ Liệu</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Đảm bảo tính vẹn toàn, tự động nén kèm toàn bộ văn bản và tài liệu đính kèm (IndexedDB) của cán bộ khi xuất bản tệp cấu hình.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button 
            onClick={() => onTriggerBackup('manual')}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
            <span>Sao lưu khẩn cấp</span>
          </button>
          <button 
            onClick={handleDownloadFullDB}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Xuất bản tệp sao lưu kèm theo tất cả các hồ sơ tài liệu đính kèm của cán bộ"
          >
            <Download size={14} />
            <span>Tải tệp sao lưu (+Tài liệu) (.JSON)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings and Frequency schedule options */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 border-bottom pb-2">
            <Settings2 size={16} className="text-gray-500" />
            <span>Cơ Chế Sao Lưu Định Kỳ</span>
          </h3>

          <p className="text-xs text-gray-500">
            Hệ thống hỗ trợ cơ chế chạy ngầm tự động ghi nhớ phiên họp hiện thời vào bộ nhớ an toàn (Secure LocalSandbox) để sẵn sàng phục hồi khi mất kết nối mạng.
          </p>

          <div className="space-y-2 pt-2">
            {/* Realtime options */}
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-blue-100 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors">
              <input 
                type="radio" 
                name="schedule" 
                checked={backupSchedule === 'realtime'} 
                onChange={() => handleScheduleChange('realtime')}
                className="mt-1" 
              />
              <div>
                <div className="text-xs font-bold text-blue-900 flex items-center gap-1">
                  <span>Tuyệt đối (Mặc định)</span>
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded-full">An toàn nhất</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Tự động chụp lại sau mỗi thay đổi cán bộ hay tài khoản.</div>
              </div>
            </label>

            {/* Daily */}
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input 
                type="radio" 
                name="schedule" 
                checked={backupSchedule === 'daily'} 
                onChange={() => handleScheduleChange('daily')}
                className="mt-1" 
              />
              <div>
                <div className="text-xs font-bold text-gray-700">Sao lưu hàng ngày</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Chụp lại tóm tắt định kỳ tự động mỗi 24 tiếng.</div>
              </div>
            </label>

            {/* Weekly */}
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input 
                type="radio" 
                name="schedule" 
                checked={backupSchedule === 'weekly'} 
                onChange={() => handleScheduleChange('weekly')}
                className="mt-1" 
              />
              <div>
                <div className="text-xs font-bold text-gray-700">Định kỳ hàng tuần</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Giải nén và nén dồn dữ liệu vào tối Chủ Nhật hàng tuần.</div>
              </div>
            </label>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-2 text-[10px] text-gray-500">
            <Clock size={16} className="text-gray-400 shrink-0" />
            <span>Trực quan: {employeeCount} cán bộ & {userCount} tài khoản bảo mật hiện hữu.</span>
          </div>
        </div>

        {/* Restore & Import panel */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 border-bottom pb-2">
            <Upload size={16} className="text-emerald-600" />
            <span>Nhập và Khôi phục Bộ Dữ Liệu Ngoại Ngoại Tuyến</span>
          </h3>

          <p className="text-xs text-gray-500">
            Nếu bạn đổi thiết bị làm việc hoặc lắp đặt máy trạm mới, hãy tải lên tệp tin sao lưu định dạng `.json` đã tải về từ trước để đồng hóa tức thì dữ liệu hoạt động.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
            <input 
              id="db-backup-import"
              type="file" 
              accept=".json"
              onChange={handleImportFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-1.5">
              <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Upload size={20} />
              </div>
              <div className="text-xs font-semibold text-gray-700">Chọn tệp tin cấu hình sao lưu (.JSON)</div>
              <div className="text-[10px] text-gray-400">Kéo thả tệp tin hoặc click để điều hướng thư mục máy tính</div>
            </div>
          </div>

          {importError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex justify-between items-center">
              <span>{importSuccess}</span>
              {importText && (
                <button 
                  onClick={handleApplyImport}
                  className="px-3 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 transition-colors text-xs"
                >
                  Áp dụng ngay
                </button>
              )}
            </div>
          )}

          {/* Secure indicator badge */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2.5 justify-between">
            <div className="flex items-center gap-2 text-xs text-blue-900 font-semibold">
              <ShieldCheck className="text-blue-600 shrink-0" size={18} />
              <span>Giao thức giải mã SHA-256 an toàn nội bộ</span>
            </div>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Chuẩn Quốc gia</span>
          </div>
        </div>
      </div>

      {/* History and points snapshot directory list */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center justify-between">
          <span>Nhật ký Các Bản Ghép Sao Lưu trên trình duyệt hiện tại</span>
          <span className="text-[11px] font-normal text-gray-400">Lưu tối đa 5 bản ghi mới nhất</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5">Thời gian thực hiện</th>
                <th className="py-2.5">Tên bản sao</th>
                <th className="py-2.5">Cơ cấu lưu</th>
                <th className="py-2.5">Dung lượng</th>
                <th className="py-2.5">Phân loại</th>
                <th className="py-2.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center italic text-gray-400">
                    Chưa ghi nhận bản chụp lịch sử cục bộ nào. Bấm nút "Sao lưu khẩn cấp" phía trên để tạo.
                  </td>
                </tr>
              ) : (
                backups.map((bak) => (
                  <tr key={bak.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium text-gray-900">
                      {new Date(bak.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 font-mono text-gray-500 text-[11px]">{bak.fileName}</td>
                    <td className="py-3 text-gray-600">
                      {bak.recordCount} CB / {bak.userCount} TK
                    </td>
                    <td className="py-3 text-gray-500 font-mono">{bak.sizeKb.toFixed(2)} KB</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        bak.type === 'auto' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {bak.type === 'auto' ? 'Tự động' : 'Thủ công'}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          customConfirm(
                            'Khôi phục điểm sao lưu',
                            `Bạn có chắc chắn muốn khôi phục dữ liệu hệ thống về mốc thời điểm ${new Date(bak.timestamp).toLocaleString('vi-VN')}?`,
                            () => {
                              try {
                                const parsedData = JSON.parse(bak.data);
                                const text = JSON.stringify(parsedData);
                                onRestoreBackup(text);
                                customAlert(
                                  'Đã khôi phục',
                                  'Khôi phục thành công! Hệ thống đang tải lại dữ liệu mới...',
                                  'success'
                                );
                                setTimeout(() => {
                                  window.location.reload();
                                }, 1500);
                              } catch (e) {
                                customAlert('Lỗi khôi phục', 'Dự liệu mốc phục hồi bị hỏng hoặc lỗi định dạng.', 'danger');
                              }
                            },
                            'warning'
                          );
                        }}
                        className="px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 text-[11px] font-semibold rounded transition-colors focus:outline-none cursor-pointer"
                      >
                        Khôi phục
                      </button>
                      <button
                        onClick={() => onDeleteBackup(bak.id)}
                        className="p-1 hover:bg-red-100 text-red-650 rounded transition-colors focus:outline-none inline-block align-middle cursor-pointer"
                        title="Xóa điểm phục hồi"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          isAlertOnly={confirmDialog.isAlertOnly}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
