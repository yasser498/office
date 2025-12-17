
import React, { useState, useMemo } from 'react';
import { Report, Employee } from '../types';
import { ClipboardList, Printer, Search, Calendar, CheckSquare, Square, Trash2 } from 'lucide-react';
import { generateBatchForms } from '../utils/pdfGenerator';

interface DailyLogProps {
  employees: Employee[];
  onDeleteReport: (reportId: number) => Promise<void>;
  reports: Report[];
}

const DailyLog: React.FC<DailyLogProps> = ({ employees, onDeleteReport, reports }) => {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);

  const employeeMap = useMemo(() => {
    const map = new Map<number, Employee>();
    employees.forEach(e => map.set(e.id, e));
    return map;
  }, [employees]);

  const filteredReports = useMemo(() => {
    return reports
      .filter(r => {
        const emp = employeeMap.get(r.employeeId);
        const matchesDate = !dateFilter || r.date === dateFilter;
        const matchesSearch = !searchQuery || 
          emp?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp?.civilId?.includes(searchQuery);
        return matchesDate && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, dateFilter, searchQuery, employeeMap]);

  const toggleSelect = (id: number) => {
    setSelectedReportIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReportIds.length === filteredReports.length) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(filteredReports.map(r => r.id!).filter(id => id !== undefined));
    }
  };

  const handleBatchPrint = async () => {
    if (selectedReportIds.length === 0) return;
    
    const batchData = selectedReportIds.map(id => {
      const report = reports.find(r => r.id === id);
      const employee = report ? employeeMap.get(report.employeeId) : null;
      return report && employee ? { employee, report } : null;
    }).filter(item => item !== null) as { employee: Employee, report: Report }[];

    if (batchData.length > 0) {
      await generateBatchForms(batchData);
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'تأخر_انصراف': return 'تنبيه تأخر';
      case 'غياب': return 'غياب (مساءلة)';
      default: return type;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-50 bg-slate-50/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-indigo-100 shadow-lg">
              <ClipboardList size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">السجل العام واليومي</h3>
              <p className="text-xs text-slate-500 font-bold">إجمالي التقارير في النظام: {reports.length}</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleBatchPrint}
              disabled={selectedReportIds.length === 0}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              <Printer size={18} />
              طباعة المختار ({selectedReportIds.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="بحث باسم الموظف في السجل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
              <th className="px-6 py-4 text-center w-12">
                <button onClick={toggleSelectAll} className="text-indigo-600 hover:scale-110 transition-transform">
                  {selectedReportIds.length === filteredReports.length && filteredReports.length > 0 ? <CheckSquare size={20}/> : <Square size={20}/>}
                </button>
              </th>
              <th className="px-6 py-4">الموظف</th>
              <th className="px-6 py-4">التاريخ</th>
              <th className="px-6 py-4">النوع</th>
              <th className="px-6 py-4">التفاصيل</th>
              <th className="px-6 py-4 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-slate-400 font-bold">لا توجد تقارير مطابقة للبحث</td>
              </tr>
            ) : filteredReports.map((report) => {
              const emp = employeeMap.get(report.employeeId);
              const isSelected = selectedReportIds.includes(report.id!);
              return (
                <tr key={report.id} className={`hover:bg-indigo-50/30 transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => toggleSelect(report.id!)} className={`${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}>
                      {isSelected ? <CheckSquare size={20}/> : <Square size={20}/>}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-sm">{emp?.name || '---'}</div>
                    <div className="text-[10px] text-slate-400">{emp?.civilId}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">{report.date}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {getTypeName(report.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                    {report.notes || '---'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => report.id && window.confirm('حذف التقرير نهائياً؟') && onDeleteReport(report.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyLog;
