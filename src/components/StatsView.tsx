/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Employee } from '../types';
import { Users, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface StatsViewProps {
  employees: Employee[];
}

export default function StatsView({ employees }: StatsViewProps) {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // Compute key indicators dynamically
  const stats = useMemo(() => {
    const total = employees.length;
    if (total === 0) {
      return {
        total: 0,
        averageProgress: 0,
        activeCount: 0,
        leaveCount: 0,
        probationCount: 0,
        ageGroups: {
          'Dưới 30 tuổi': 0,
          '31 - 40 tuổi': 0,
          '41 - 50 tuổi': 0,
          'Trên 50 tuổi': 0,
        },
        unitCounts: {} as Record<string, number>
      };
    }

    // Work progress
    const totalProgress = employees.reduce((sum, emp) => sum + emp.workProgress, 0);
    const averageProgress = Math.round(totalProgress / total);

    // Dynamic state
    let activeCount = 0;
    let leaveCount = 0;
    let probationCount = 0;
    
    // Departments
    const unitCounts: Record<string, number> = {};

    // Age groups (Base Year: 2026)
    const ageGroups = {
      'Dưới 30 tuổi': 0,
      '31 - 40 tuổi': 0,
      '41 - 50 tuổi': 0,
      'Trên 50 tuổi': 0,
    };

    employees.forEach(emp => {
      // States
      if (emp.status === 'active') activeCount++;
      else if (emp.status === 'leave') leaveCount++;
      else if (emp.status === 'probation') probationCount++;

      // Department
      const shortUnit = emp.unit.replace(' LĐLĐ Tỉnh Gia Lai', '').replace(' LĐLĐ Tỉnh', '');
      unitCounts[shortUnit] = (unitCounts[shortUnit] || 0) + 1;

      // Age calculation relative to 2026
      if (emp.dob) {
        const birthYear = new Date(emp.dob).getFullYear();
        const age = 2026 - birthYear;
        if (age < 30) ageGroups['Dưới 30 tuổi']++;
        else if (age <= 40) ageGroups['31 - 40 tuổi']++;
        else if (age <= 50) ageGroups['41 - 50 tuổi']++;
        else ageGroups['Trên 50 tuổi']++;
      }
    });

    return {
      total,
      averageProgress,
      activeCount,
      leaveCount,
      probationCount,
      ageGroups,
      unitCounts: unitCounts as Record<string, number>
    };
  }, [employees]);

  // SVG dimensions & configuration
  const barChartWidth = 400;
  const barChartHeight = 220;
  
  const unitList = Object.entries(stats.unitCounts as Record<string, number>).map(([name, count]) => ({ name, count: count as number }));
  const maxCount = Math.max(...unitList.map(u => u.count), 1);

  // Colors for Donut chart categories
  const donutColors = {
    'Dưới 30 tuổi': '#10B981', // green
    '31 - 40 tuổi': '#3B82F6', // blue
    '41 - 50 tuổi': '#F59E0B', // amber
    'Trên 50 tuổi': '#EF4444', // red
  };

  // Compute angles for Donut chart of Age Groups
  const donutData = useMemo(() => {
    let accumulatedAngle = 0;
    const total = Object.values(stats.ageGroups as Record<string, number>).reduce((s, c) => s + c, 0) || 1;
    
    return Object.entries(stats.ageGroups as Record<string, number>).map(([group, val]) => {
      const count = val as number;
      const percentage = (count / total) * 100;
      const angle = (count / total) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      return {
        group,
        count,
        percentage: Math.round(percentage),
        startAngle,
        endAngle: accumulatedAngle
      };
    });
  }, [stats.ageGroups]);

  // Assist calculation of SVG arc paths
  const getArcPath = (startAngle: number, endAngle: number, radius: number, cx: number, cy: number) => {
    // Coordinate conversions
    const polarToCartesian = (centerX: number, centerY: number, rad: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
      return {
        x: centerX + rad * Math.cos(angleInRadians),
        y: centerY + rad * Math.sin(angleInRadians),
      };
    };

    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  return (
    <div id="statistics-dashboard" className="space-y-6">
      {/* Title */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Thống Kê Trực Quan</h2>
          <p className="text-xs text-gray-500">Báo cáo tự động về tình trạng và cơ cấu cán bộ Liên đoàn</p>
        </div>
        <div className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold">
          Ngoại Tuyến - Đã lưu trữ
        </div>
      </div>

      {/* Numerical Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Tổng số cán bộ</div>
            <div className="text-xl font-bold text-gray-900">{stats.total} nhân sự</div>
          </div>
        </div>

        {/* Avg Performance / Work completion */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Tiến trình trung bình</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900">{stats.averageProgress}%</span>
              <span className="text-[10px] text-green-600 font-semibold">hoàn thành</span>
            </div>
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Đang hoạt động</div>
            <div className="text-xl font-bold text-gray-900">{stats.activeCount} cán bộ</div>
          </div>
        </div>

        {/* Probation/Leave */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Tạm nghỉ / khác</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.leaveCount + stats.probationCount} nhân sự
            </div>
          </div>
        </div>
      </div>

      {/* Graphical Chart Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Department allocations (Horizontal & vertical representation) */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex justify-between items-center">
            <span>Phân bổ theo Ban ngành & Công đoàn cơ sở</span>
            <span className="text-[10px] font-normal text-gray-400">Số lượng cán bộ</span>
          </h3>

          <div className="space-y-3.5">
            {unitList.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-8">Chưa có dữ liệu thành viên</p>
            ) : (
              unitList.map((unit, index) => {
                const percentage = (unit.count / maxCount) * 100;
                return (
                  <div 
                    key={unit.name} 
                    className="group cursor-pointer"
                    onClick={() => setSelectedUnit(selectedUnit === unit.name ? null : unit.name)}
                  >
                    <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                      <span className="font-medium truncate max-w-[240px] group-hover:text-blue-700 transition-colors">
                        {unit.name}
                      </span>
                      <span className="font-bold text-gray-900">{unit.count} cán bộ</span>
                    </div>
                    {/* Rounded dynamic track progress */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 hover:bg-blue-700 h-full rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {selectedUnit && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-900">
              Đơn vị: <strong>{selectedUnit}</strong> chiếm khoảng {Math.round((stats.unitCounts[selectedUnit] / stats.total) * 100)}% tổng số nhân sự liên đoàn.
            </div>
          )}
        </div>

        {/* Panel 2: Age demographics visual ring map (Donut representation) */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-800 mb-3">
            Cơ cấu độ tuổi cán bộ (Thống kê niên giám 2026)
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* SVG Ring Donut */}
            <div className="relative w-44 h-44">
              <svg width="176" height="176" viewBox="0 0 200 200" className="transform -rotate-90">
                <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f3f4f6" strokeWidth="24" />
                {donutData.map((slice) => {
                  if (slice.count === 0) return null;
                  const path = getArcPath(slice.startAngle, slice.endAngle, 70, 100, 100);
                  const color = donutColors[slice.group as keyof typeof donutColors];
                  return (
                    <path
                      key={slice.group}
                      d={path}
                      fill="transparent"
                      stroke={color}
                      strokeWidth="24"
                      className="transition-all hover:opacity-85 cursor-pointer"
                      title={`${slice.group}: ${slice.count}`}
                    />
                  );
                })}
              </svg>
              {/* Inner Circle metrics block */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xl font-black text-gray-800">{stats.total} Nhóm</span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Niên khóa</span>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="space-y-2 flex-1 max-w-[180px]">
              {donutData.map((slice) => {
                const color = donutColors[slice.group as keyof typeof donutColors];
                return (
                  <div key={slice.group} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-gray-600 truncate">{slice.group}</span>
                    </div>
                    {slice.count > 0 ? (
                      <span className="font-bold text-gray-900">{slice.percentage}% ({slice.count})</span>
                    ) : (
                      <span className="text-gray-300">0%</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-400 italic text-center">
            * Độ tuổi được tính tự động dựa trên hồ sơ ngày sinh so với thời điểm hiện tại năm 2026.
          </div>
        </div>
      </div>

      {/* Task updates Progress Distribution section */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4">
          Phân phối Tiến trình Công việc cán bộ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
            <div className="text-xs font-semibold text-green-800 mb-1">Mức hoàn thành xuất sắc (90% - 100%)</div>
            <div className="text-2xl font-bold text-green-900">
              {employees.filter(e => e.workProgress >= 90).length} cán bộ
            </div>
            <div className="text-[10px] text-green-600 mt-1">Đảm bảo KPI kế hoạch năm đưa ra của tỉnh</div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="text-xs font-semibold text-blue-800 mb-1">Tiến trình đạt Khá (70% - 89%)</div>
            <div className="text-2xl font-bold text-blue-900">
              {employees.filter(e => e.workProgress >= 70 && e.workProgress < 90).length} cán bộ
            </div>
            <div className="text-[10px] text-blue-600 mt-1">Đang bám sát thực hiện nghị quyết nhiệm kỳ</div>
          </div>

          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <div className="text-xs font-semibold text-red-800 mb-1">Cần đôn đốc nhắc nhở (Dưới 70%)</div>
            <div className="text-2xl font-bold text-red-900">
              {employees.filter(e => e.workProgress < 70).length} cán bộ
            </div>
            <div className="text-[10px] text-red-600 mt-1">Gặp khó khăn tác nghiệp hoặc thử việc tập sự</div>
          </div>
        </div>
      </div>
    </div>
  );
}
