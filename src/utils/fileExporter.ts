/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, ActivityLog } from '../types';

/**
 * Utility to export employee data to beautiful styled Excel format with Times New Roman font and clean grid borders
 */
export function exportEmployeesToCSV(employees: Employee[]) {
  const headers = [
    'Họ và Tên',
    'Ngày Sinh',
    'Số Điện Thoại',
    'Chức Vụ',
    'Đơn Vị Công Tác',
    'Tiến Độ Công Việc (%)',
    'Trạng Thái',
    'Ghi Chú',
    'Số Tài Liêu Đính Kèm',
    'Ngày Tạo',
    'Cập Nhật Cuối'
  ];

  const rows = employees.map(emp => {
    const statusText = 
      emp.status === 'active' ? 'Đang hoạt động' : 
      emp.status === 'leave' ? 'Nghỉ phép/Tạm nghỉ' : 'Thử việc/Tập sự';
    
    return [
      emp.fullName,
      emp.dob,
      emp.phoneNumber, // Excel text format will preserve leading zeros
      emp.position,
      emp.unit,
      emp.workProgress,
      statusText,
      emp.customNotes || '',
      emp.attachments ? emp.attachments.length : 0,
      new Date(emp.createdAt).toLocaleDateString('vi-VN'),
      new Date(emp.modifiedAt).toLocaleDateString('vi-VN')
    ];
  });

  exportToXlsWithTimesNewRoman(headers, rows, 'danh_sach_nhan_su_cong_doan_gia_lai.xls');
}

/**
 * Common XLS template constructor using Times New Roman style sheet
 */
