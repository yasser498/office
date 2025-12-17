
import React from 'react';
import { Report, Employee } from '../types';
import { History, Download, FileCheck, AlertCircle, Clock, Edit2, Trash2 } from 'lucide-react';
import { generateOfficialAbsenceForm, generateEmployeePDF, generateLateArrivalDepartureForm } from '../utils/pdfGenerator';

interface HistoryListProps {
  reports: Report[];
  selectedEmployee: Employee;
  onDeleteReport: (reportId: number) => Promise<void>;
  onEditReport: (report: Report) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ reports, selectedEmployee, onDeleteReport, onEditReport }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'غياب': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'تأخر_انصراف': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'تأخر': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'مخالفة': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'تأخر_انصراف': return 'تنبيه تأخر';
      case 'غياب': return 'غياب (مساءلة)';
      default: return type;
    }
  };

  const handleDelete = async (reportId: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التقرير؟')) {
      await onDeleteReport(reportId);
    }
  };

  const safeGeneratePDF = async (genFn: () => Promise<void>) => {
    try {
      await genFn();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('حدث خطأ أثناء محاولة توليد الملف. يرجى التأكد من السماح بالنوافذ المنبثقة.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            <History size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">سجل التقارير والمساءلات</h3>
        </div>
        
        {reports.length > 0 && (
          <button
            onClick={() => safeGeneratePDF(async () => generateEmployeePDF(selectedEmployee, reports))}
            className="flex items-center gap-2 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-semibold"
          >
            <Download size={16} />
            تحميل السجل كاملاً
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
          <AlertCircle size={48} className="mb-2 opacity-20" />
          <p>لا توجد تقارير مسجلة</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-sm">
                <th className="pb-3 font-semibold">التاريخ</th>
                <th className="pb-3 font-semibold">النوع</th>
                <th className="pb-3 font-semibold">التفاصيل</th>
                <th className="pb-3 font-semibold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((report) => (
                <tr key={report.id} className="text-slate-700 hover:bg-slate-50 transition-colors group">
                  <td className="py-4 font-mono text-sm">
                    {report.date}
                    {report.endDate && report.endDate !== report.date && (
                      <div className="text-[10px] text-slate-400">إلى: {report.endDate}</div>
                    )}
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getTypeColor(report.type)}`}>
                      {getTypeName(report.type)}
                    </span>
                  </td>
                  <td className="py-4 text-sm max-w-xs truncate">
                    {report.type === 'غياب' ? `${report.daysCount} أيام: ${report.notes}` : 
                     report.type === 'تأخر_انصراف' ? `حضور: ${report.lateArrivalTime || '--'} | حصة: ${report.absenceSession || '--'}` : 
                     report.notes}
                  </td>
                  <td className="py-4">
                    <div className="flex justify-center gap-2">
                      <div className="flex items-center gap-1">
                        {report.type === 'غياب' ? (
                          <button
                            onClick={() => safeGeneratePDF(() => generateOfficialAbsenceForm(selectedEmployee, report))}
                            className="flex items-center gap-1.5 text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all shadow-sm text-[10px] font-bold active:scale-95"
                            title="طباعة المساءلة"
                          >
                            <FileCheck size={14} />
                            طباعة
                          </button>
                        ) : report.type === 'تأخر_انصراف' ? (
                          <button
                            onClick={() => safeGeneratePDF(() => generateLateArrivalDepartureForm(selectedEmployee, report))}
                            className="flex items-center gap-1.5 text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all shadow-sm text-[10px] font-bold active:scale-95"
                            title="طباعة التنبيه"
                          >
                            <Clock size={14} />
                            طباعة
                          </button>
                        ) : null}
                        
                        <button
                          onClick={() => onEditReport(report)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="تعديل التقرير"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        <button
                          onClick={() => report.id && handleDelete(report.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف التقرير"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
