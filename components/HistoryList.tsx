
import React from 'react';
import { Report, Employee } from '../types';
import { History, Download, FileCheck, AlertCircle, Clock, Edit2, Trash2, FileText, Award, AlertTriangle, LogOut } from 'lucide-react';
import { 
  generateOfficialAbsenceForm, 
  generateEmployeePDF, 
  generateLateArrivalDepartureForm, 
  generateExitPermit, 
  generateLateCumulativeLog, 
  generateAppreciationCertificate,
  generateWarningLetter
} from '../utils/pdfGenerator';

interface HistoryListProps {
  reports: Report[];
  selectedEmployee: Employee;
  onDeleteReport: (reportId: number) => Promise<void>;
  onEditReport: (report: Report) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ reports, selectedEmployee, onDeleteReport, onEditReport }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'غياب': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'تأخر_انصراف': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'إذن_خروج': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'خطاب_إنذار': return 'bg-red-100 text-red-700 border-red-200';
      case 'شكر_وتقدير': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'تأخر_انصراف': return 'تنبيه تأخر';
      case 'غياب': return 'مساءلة غياب';
      case 'إذن_خروج': return 'إذن خروج';
      case 'خطاب_إنذار': return 'خطاب إنذار';
      case 'شكر_وتقدير': return 'شكر وتقدير';
      default: return type;
    }
  };

  const handlePrint = (report: Report) => {
    switch(report.type) {
      case 'غياب': generateOfficialAbsenceForm(selectedEmployee, report); break;
      case 'تأخر_انصراف': generateLateArrivalDepartureForm(selectedEmployee, report); break;
      case 'إذن_خروج': generateExitPermit(selectedEmployee, report); break;
      case 'خطاب_إنذار': generateWarningLetter(selectedEmployee, report); break;
      case 'شكر_وتقدير': generateAppreciationCertificate(selectedEmployee, report); break;
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <History size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">سجل الانضباط الفردي</h3>
            <p className="text-xs text-slate-400 font-bold">إدارة التقارير والمساءلات المسجلة للموظف</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => generateLateCumulativeLog(selectedEmployee, reports)}
            className="flex items-center gap-2 bg-amber-50 text-amber-600 px-5 py-2.5 rounded-2xl font-black text-sm hover:bg-amber-100 transition-all border border-amber-100 shadow-sm"
          >
            <Clock size={18} />
            سجل حصر التأخر
          </button>
          <button
            onClick={() => generateEmployeePDF(selectedEmployee, reports)}
            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl"
          >
            <Download size={18} />
            تحميل السجل
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-300 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
          <AlertCircle size={48} className="mb-4 opacity-20" />
          <p className="font-black text-lg">لا توجد سجلات حالية لهذا الموظف</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="pb-4 pr-4">التاريخ</th>
                <th className="pb-4">النوع</th>
                <th className="pb-4">التفاصيل</th>
                <th className="pb-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((report) => (
                <tr key={report.id} className="text-slate-700 hover:bg-slate-50 transition-colors">
                  <td className="py-5 pr-4 font-mono text-sm font-bold">{report.date}</td>
                  <td className="py-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${getTypeColor(report.type)}`}>
                      {getTypeName(report.type)}
                    </span>
                  </td>
                  <td className="py-5 text-sm font-bold max-w-xs truncate text-slate-600">
                    {report.type === 'غياب' ? `${report.daysCount} أيام` : 
                     report.type === 'تأخر_انصراف' ? `حضور: ${report.lateArrivalTime}` : 
                     report.type === 'خطاب_إنذار' ? `إنذار ${report.warningLevel}` :
                     report.type === 'إذن_خروج' ? `من ${report.lateArrivalTime} لـ ${report.earlyDepartureTime}` :
                     report.notes}
                  </td>
                  <td className="py-5">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handlePrint(report)}
                        className="flex items-center gap-2 text-white bg-indigo-600 px-4 py-1.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg text-[10px] font-black"
                      >
                        <FileCheck size={14} /> طباعة
                      </button>
                      <button onClick={() => onEditReport(report)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                      <button onClick={() => report.id && onDeleteReport(report.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoryList;
