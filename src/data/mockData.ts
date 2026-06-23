/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, UserAccount, ActivityLog } from '../types';

// Preconfigured user accounts
export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'u-1',
    username: 'admin',
    email: 'admin.ldgialai@congdoan.vn',
    fullName: 'Phan Thanh Trình',
    role: 'admin',
    isActive: true,
    department: 'Văn phòng LĐLĐ',
    phoneNumber: '0914123456',
    createdAt: '2026-01-10T08:30:00Z',
  },
  {
    id: 'u-2',
    username: 'canbo',
    email: 'canbo.ld@congdoan.vn',
    fullName: 'Phan Thanh Quyền',
    role: 'user',
    isActive: true,
    department: 'Ban Tổ chức - Kiểm tra',
    phoneNumber: '0985987654',
    createdAt: '2026-02-15T09:15:00Z',
  },
  {
    id: 'u-3',
    username: 'thuky',
    email: 'thuky.ld@congdoan.vn',
    fullName: 'Huỳnh Thị Kim Hoàng',
    role: 'user',
    isActive: true,
    department: 'Ban Tổ chức- Kiểm tra',
    phoneNumber: '0973654321',
    createdAt: '2026-03-20T14:45:00Z',
  }
];

// Initial preconfigured employees of Gia Lai Labor Federation
export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    fullName: 'Phan Thanh Trình',
    dob: '1974-05-12',
    phoneNumber: '0914123456',
    position: 'Chủ tịch LĐLĐ Tỉnh',
    unit: 'Văn phòng LĐLĐ Tỉnh Gia Lai',
    customNotes: 'Chỉ đạo toàn diện hoạt động của Liên đoàn Lao động tỉnh Gia Lai. Phụ trách công tác tổ chức cán bộ và tài chính.',
    workProgress: 95,
    status: 'active',
    attachments: [
      {
        id: 'att-1-1',
        name: 'Nghị quyết đại hội công đoàn nhiệm kỳ.pdf',
        size: 2450000,
        type: 'pdf',
        content: 'data:application/pdf;base64,JVBERi0xLjQKJ...', // simulated standard placeholder
        uploadedAt: '2026-05-01T10:00:00Z'
      }
    ],
    createdAt: '2025-12-01T08:00:00Z',
    modifiedAt: '2026-06-20T10:30:00Z'
  },
  {
    id: 'emp-2',
    fullName: 'Nguyễn Xuân Thái',
    dob: '1979-11-20',
    phoneNumber: '0913554879',
    position: 'Phó Chủ tịch Thường trực',
    unit: 'Văn phòng LĐLĐ Tỉnh Gia Lai',
    customNotes: 'Phụ trách công tác chính sách pháp luật, quan hệ lao động, và phát triển đoàn viên. Giám sát thi đua khen thưởng.',
    workProgress: 88,
    status: 'active',
    attachments: [
      {
        id: 'att-2-1',
        name: 'Kế hoạch thi đua 6 tháng đầu năm.docx',
        size: 1048000,
        type: 'docx',
        content: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,...',
        uploadedAt: '2026-05-15T15:20:00Z'
      }
    ],
    createdAt: '2025-12-01T08:15:00Z',
    modifiedAt: '2026-06-18T16:40:00Z'
  },
  {
    id: 'emp-3',
    fullName: 'Trần Bích Ngọc',
    dob: '1983-08-14',
    phoneNumber: '0905432876',
    position: 'Trưởng Ban Tổ chức - Kiểm tra',
    unit: 'Ban Tổ chức - Kiểm tra LĐLĐ Tỉnh',
    customNotes: 'Quản lý hồ sơ cán bộ công đoàn toàn tỉnh, thực hiện kiểm tra giám sát tài chính và điều lệ công đoàn.',
    workProgress: 90,
    status: 'active',
    attachments: [],
    createdAt: '2025-12-05T09:00:00Z',
    modifiedAt: '2026-06-22T08:10:00Z'
  },
  {
    id: 'emp-4',
    fullName: 'Phan Thanh Quyền',
    dob: '1988-02-05',
    phoneNumber: '0985987654',
    position: 'Phó Trưởng Ban Tổ chức - Kiểm tra',
    unit: 'Ban Tổ chức - Kiểm tra LĐLĐ Tỉnh',
    customNotes: 'Phối hợp quản lý dữ liệu đoàn viên, thẩm định hồ sơ thi đua khen thưởng của các cấp Công đoàn.',
    workProgress: 85,
    status: 'active',
    attachments: [
      {
        id: 'att-4-1',
        name: 'Báo cáo thống kê số lượng đoàn viên Q2.pdf',
        size: 1540000,
        type: 'pdf',
        content: '',
        uploadedAt: '2026-06-10T14:30:00Z'
      }
    ],
    createdAt: '2026-02-15T09:20:00Z',
    modifiedAt: '2026-06-21T11:15:00Z'
  },
  {
    id: 'emp-5',
    fullName: 'Phạm Hồng Khôi',
    dob: '1981-10-25',
    phoneNumber: '0914998877',
    position: 'Trưởng Ban Tuyên giáo - Nữ công',
    unit: 'Ban Tuyên giáo - Nữ công LĐLĐ Tỉnh',
    customNotes: 'Chỉ đạo công tác tuyên truyền chủ trương đường lối của Đảng, tổ chức các phong trào nữ công nhân viên chức lao động.',
    workProgress: 92,
    status: 'active',
    attachments: [],
    createdAt: '2025-12-05T10:10:00Z',
    modifiedAt: '2026-06-15T09:30:00Z'
  },
  {
    id: 'emp-6',
    fullName: 'Bùi Thị Thanh Tâm',
    dob: '1992-06-18',
    phoneNumber: '0976112233',
    position: 'Chuyên viên Tuyên giáo',
    unit: 'Ban Tuyên giáo - Nữ công LĐLĐ Tỉnh',
    customNotes: 'Phụ trách truyền thông trên Trang thông tin điện tử LĐLĐ tỉnh Gia Lai, tổ chức các hội diễn văn nghệ công đoàn.',
    workProgress: 80,
    status: 'active',
    attachments: [],
    createdAt: '2026-01-05T11:00:00Z',
    modifiedAt: '2026-06-22T14:00:00Z'
  },
  {
    id: 'emp-7',
    fullName: 'Đoàn Minh Quang',
    dob: '1985-03-30',
    phoneNumber: '0905123789',
    position: 'Chủ tịch LĐLĐ TP. Pleiku',
    unit: 'LĐLĐ Thành phố Pleiku, Gia Lai',
    customNotes: 'Chỉ đạo hoạt động công đoàn khối trường học, doanh nghiệp tư nhân trên phạm vi TP. Pleiku.',
    workProgress: 75,
    status: 'active',
    attachments: [
      {
        id: 'att-7-1',
        name: 'Kế hoạch phát triển 500 đoàn viên mới.pdf',
        size: 1980000,
        type: 'pdf',
        content: '',
        uploadedAt: '2026-05-25T08:30:00Z'
      }
    ],
    createdAt: '2025-12-10T14:00:00Z',
    modifiedAt: '2026-06-12T15:20:00Z'
  },
  {
    id: 'emp-8',
    fullName: 'Vũ Thị Ngọc Hà',
    dob: '1995-09-12',
    phoneNumber: '0988654123',
    position: 'Chuyên viên Văn phòng',
    unit: 'Văn phòng LĐLĐ Tỉnh Gia Lai',
    customNotes: 'Phụ trách công tác văn thư, lưu trữ dữ liệu, chuẩn bị hậu cần cho các cuộc họp Thường trực.',
    workProgress: 94,
    status: 'active',
    attachments: [],
    createdAt: '2026-03-01T08:00:00Z',
    modifiedAt: '2026-06-19T17:10:00Z'
  },
  {
    id: 'emp-9',
    fullName: 'Phùng Lê Huy',
    dob: '1989-12-05',
    phoneNumber: '0912111222',
    position: 'Cán bộ Công đoàn chuyên trách',
    unit: 'Công đoàn các Khu công nghiệp tỉnh Gia Lai',
    customNotes: 'Bám sát và hỗ trợ người lao động tại KCN Trà Đa, can thiệp giải quyết các vụ tranh chấp lao động tập thể.',
    workProgress: 60,
    status: 'probation',
    attachments: [],
    createdAt: '2026-04-15T14:30:00Z',
    modifiedAt: '2026-06-20T11:00:00Z'
  }
];

