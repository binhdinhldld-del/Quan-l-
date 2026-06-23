/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Employee, AttachmentFile } from '../types';
import { X, Upload, FileText, User, Calendar, Phone, Briefcase, Award, Trash2 } from 'lucide-react';
import { saveAttachmentContent, getAttachmentContent } from '../utils/indexedDBHelper';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Omit<Employee, 'id' | 'createdAt' | 'modifiedAt'> & { id?: string }) => void;
  employeeToEdit?: Employee | null;
}

export default function MemberModal({
  isOpen,
  onClose,
  onSave,
  employeeToEdit
}: MemberModalProps) {
  // Form fields state
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [position, setPosition] = useState('');
  const [unit, setUnit] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [customNotes, setCustomNotes] = useState('');
  const [workProgress, setWorkProgress] = useState<number>(80);
  const [status, setStatus] = useState<'active' | 'leave' | 'probation'>('active');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // Local validation warning
  const [warningMsg, setWarningMsg] = useState('');

  // Load editing values if provided
  useEffect(() => {
    if (employeeToEdit) {
      setFullName(employeeToEdit.fullName);
      setDob(employeeToEdit.dob);
      setPhoneNumber(employeeToEdit.phoneNumber);
      setPosition(employeeToEdit.position);
      setUnit(employeeToEdit.unit);
      setAvatar(employeeToEdit.avatar || '');
      setCustomNotes(employeeToEdit.customNotes || '');
      setWorkProgress(employeeToEdit.workProgress);
      setStatus(employeeToEdit.status);
      setAttachments(employeeToEdit.attachments || []);
    } else {
      // Clear form for adding
      setFullName('');
      setDob('');
      setPhoneNumber('');
      setPosition('');
      setUnit('');
      setAvatar('');
      setCustomNotes('');
      setWorkProgress(80);
      setStatus('active');
      setAttachments([]);
    }
    setWarningMsg('');
  }, [employeeToEdit, isOpen]);

  // Handle avatar image to base64
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước ảnh thẻ không được vượt quá 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle attachment files (PDF/Word doc) to base64 with IndexedDB storage
  const handleAttachmentAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: any) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Tệp "${file.name}" vượt quá kích thước tối đa 5MB.`);
        return;
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const docType = 
        fileExtension === 'pdf' ? 'pdf' : 
        (['doc', 'docx'].includes(fileExtension)) ? 'docx' : 'other';

      const reader = new FileReader();
      reader.onload = async () => {
        const fileContent = reader.result as string;
        const fileId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        
        try {
          await saveAttachmentContent(fileId, fileContent);
        } catch (dbErr) {
          console.error('Error saving attachment to IndexedDB:', dbErr);
        }

        const fileRecord: AttachmentFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: docType,
          content: 'indexeddb', // Store lightweight pointer
          uploadedAt: new Date().toISOString()
        };
        setAttachments(prev => [...prev, fileRecord]);
      };
      
      reader.readAsDataURL(file);
    });
  };

  const downloadAttachmentFile = async (att: AttachmentFile) => {
    let content = att.content;
    if (!content || content === 'indexeddb' || !content.startsWith('data:')) {
      try {
        const idbContent = await getAttachmentContent(att.id);
        if (idbContent) {
          content = idbContent;
        }
      } catch (err) {
        console.error('Error getting attachment from IndexedDB:', err);
      }
    }

    if (!content || content === 'indexeddb') {
      alert('Không tìm thấy nội dung tệp. Vui lòng tải lên lại hoặc liên hệ quản lý hệ thống.');
      return;
    }

    const link = document.createElement('a');
    link.href = content;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete attachment from temporary state
  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !dob || !phoneNumber.trim() || !position.trim() || !unit.trim()) {
      setWarningMsg('Họ tên, Ngày sinh, Số điện thoại, Chức vụ, và Đơn vị công tác là các trường bắt buộc.');
      return;
    }

    let formattedPhone = phoneNumber.trim();
    if (formattedPhone && !formattedPhone.startsWith('0') && /^\d+$/.test(formattedPhone)) {
      formattedPhone = '0' + formattedPhone;
    }

    onSave({
      id: employeeToEdit ? employeeToEdit.id : undefined,
      fullName: fullName.trim(),
      dob,
      phoneNumber: formattedPhone,
      position: position.trim(),
      unit: unit.trim(),
      avatar,
      customNotes: customNotes.trim(),
      workProgress: Number(workProgress),
      status,
      attachments
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div id="employee-record-dialog-backdrop" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-blue-700 p-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <User size={20} className="text-yellow-400" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              {employeeToEdit ? 'Chỉnh Sửa Lý Lịch Cán Bộ' : 'Thêm Cán Bộ Tuyển Dụng Mới'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-blue-800 rounded transition-colors text-white focus:outline-none focus:ring-1 focus:ring-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content scrolling */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {warningMsg && (
            <p className="p-2.5 bg-red-50 text-red-700 font-semibold rounded border border-red-200">
              ⚠️ {warningMsg}
            </p>
          )}

          {/* Form Top: Avatar & Name details */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Avatar display box */}
            <div className="flex flex-col items-center gap-2 shrink-0 mx-auto sm:mx-0">
              <div className="relative w-28 h-36 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex flex-col items-center justify-center text-center shadow-inner group">
                {avatar ? (
                  <img src={avatar} alt="Ảnh thẻ" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 p-2 space-y-1">
                    <User size={24} className="mx-auto" />
                    <span className="text-[9px] block">Khung ảnh thẻ 3x4</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity">
                  <Upload size={14} className="mr-1" /> Tải ảnh
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    className="hidden" 
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => setAvatar('')}
                className={`text-[9px] text-red-600 hover:underline ${!avatar ? 'invisible' : ''}`}
              >
                Gỡ ảnh thẻ
              </button>
            </div>

            {/* Core textual entries */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Họ và tên cán bộ *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-gray-400">
                    <User size={13} />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ví dụ: Phan Thanh Trình"
                    className="w-full pl-8 pr-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Ngày sinh (Năm-Tháng-Ngày) *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-gray-400">
                    <Calendar size={13} />
                  </span>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Số điện thoại liên lạc *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-gray-400">
                    <Phone size={13} />
                  </span>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="Ví dụ: 0914123456"
                    className="w-full pl-8 pr-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Chức vụ phụ trách *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-gray-400">
                    <Briefcase size={13} />
                  </span>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    placeholder="Nhập chức vụ (Ví dụ: Trưởng Ban)"
                    className="w-full pl-8 pr-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Ban ngành / Văn phòng công tác *</label>
              <input
                type="text"
                required
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="Ban Tổ chức LĐLĐ Tỉnh Gia Lai"
                className="w-full px-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Tình trạng làm việc</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'active' | 'leave' | 'probation')}
                className="w-full px-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="active">Đang tại chức</option>
                <option value="leave">Nghỉ phép / Ốm đau</option>
                <option value="probation">Tập sự thử việc</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Tiến trình chỉ tiêu hoàn thành ({workProgress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={workProgress}
                onChange={e => setWorkProgress(Number(e.target.value))}
                className="w-full h-8 cursor-pointer text-blue-600"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Ghi chú điều hành / Mô tả nhiệm vụ</label>
              <input
                type="text"
                value={customNotes}
                onChange={e => setCustomNotes(e.target.value)}
                placeholder="Ví dụ: Phụ trách mảng phong trào Đoàn cơ sở..."
                className="w-full px-2.5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Attachments Section (Đính kèm tệp văn bản PDF / WORD) as requested */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                <FileText size={14} className="text-blue-600" />
                <span>Hồ sơ văn bản, quyết định phân bổ đính kèm ({attachments.length})</span>
              </label>
              <label className="px-2 py-1 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 transition-colors text-[10px] font-bold hover:bg-yellow-100 cursor-pointer">
                📎 Bổ sung file tệp (PDF/Word)
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleAttachmentAdd}
                  className="hidden"
                />
              </label>
            </div>

            {/* List current attachments */}
            {attachments.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic bg-gray-50 p-2.5 rounded text-center">
                Chưa đính kèm tài liệu nào cho cán bộ này. Cho phép đính kèm tệp PDF hoặc tệp Word.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded text-[10px] hover:bg-blue-50/50 transition-colors">
                    <button
                      type="button"
                      onClick={() => downloadAttachmentFile(att)}
                      className="flex items-center gap-1.5 truncate text-left font-medium hover:text-blue-700 focus:outline-none max-w-[170px]"
                      title={`Nhấp để tải xuống ${att.name}`}
                    >
                      <span className="font-bold shrink-0 text-red-600 bg-red-50 px-1 py-0.2 rounded border border-red-100 text-[9px]">
                        {att.type.toUpperCase()}
                      </span>
                      <span className="truncate text-gray-700 font-semibold hover:underline cursor-pointer">{att.name}</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 font-mono text-[9px]">
                        {(att.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="text-red-500 hover:text-red-700 p-0.5 focus:outline-none"
                        title="Xóa tệp đính kèm này"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Save / Cancel operations */}
          <div className="border-t border-gray-150 pt-4 flex justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded text-gray-700 font-bold cursor-pointer transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded cursor-pointer transition-colors"
            >
              Ghi lưu hồ sơ
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
