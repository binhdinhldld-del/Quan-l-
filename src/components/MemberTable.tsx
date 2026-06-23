/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Employee, UserAccount, AttachmentFile } from '../types';
import { exportEmployeesToCSV, printEmployeeReport } from '../utils/fileExporter';
import { Search, Plus, Filter, FileSpreadsheet, Eye, Trash2, Edit3, Phone, Calendar, Paperclip, ChevronRight, Briefcase, UploadCloud, AlertCircle, X, CheckCircle2, Download } from 'lucide-react';
import { getAttachmentContent } from '../utils/indexedDBHelper';

// Automatically calculate the age based on DOB
const calculateAge = (dobString: string): number => {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Parse input string to YYYY-MM-DD
const parseDateInput = (val: string): string => {
  const vStr = (val || '').trim();
  if (!vStr) return '1990-01-01';
  // Match DD/MM/YYYY
  const dmy = vStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }
  // Match YYYY-MM-DD
  const ymd = vStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  try {
    const d = new Date(vStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {}
  return '1990-01-01';
};

interface MemberTableProps {
  currentUser: UserAccount;
  employees: Employee[];
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onOpenAddModal: () => void;
  onImportEmployees?: (newEmps: Omit<Employee, 'id' | 'createdAt' | 'modifiedAt' | 'attachments'>[]) => void;
}

export default function MemberTable({
  currentUser,
  employees,
  onEditEmployee,
  onDeleteEmployee,
  onOpenAddModal,
  onImportEmployees
}: MemberTableProps) {
  // Filters state
  const [searchName, setSearchName] = useState('');
  const [searchPosition, setSearchPosition] = useState('');
  const [searchUnit, setSearchUnit] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);

  const uniqueUnits = useMemo(() => {
    const list = employees.map(e => e.unit ? e.unit.trim() : '').filter(Boolean);
    return Array.from(new Set(list));
  }, [employees]);

  const uniquePositions = useMemo(() => {
    const list = employees.map(e => e.position ? e.position.trim() : '').filter(Boolean);
    return Array.from(new Set(list));
  }, [employees]);

  // Mobile layout vs Desktop table toggle
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [parsedEmployees, setParsedEmployees] = useState<{
    fullName: string;
    dob: string;
    phoneNumber: string;
    position: string;
    unit: string;
    workProgress: number;
    status: 'active' | 'leave' | 'probation';
    customNotes: string;
    isValid: boolean;
    errors: string[];
  }[]>([]);
  const [importError, setImportError] = useState('');

  const downloadImportTemplate = () => {
    const htmlTemplate = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Bieumau</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    table {
      border-collapse: collapse;
    }
    th, td {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      border: 0.5pt solid #b0b0b0;
      padding: 6px 10px;
    }
    th {
      background-color: #0c4a6e;
      color: #ffffff;
      font-weight: bold;
      text-align: center;
      padding: 8px 10px;
    }
    .text-column {
      mso-number-format: "\\@"; /* treat as text layout in Microsoft Excel to preserve 0 prefix */
      text-align: left;
    }
    .center-column {
      text-align: center;
    }
    .number-column {
      text-align: right;
    }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th>Họ và Tên</th>
        <th>Ngày Sinh (YYYY-MM-DD)</th>
        <th>Số Điện Thoại</th>
        <th>Chức Vụ</th>
        <th>Đơn Vị Công Tác</th>
        <th>Tiến Độ (%) (0-100)</th>
        <th>Trạng Thái (hoatdong/tamnghi/thuviec)</th>
        <th>Ghi Chú</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Nguyễn Văn An</td>
        <td class="center-column">1985-05-15</td>
        <td class="text-column">0912345678</td>
        <td>Chuyên viên Công đoàn</td>
        <td>Văn phòng LĐLĐ Tỉnh Gia Lai</td>
        <td class="number-column">85</td>
        <td>hoatdong</td>
        <td>Đoàn viên tích cực</td>
      </tr>
      <tr>
        <td>Trần Thị Bình</td>
        <td class="center-column">1990-11-20</td>
        <td class="text-column">0987654321</td>
        <td>Phó Trưởng Ban</td>
        <td>Ban Tổ chức - Kiểm tra</td>
        <td class="number-column">70</td>
        <td>tamnghi</td>
        <td>Nghỉ thai sản phép năm</td>
      </tr>
      <tr>
        <td>Phạm Văn Cường</td>
        <td class="center-column">1995-03-30</td>
        <td class="text-column">0905112233</td>
        <td>Cán bộ Cơ sở</td>
        <td>Ban Chính sách pháp luật</td>
        <td class="number-column">0</td>
        <td>thuviec</td>
        <td>Cơ sở hợp đồng tập sự</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
    `.trim();

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), htmlTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'mau_nhap_lieu_can_bo.xls');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    let startIdx = 0;
    if (text.charCodeAt(0) === 0xFEFF) {
      startIdx = 1;
    }

    for (let i = startIdx; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue);
        currentValue = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentValue);
        result.push(row);
        row = [];
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    if (row.length > 0 || currentValue !== '') {
      row.push(currentValue);
      result.push(row);
    }
    
    const cleaned = result.filter(r => r.length > 0 && r.some(cell => cell.trim() !== ''));
    // If the CSV contains sep=, directive on the first line, strip it
    if (cleaned.length > 0 && cleaned[0][0] && cleaned[0][0].toLowerCase().startsWith('sep=')) {
      return cleaned.slice(1);
    }
    return cleaned;
  };

  const parseFileContent = (text: string): string[][] => {
    const trimmed = text.trim();
    if (trimmed.includes('<html') || trimmed.includes('<table')) {
      try {
        const domParser = new DOMParser();
        const doc = domParser.parseFromString(trimmed, 'text/html');
        const rElements = Array.from(doc.querySelectorAll('tr'));
        if (rElements.length > 0) {
          const tableData = rElements.map(tr => 
            Array.from(tr.querySelectorAll('td, th')).map(cell => cell.textContent?.trim() || '')
          ).filter(r => r.length > 0 && r.some(cell => cell.trim() !== ''));
          
          if (tableData.length > 0) {
            return tableData;
          }
        }
      } catch (e) {
        console.error('Error parsing styled HTML spreadsheet, falling back to CSV parser', e);
      }
    }
    return parseCSV(text);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setImportError('Không thể đọc nội dung tệp tin.');
        return;
      }

      try {
        const rawRows = parseFileContent(text);
        if (rawRows.length <= 1) {
          setImportError('Tệp rỗng hoặc không đúng định dạng. Cần có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu.');
          return;
        }

        const dataRows = rawRows.slice(1);
        const list = dataRows.map((row) => {
          const fullName = (row[0] || '').trim();
          const rawDob = (row[1] || '').trim();
          const phoneNumber = (row[2] || '').trim();
          const position = (row[3] || '').trim();
          const unit = (row[4] || '').trim();
          const rawProgress = (row[5] || '').trim();
          const rawStatus = (row[6] || '').trim().toLowerCase();
          const customNotes = (row[7] || '').trim();

          const errors: string[] = [];

          if (!fullName) {
            errors.push('Thiếu Họ và Tên cán bộ (bắt buộc)');
          }

          const dob = parseDateInput(rawDob);
          
          let formattedPhone = phoneNumber;
          if (formattedPhone && !formattedPhone.startsWith('0') && /^\d+$/.test(formattedPhone)) {
            formattedPhone = '0' + formattedPhone;
          }

          let progress = 50;
          if (rawProgress) {
            const parsed = parseInt(rawProgress, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
              progress = parsed;
            } else {
              errors.push('Tiến độ công việc phải nằm trong khoảng 0 đến 100%');
            }
          }

          let status: 'active' | 'leave' | 'probation' = 'active';
          if (rawStatus) {
            if (rawStatus === 'hoatdong' || rawStatus === 'active' || rawStatus.includes('hoạt động') || rawStatus.includes('hoat')) {
              status = 'active';
            } else if (rawStatus === 'tamnghi' || rawStatus === 'leave' || rawStatus.includes('nghỉ') || rawStatus.includes('tạm nghỉ') || rawStatus.includes('tam')) {
              status = 'leave';
            } else if (rawStatus === 'thuviec' || rawStatus === 'probation' || rawStatus.includes('thử việc') || rawStatus.includes('tập sự') || rawStatus.includes('thu')) {
              status = 'probation';
            } else {
              errors.push(`Trạng thái không hợp lệ: "${rawStatus}"`);
            }
          }

          return {
            fullName,
            dob,
            phoneNumber: formattedPhone,
            position: position || 'Cán bộ',
            unit: unit || 'Văn phòng LĐLĐ Tỉnh Gia Lai',
            workProgress: progress,
            status,
            customNotes,
            isValid: !(!fullName),
            errors
          };
        });

        setParsedEmployees(list);
        setImportError('');
      } catch (err) {
        setImportError('Lỗi định dạng tệp CSV không hợp lệ hoặc bị mã hóa sai.');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmImport = () => {
    const validRows = parsedEmployees.filter(p => p.isValid);
    if (validRows.length === 0) {
      setImportError('Không có cán bộ hợp lệ nào để nhập khẩu.');
      return;
    }

    if (onImportEmployees) {
      onImportEmployees(validRows.map(row => ({
        fullName: row.fullName,
        dob: row.dob,
        phoneNumber: row.phoneNumber,
        position: row.position,
        unit: row.unit,
        workProgress: row.workProgress,
        status: row.status,
        customNotes: row.customNotes
      })));
    }

    // Reset and close
    setParsedEmployees([]);
    setImportError('');
    setShowImportModal(false);
  };

  // Dynamic Filtering based on inputs
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchName = emp.fullName.toLowerCase().includes(searchName.trim().toLowerCase());
      const matchPosition = emp.position.toLowerCase().includes(searchPosition.trim().toLowerCase());
      const matchUnit = emp.unit.toLowerCase().includes(searchUnit.trim().toLowerCase());
      const matchStatus = statusFilter === 'ALL' || emp.status === statusFilter;

      return matchName && matchPosition && matchUnit && matchStatus;
    });
  }, [employees, searchName, searchPosition, searchUnit, statusFilter]);

  // Export individual Excel (CSV)
  const handleExportIndividual = (emp: Employee) => {
    exportEmployeesToCSV([emp]);
  };

  const handleDownloadAttachment = async (att: AttachmentFile) => {
    let content = att.content;
    if (!content || content === 'indexeddb' || !content.startsWith('data:')) {
      try {
        const idbContent = await getAttachmentContent(att.id);
        if (idbContent) {
          content = idbContent;
        }
      } catch (err) {
        console.error('Error fetching attachment from IndexedDB:', err);
      }
    }

    if (!content || content === 'indexeddb') {
      alert('Không tìm thấy nội dung tệp. Vui lòng bấm tải lên lại tệp mới.');
      return;
    }

    const link = document.createElement('a');
    link.href = content;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="member-director-panel" className="space-y-4">
      
      {/* Search Header Options Box */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900">Sổ Tay Cơ Sở Dữ Liệu Nhân Sự</h2>
            <p className="text-xs text-gray-400">Tìm kiếm cán bộ mẫn cán, lọc ban ngành và xuất hồ sơ báo cáo nhanh</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportEmployeesToCSV(filteredEmployees)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Xuất bảng chọn lọc sang Excel"
            >
              <FileSpreadsheet size={15} />
              <span>Xuất Excel Bảng Lọc</span>
            </button>
            <button
              onClick={() => {
                setParsedEmployees([]);
                setImportError('');
                setShowImportModal(true);
              }}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Nhập cán bộ số lượng lớn từ file mẫu CSV"
            >
              <UploadCloud size={15} />
              <span>Nhập Lớn (CSV)</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Bổ sung Cán bộ mới</span>
            </button>
          </div>
        </div>

        {/* 3 Columns detailed search fields (Họ tên, Chức vụ, Đơn vị tác nghiệp) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          
          {/* Query 1: Fullname */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              placeholder="1. Tìm theo Họ và Tên..."
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          {/* Query 2: Position */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Briefcase size={14} />
            </span>
            <input
              type="text"
              value={searchPosition}
              onChange={e => setSearchPosition(e.target.value)}
              placeholder="2. Tìm theo Chức vụ..."
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent text-xs"
            />
            <button
              type="button"
              onClick={() => setShowPositionDropdown(!showPositionDropdown)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer select-none"
              title="Nhấp để chọn nhanh chức vụ hiện có"
            >
              Chọn
            </button>

            {showPositionDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowPositionDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 shadow-xl rounded-lg z-40 overflow-hidden text-xs max-h-56 overflow-y-auto">
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center">
                    <span>Chọn Chức vụ</span>
                    {searchPosition && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchPosition('');
                          setShowPositionDropdown(false);
                        }}
                        className="text-[10px] text-red-600 hover:underline cursor-pointer font-bold"
                      >
                        Xoá lọc
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {uniquePositions.length === 0 ? (
                      <div className="p-3 text-gray-400 italic text-center">Chưa có chức vụ nào</div>
                    ) : (
                      uniquePositions.map(pos => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => {
                            setSearchPosition(pos);
                            setShowPositionDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 hover:bg-blue-50/70 transition-colors flex items-center justify-between cursor-pointer ${
                            searchPosition.toLowerCase() === pos.toLowerCase()
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-gray-700'
                          }`}
                        >
                          <span className="truncate">{pos}</span>
                          {searchPosition.toLowerCase() === pos.toLowerCase() && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Query 3: Unit / Department */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
              <Filter size={14} />
            </span>
            <input
              type="text"
              value={searchUnit}
              onChange={e => setSearchUnit(e.target.value)}
              placeholder="3. Tìm theo Đơn vị công tác..."
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent text-xs"
            />
            <button
              type="button"
              onClick={() => setShowUnitDropdown(!showUnitDropdown)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer select-none"
              title="Nhấp để chọn nhanh đơn vị công tác hiện có"
            >
              Chọn
            </button>

            {showUnitDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowUnitDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 shadow-xl rounded-lg z-40 overflow-hidden text-xs max-h-56 overflow-y-auto">
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center">
                    <span>Chọn Đơn vị công tác</span>
                    {searchUnit && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchUnit('');
                          setShowUnitDropdown(false);
                        }}
                        className="text-[10px] text-red-600 hover:underline cursor-pointer font-bold"
                      >
                        Xoá lọc
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100">
                    {uniqueUnits.length === 0 ? (
                      <div className="p-3 text-gray-400 italic text-center">Chưa có đơn vị nào</div>
                    ) : (
                      uniqueUnits.map(unit => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => {
                            setSearchUnit(unit);
                            setShowUnitDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 hover:bg-blue-50/70 transition-colors flex items-center justify-between cursor-pointer ${
                            searchUnit.toLowerCase() === unit.toLowerCase()
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-gray-700'
                          }`}
                        >
                          <span className="truncate">{unit}</span>
                          {searchUnit.toLowerCase() === unit.toLowerCase() && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Status filter dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300 bg-white rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="ALL">Mọi trạng thái cán bộ</option>
              <option value="active">Đang tại chức hoàn thành tốt</option>
              <option value="leave">Nghỉ phép / Nghỉ điều trị</option>
              <option value="probation">Đang thử việc học hỏi</option>
            </select>
          </div>
        </div>

        {/* View mode indicators */}
        <div className="flex justify-between items-center pt-1 border-t border-gray-100 text-[11px] text-gray-500">
          <div>
            Tìm thấy <strong className="text-gray-900">{filteredEmployees.length}</strong> cán bộ trong tổng số {employees.length} hồ sơ.
          </div>
          <div className="flex items-center gap-1.5">
            <span>Chế độ xem:</span>
            <button 
              onClick={() => setViewMode('table')}
              className={`px-2 py-0.5 rounded font-semibold ${viewMode === 'table' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
            >
              Bảng mẫu
            </button>
            <button 
              onClick={() => setViewMode('cards')}
              className={`px-2 py-0.5 rounded font-semibold ${viewMode === 'cards' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
            >
              Hồ sơ ô vuông (Mobile)
            </button>
          </div>
        </div>
      </div>

      {/* Main Employee Presentation Container */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="text-gray-400 text-lg">⚠️ Không tìm thấy kết quả nào</div>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Vui lòng thay đổi khóa từ tìm kiếm Họ tên, Chức vụ hay Đơn vị công tác dể hệ thống truy vấn hồ sơ chính xác hơn.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* 1. Large Screen Spreadsheet Style view */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Hình thẻ</th>
                  <th className="py-3 px-4">Họ và Tên cán bộ</th>
                  <th className="py-3 px-4">Ngày sinh</th>
                  <th className="py-3 px-4">Thông tin liên lạc</th>
                  <th className="py-3 px-4">Chức danh / Đơn vị</th>
                  <th className="py-3 px-4">Hồ sơ công tác</th>
                  <th className="py-3 px-4 text-center">Tiến độ KPI</th>
                  <th className="py-3 px-4 text-right">Trạng thái / Tải xuống và Sửa</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    
                    {/* Avatar Column */}
                    <td className="py-2.5 px-4">
                      {emp.avatar ? (
                        <img 
                          src={emp.avatar} 
                          alt={emp.fullName} 
                          className="w-10 h-12 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-12 bg-blue-50 text-blue-700 rounded border border-gray-200 flex flex-col items-center justify-center text-[10px] font-black">
                          {emp.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-4 font-black text-gray-900 group">
                      <div className="text-gray-900 font-bold">{emp.fullName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">MSCB: {emp.id}</div>
                    </td>

                    {/* DOB */}
                    <td className="py-2.5 px-4 font-semibold text-gray-600 whitespace-nowrap">
                      <div>{new Date(emp.dob).toLocaleDateString('vi-VN')}</div>
                      <div className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                        {calculateAge(emp.dob)} tuổi (Năm 2026)
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-2.5 px-4 text-gray-600">
                      <div className="flex items-center gap-1 font-semibold">
                        <Phone size={12} className="text-gray-400" />
                        <span>{emp.phoneNumber}</span>
                      </div>
                    </td>

                    {/* Position / Unit */}
                    <td className="py-2.5 px-4 text-gray-600 space-y-0.5">
                      <div className="font-bold text-gray-900 text-[12px]">{emp.position}</div>
                      <div className="text-blue-700 font-semibold">{emp.unit}</div>
                    </td>

                    {/* custom Notes & Attachments metadata info */}
                    <td className="py-2.5 px-4 max-w-[200px]">
                      <div className="text-gray-500 line-clamp-1 italic text-[11px] mb-1">
                        {emp.customNotes || 'Không có ghi chú.'}
                      </div>
                      
                      {/* Attachments listing */}
                      {emp.attachments?.length > 0 ? (
                        <div className="flex flex-col gap-1 mt-1 max-h-16 overflow-y-auto">
                          {emp.attachments.map(att => (
                            <button
                              key={att.id}
                              onClick={() => handleDownloadAttachment(att)}
                              className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer text-left w-full truncate"
                              title={`Nhấp để tải xuống tệp: ${att.name}`}
                            >
                              <Paperclip size={10} className="shrink-0" />
                              <span className="truncate">{att.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">Không đính kèm văn bản</span>
                      )}
                    </td>

                    {/* Work Progress indicator bar */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="inline-block w-20">
                        <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 mb-0.5">
                          <span>Tiến độ</span>
                          <span>{emp.workProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              emp.workProgress >= 90 ? 'bg-emerald-600' :
                              emp.workProgress >= 70 ? 'bg-blue-600' : 'bg-red-500'
                            }`}
                            style={{ width: `${emp.workProgress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status & Options individual triggers */}
                    <td className="py-2.5 px-4 text-right space-y-2">
                      <div className="flex justify-end gap-1.5 items-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          emp.status === 'leave' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {emp.status === 'active' ? 'Tại chức' : emp.status === 'leave' ? 'Nghỉ phép' : 'Thử việc'}
                        </span>
                      </div>

                      {/* PDF Report trigger & Excel trigger side by side */}
                      <div className="flex justify-end gap-1.5 pt-1">
                        {/* Print PDF report */}
                        <button
                          onClick={() => printEmployeeReport(emp)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-semibold text-[10px] transition-colors focus:outline-none"
                          title="In báo cáo lý lịch PDF"
                        >
                          📄 Báo cáo PDF
                        </button>
                        
                        {/* Excel individual export */}
                        <button
                          onClick={() => handleExportIndividual(emp)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] transition-colors focus:outline-none"
                          title="Tải riêng file Excel cho cán bộ này"
                        >
                          📥 Excel
                        </button>

                        <button
                          onClick={() => onEditEmployee(emp)}
                          className="p-1 hover:bg-gray-100 text-blue-600 rounded focus:outline-none inline-block align-middle"
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit3 size={13} />
                        </button>

                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => onDeleteEmployee(emp.id)}
                            className="p-1 hover:bg-red-50 text-red-600 rounded focus:outline-none inline-block align-middle"
                            title="Xóa cán bộ hoàn toàn"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* 2. Responsive Cards View layout (Also displayed on small devices by default) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${viewMode === 'table' ? 'md:hidden' : ''}`}>
        {filteredEmployees.map((emp) => (
          <div 
            key={emp.id} 
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3 relative overflow-hidden"
          >
            {/* Status light glow background */}
            <div className={`absolute top-0 right-0 w-2.5 h-full ${
              emp.status === 'active' ? 'bg-emerald-500' :
              emp.status === 'leave' ? 'bg-amber-500' : 'bg-red-500'
            }`} />

            <div className="flex gap-3">
              {/* Card Avatar */}
              <div className="shrink-0">
                {emp.avatar ? (
                  <img 
                    src={emp.avatar} 
                    alt={emp.fullName} 
                    className="w-16 h-20 object-cover rounded-lg border border-gray-100 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-20 bg-blue-50 text-blue-700 rounded-lg border border-gray-100 shadow-sm flex flex-col items-center justify-center text-xs font-black">
                    {emp.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* General names and designations */}
              <div className="space-y-1 select-text">
                <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">MSCB: {emp.id}</div>
                <h4 className="text-sm font-black text-gray-900 truncate max-w-[150px]">{emp.fullName}</h4>
                <div className="text-[11px] font-bold text-gray-700 truncate max-w-[160px]">{emp.position}</div>
                <div className="text-[10px] text-blue-700 font-semibold truncate max-w-[165px]">{emp.unit}</div>
              </div>
            </div>

            {/* Core facts in rows */}
            <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Sinh nhật:</span>
                <span className="font-semibold">
                  {new Date(emp.dob).toLocaleDateString('vi-VN')}
                  <span className="ml-1 text-[10px] font-bold text-blue-800 bg-blue-100/65 px-1 py-0.2 rounded-md">
                    {calculateAge(emp.dob)} tuổi
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Số Hotline:</span>
                <span className="font-semibold">{emp.phoneNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Tiến độ việc:</span>
                <span className="font-bold text-blue-700">{emp.workProgress}%</span>
              </div>
            </div>

            {/* File listing counts */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100 text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Văn bản hồ sơ:</span>
                <div className="flex gap-1">
                  {/* Print PDF report */}
                  <button
                    onClick={() => printEmployeeReport(emp)}
                    className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    📄 In PDF
                  </button>
                  {/* Excel export */}
                  <button
                    onClick={() => handleExportIndividual(emp)}
                    className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    📥 Excel
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {emp.attachments?.length > 0 ? (
                  emp.attachments.map(att => (
                    <button
                      key={att.id}
                      onClick={() => handleDownloadAttachment(att)}
                      className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 font-bold border border-yellow-200 px-1.5 py-0.5 rounded hover:bg-yellow-100 hover:text-yellow-900 transition-colors cursor-pointer max-w-[170px] truncate"
                      title={`Nhấp để tải xuống tệp: ${att.name}`}
                    >
                      📎 <span className="truncate">{att.name}</span>
                    </button>
                  ))
                ) : (
                  <span className="text-gray-400 italic">Không có văn bản đính kèm</span>
                )}
              </div>
            </div>

            {/* Editing triggers */}
            <div className="pt-2 border-t border-gray-100 flex justify-end gap-1.5">
              <button
                onClick={() => onEditEmployee(emp)}
                className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-semibold inline-flex items-center gap-1.5 transition-colors focus:outline-none"
              >
                <Edit3 size={12} />
                <span>Cập nhật</span>
              </button>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => onDeleteEmployee(emp.id)}
                  className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded font-semibold inline-flex items-center gap-1.5 transition-colors focus:outline-none"
                >
                  <Trash2 size={12} />
                  <span>Xóa hồ sơ</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
                  <UploadCloud size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-black text-slate-900">Nhập Danh Sách Cán Bộ Số Lượng Lớn</h3>
                  <p className="text-xs text-slate-500">Tải lên tệp CSV/Excel theo đúng biểu mẫu thiết kế nghiệp vụ</p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-700 text-xs text-left">
              
              {/* Stepper block / Instructions */}
              <div className="bg-blue-50/75 border border-blue-100 p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5 text-sm">
                  <AlertCircle size={15} />
                  <span>Hướng dẫn nhập thông tin hiệu chỉnh:</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-blue-800 leading-relaxed text-left">
                  <div>
                    <p className="font-semibold mb-1 text-left">1. Định dạng cột biểu mẫu:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-left">
                      <li><strong>Họ và Tên</strong>: Bắt buộc điền.</li>
                      <li><strong>Ngày Sinh</strong>: Định dạng <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">YYYY-MM-DD</code> hoặc <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">DD/MM/YYYY</code>.</li>
                      <li><strong>Số Điện Thoại</strong>: Số điện thoại liên lạc của cán bộ.</li>
                      <li><strong>Chức Vụ</strong>: Tên chức trách, chức danh công việc.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1 text-left">2. Mã hóa trạng thái:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-left">
                      <li><strong>Đơn Vị Công Tác</strong>: Phòng ban điều hành.</li>
                      <li><strong>Tiến Độ (%)</strong>: Tiến trình công việc (0 - 100).</li>
                      <li><strong>Trạng Thái</strong>: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">hoatdong</code> (Hoạt động), <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">tamnghi</code> (Tạm nghỉ), <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">thuviec</code> (Thử việc).</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2 flex justify-start">
                  <button
                    onClick={downloadImportTemplate}
                    className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                  >
                    <Download size={14} />
                    <span>Tải Tập Tin Mẫu (.XLS)</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Zone / Input File selectors */}
              <div className="space-y-2 text-left">
                <label className="block text-xs font-bold text-slate-700 text-left">Chọn tập dữ liệu của bạn từ thiết bị:</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 text-center transition-colors relative bg-slate-50 cursor-pointer">
                  <input
                    type="file"
                    accept=".csv, .xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-white rounded-full shadow-sm text-slate-400 border border-slate-100">
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Kéo thả tập tin .xls hoặc .csv vào đây hoặc nhấn để chọn file</p>
                      <p className="text-[10px] text-slate-400 mt-1">Đảm bảo lưu file định dạng Tiếng Việt tiêu chuẩn (Times New Roman)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Import Error box */}
              {importError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-start gap-2 text-left">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-left">Đã xảy ra sự cố phát hiện lỗi:</p>
                    <p className="text-[11px] mt-0.5 whitespace-pre-line text-left">{importError}</p>
                  </div>
                </div>
              )}

              {/* Display Parsed Preview Table */}
              {parsedEmployees.length > 0 && (
                <div className="space-y-2.5 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 text-left">
                      <CheckCircle2 className="text-emerald-600" size={16} />
                      <span>Kết quả phân tách dữ liệu sơ bộ ({parsedEmployees.length} dòng dữ liệu):</span>
                    </h4>
                    <span className="text-[10px] text-slate-550 italic">Hàng không hợp lệ (không có Họ & Tên) sẽ bị loại bỏ</span>
                  </div>

                  <div className="border border-slate-150 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider border-b border-slate-150">
                          <th className="py-2 px-3 font-semibold">Tên Cán Bộ</th>
                          <th className="py-2 px-3 font-semibold">Ngày Sinh</th>
                          <th className="py-1.5 px-3 font-semibold">SĐT</th>
                          <th className="py-2 px-3 font-semibold">Chức Vụ</th>
                          <th className="py-2 px-3 font-semibold">Đơn Vị Công Tác</th>
                          <th className="py-1.5 px-3 font-semibold">Tiến Độ</th>
                          <th className="py-2 px-3 font-semibold">Trạng Thái</th>
                          <th className="py-2 px-3 font-semibold">Hợp Lệ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white shadow-inner">
                        {parsedEmployees.map((row, index) => (
                          <tr 
                            key={index}
                            className={`hover:bg-slate-50/50 ${!row.isValid ? 'bg-rose-50/30' : ''}`}
                          >
                            <td className="py-1.5 px-3 font-bold text-slate-900 text-left">{row.fullName || <span className="text-rose-500 italic">(Mất họ tên)</span>}</td>
                            <td className="py-1.5 px-3 text-slate-500 font-mono text-left">{row.dob}</td>
                            <td className="py-1.5 px-3 text-slate-500 font-mono text-left">{row.phoneNumber || '-'}</td>
                            <td className="py-1.5 px-3 text-slate-600 font-medium text-left">{row.position}</td>
                            <td className="py-1.5 px-3 text-slate-600 text-left">{row.unit}</td>
                            <td className="py-1.5 px-3 font-semibold text-slate-700 text-left">{row.workProgress}%</td>
                            <td className="py-1.5 px-3 text-left">
                              {row.status === 'active' && <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full text-left">● Hoạt động</span>}
                              {row.status === 'leave' && <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full text-left">● Tạm nghỉ</span>}
                              {row.status === 'probation' && <span className="inline-flex items-center gap-1 font-semibold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-full text-left">● Thử việc</span>}
                            </td>
                            <td className="py-1.5 px-3 text-left">
                              {row.isValid ? (
                                <span className="text-emerald-600 font-bold text-left">✓ Sẵn sàng</span>
                              ) : (
                                <span className="text-rose-600 font-bold text-left" title={row.errors.join(', ')}>✗ Lỗi</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer actions */}
            <div className="p-5 border-t border-slate-150 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setParsedEmployees([]);
                  setImportError('');
                  setShowImportModal(false);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Đóng lại
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedEmployees.length === 0 || parsedEmployees.filter(p => p.isValid).length === 0}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Nhập {parsedEmployees.filter(p => p.isValid).length} Cán Bộ Vào Hệ Thống
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