// Initial mock security activity logs
export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-06-22T08:00:00Z',
    username: 'admin',
    userFullName: 'Phan Thanh Trình',
    role: 'admin',
    action: 'LOGIN',
    target: 'Hệ thống',
    details: 'Đăng nhập thành công từ địa chỉ IP: 113.161.44.11',
  },
  {
    id: 'log-2',
    timestamp: '2026-06-22T08:15:00Z',
    username: 'admin',
    userFullName: 'Phan Thanh Trình',
    role: 'admin',
    action: 'UPDATE_EMPLOYEE',
    target: 'Trần Bích Ngọc',
    details: 'Cập nhật ghi chú và tiến độ công việc của Trưởng ban Tổ chức',
  },
  {
    id: 'log-3',
    timestamp: '2026-06-22T09:30:00Z',
    username: 'canbo',
    userFullName: 'Phan Thanh Quyền',
    role: 'user',
    action: 'LOGIN',
    target: 'Hệ thống',
    details: 'Cán bộ tác nghiệp đăng nhập thành công từ thiết bị di động',
  },
  {
    id: 'log-4',
    timestamp: '2026-06-22T10:45:00Z',
    username: 'canbo',
    userFullName: 'Phan Thanh Quyền',
    role: 'user',
    action: 'UPDATE_EMPLOYEE',
    target: 'Nguyễn Xuân Thái',
    details: 'Xem chi tiết thông tin và tài liệu đính kèm của Phó Chủ tịch',
  }
];
