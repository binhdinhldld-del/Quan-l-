/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'user';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  department?: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: number; // in bytes
  type: string; // 'pdf' | 'doc' | 'docx' | 'other'
  content: string; // base64 content or simulated URL
  uploadedAt: string;
}

export interface Employee {
  id: string;
  fullName: string;
  dob: string; // YYYY-MM-DD
  phoneNumber: string;
  position: string; // Chức vụ
  unit: string; // Đơn vị công tác / Ban ngành
  avatar?: string; // Base64 or URL
  customNotes?: string; // Ghi chú tùy chỉnh
  attachments: AttachmentFile[];
  createdAt: string;
  modifiedAt: string;
  workProgress: number; // Tiến độ công việc (0 - 100)
  status: 'active' | 'leave' | 'probation'; // Trạng thái làm việc
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  username: string;
  userFullName: string;
  role: UserRole;
  action: string; // 'LOGIN' | 'CREATE_USER' | 'RESET_PASSWORD' | 'CREATE_EMPLOYEE' | 'UPDATE_EMPLOYEE' | 'DELETE_EMPLOYEE' | 'BACKUP' | 'RESTORE'
  target: string; // Đối tượng bị tác động (e.g. Tên nhân viên hoặc username)
  details: string; // Chi tiết hoạt động
  ipAddress?: string;
}

export interface BackupHistory {
  id: string;
  timestamp: string;
  fileName: string;
  recordCount: number;
  userCount: number;
  sizeKb: number;
  type: 'auto' | 'manual';
  data: string; // JSON string of all data for recovery
}