export function exportToXlsWithTimesNewRoman(headers: string[], rows: any[][], fileName: string) {
  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Sheet1</x:Name>
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
      font-size: 11pt;
      padding: 8px 10px;
    }
    .phone-cell {
      mso-number-format: "\\@"; /* Directs Excel to treat as text so leading zeros remain intact */
      text-align: left;
    }
    .center-cell {
      text-align: center;
    }
    .number-cell {
      text-align: right;
    }
    .active-status {
      color: #15803d;
      font-weight: bold;
    }
    .leave-status {
      color: #b91c1c;
      font-weight: bold;
    }
    .probation-status {
      color: #c2410c;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        ${headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows.map(row => `
        <tr>
          ${row.map((val, idx) => {
            const h = headers[idx];
            let cellClass = '';
            
            if (h === 'Số Điện Thoại') {
              cellClass = ' class="phone-cell"';
            } else if (h === 'Điện thoại' || h === 'SĐT') {
              cellClass = ' class="phone-cell"';
            } else if (h === 'Ngày Sinh' || h === 'Ngày Sinh (YYYY-MM-DD)' || h === 'Ngày Tạo' || h === 'Cập Nhật Cuối') {
              cellClass = ' class="center-cell"';
            } else if (h === 'Tiến Độ Công Việc (%)' || h === 'Tiến Độ (%) (0-100)' || h === 'Số Tài Liêu Đính Kèm') {
              cellClass = ' class="number-cell"';
            } else if (h === 'Trạng Thái' || h === 'Trạng Thái (hoatdong/tamnghi/thuviec)') {
              const lower = String(val).toLowerCase();
              if (lower.includes('hoạt động') || lower === 'active' || lower === 'hoatdong') {
                cellClass = ' class="active-status"';
              } else if (lower.includes('tạm nghỉ') || lower.includes('nghỉ phép') || lower === 'leave' || lower === 'tamnghi') {
                cellClass = ' class="leave-status"';
              } else if (lower.includes('thử việc') || lower === 'probation' || lower === 'thuviec') {
                cellClass = ' class="probation-status"';
              }
            }
            
            // Clean value and support line breaks
            const formattedVal = String(val === null || val === undefined ? '' : val)
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
              
            return `<td${cellClass}>${formattedVal}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `.trim();

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Utility to export activity logs to CSV
 */
export function exportLogsToCSV(logs: ActivityLog[]) {
  const headers = [
    'Thời Gian',
    'Tài Khoản',
    'Họ và Tên',
    'Quyền Truy Cập',
    'Hành Động',
    'Đối Tượng Tác Động',
    'Chi Tiết Hoạt Động'
  ];

  const rows = logs.map(log => [
    new Date(log.timestamp).toLocaleString('vi-VN'),
    log.username,
    log.userFullName,
    log.role === 'admin' ? 'Quản trị viên' : 'Người dùng',
    log.action,
    log.target,
    log.details
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(value => {
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(','))
  ].join('\n');

  downloadFile(csvContent, 'nhat_ky_hoat_dong_he_thong.csv', 'text/csv;charset=utf-8;');
}

/**
 * Initiates browser download of a file, injecting the UTF-8 BOM
 */
function downloadFile(content: string, fileName: string, mimeType: string) {
  // Add UTF-8 Byte Order Mark (BOM) to make it open nicely in Excel
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers a beautiful HTML printing sheet setup for an index card or staff profile report.
 * Prints the document styled nicely with trade union official letterheads.
 */
export function printEmployeeReport(employee: Employee) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép trình duyệt hiển thị cửa sổ bật lên để in báo cáo cán bộ.');
    return;
  }

  const statusText = 
    employee.status === 'active' ? 'Đang hoạt động' : 
    employee.status === 'leave' ? 'Nghỉ phép/Nghỉ tạm thời' : 'Đang thử việc';

  const avatarHtml = employee.avatar 
    ? `<img src="${employee.avatar}" style="width: 140px; height: 180px; object-fit: cover; border: 1px solid #ccc; display: block; margin-top: 10px;" />`
    : `<div style="width: 140px; height: 180px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; text-align: center; color: #666; font-size: 13px; background: #fdfdfd; margin-top: 10px;">Chưa cập nhật ảnh thẻ</div>`;

  const attachmentCount = employee.attachments ? employee.attachments.length : 0;
  const listAttachments = employee.attachments && employee.attachments.length > 0
    ? employee.attachments.map(att => `<li>${att.name} (${(att.size / 1024).toFixed(1)} KB) - tải lên ngày ${new Date(att.uploadedAt).toLocaleDateString('vi-VN')}</li>`).join('')
    : '<li>Chưa có tệp tài liệu đính kèm.</li>';

  printWindow.document.write(`
    <html>
      <head>
        <title>Báo cáo cán bộ - ${employee.fullName}</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif, sans-serif;
            color: #111;
            padding: 30px;
            line-height: 1.5;
            background: #fff;
          }
          .header-table {
            width: 100%;
            margin-bottom: 30px;
            border: none;
          }
          .header-left {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            width: 50%;
          }
          .header-right {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            width: 50%;
          }
          .title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-top: 40px;
            margin-bottom: 40px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .profile-container {
            display: flex;
            gap: 40px;
            margin-bottom: 30px;
          }
          .profile-avatar {
            flex: 0 0 160px;
          }
          .profile-details {
            flex: 1;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
          }
          .details-table td {
            padding: 8px 12px;
            vertical-align: top;
          }
          .details-table td.label {
            font-weight: bold;
            width: 180px;
            border-right: 1px dotted #ccc;
          }
          .details-table tr {
            border-bottom: 1px solid #eee;
          }
          .section-title {
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 2px solid #333;
            padding-bottom: 4px;
            margin-top: 30px;
            margin-bottom: 15px;
          }
          .notes-box {
            padding: 12px;
            border: 1px solid #ccc;
            background-color: #fafafa;
            font-style: italic;
            min-height: 80px;
            white-space: pre-wrap;
          }
          .footer-sign {
            margin-top: 80px;
            width: 100%;
          }
          .footer-sign td {
            text-align: center;
            width: 50%;
          }
          .date-location {
            font-style: italic;
            text-align: right;
            margin-top: 40px;
            font-size: 14px;
          }
          .no-print-btn {
            display: block;
            margin: 20px auto;
            padding: 10px 20px;
            background-color: #0056b3;
            color: #fff;
            border: none;
            cursor: pointer;
            font-size: 15px;
            border-radius: 4px;
          }
          @media print {
            .no-print-btn {
              display: none;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <button class="no-print-btn" onclick="window.print()">Bấm để In hoặc Xuất file PDF</button>

        <table class="header-table">
          <tr>
            <td class="header-left">
              LIÊN ĐOÀN LAO ĐỘNG TỈNH GIA LAI<br>
              <span style="font-weight: normal; text-decoration: underline;">VĂN PHÒNG</span>
            </td>
            <td class="header-right">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
              <span style="font-weight: bold; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</span>
            </td>
          </tr>
        </table>

        <div class="title">Báo Cáo Sơ Lược Thông Tin Cán Bộ</div>

        <div class="profile-container">
          <div class="profile-avatar">
            ${avatarHtml}
            <div style="font-size: 11px; text-align: center; margin-top: 6px; color: #555;">Ảnh chân dung cán bộ</div>
          </div>
          
          <div class="profile-details">
            <table class="details-table">
              <tr>
                <td class="label">Họ và tên cán bộ:</td>
                <td style="font-size: 17px; font-weight: bold;">${employee.fullName}</td>
              </tr>
              <tr>
                <td class="label">Ngày tháng năm sinh:</td>
                <td>${new Date(employee.dob).toLocaleDateString('vi-VN')}</td>
              </tr>
              <tr>
                <td class="label">Số điện thoại liên hệ:</td>
                <td>${employee.phoneNumber}</td>
              </tr>
              <tr>
                <td class="label">Chức danh / Chức vụ:</td>
                <td style="font-weight: bold; color: #0b3c5d;">${employee.position}</td>
              </tr>
              <tr>
                <td class="label">Đơn vị / Ban ngành:</td>
                <td>${employee.unit}</td>
              </tr>
              <tr>
                <td class="label">Trạng thái công tác:</td>
                <td>${statusText}</td>
              </tr>
              <tr>
                <td class="label">Tiến độ công việc hoàn thành:</td>
                <td>
                  <strong>${employee.workProgress}%</strong>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <div class="section-title">Nhiệm vụ trọng tâm và ghi chú điều hành</div>
        <div class="notes-box">${employee.customNotes || 'Chưa cập nhật nội dung nhiệm vụ và nhận xét.'}</div>

        <div class="section-title">Danh mục văn bản đính kèm (${attachmentCount})</div>
        <ul style="padding-left: 20px; font-size: 14px;">
          ${listAttachments}
        </ul>

        <div class="date-location">
          Gia Lai, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}
        </div>

        <table class="footer-sign">
          <tr>
            <td>
              <strong>NGƯỜI LẬP BÁO CÁO</strong><br>
              <span style="font-style: italic; font-weight: normal; font-size: 13px;">(Ký và ghi rõ họ tên)</span>
              <br><br><br><br>
              <span style="color: #888;">[ Chữ ký điện tử ]</span>
            </td>
            <td>
              <strong>TM. BAN THƯỜNG TRỰC LĐLĐ TỈNH</strong><br>
              <span style="font-style: italic; font-weight: normal; font-size: 13px;">(Ký tên và đóng dấu)</span>
              <br><br><br><br>
              <span style="color: #888;">[ Đã phê duyệt hệ thống ]</span>
            </td>
          </tr>
        </table>

        <script>
          // Auto trigger printer choice dialog for ease of use
          window.onload = function() {
            // Optional auto trigger can be commented if annoying but user requested fast PDF output
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
