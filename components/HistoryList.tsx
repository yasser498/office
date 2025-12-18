
import React, { useMemo } from 'react';
import { Report, Employee } from '../types';
import { History, Download, FileCheck, AlertCircle, Clock, Edit2, Trash2, FileText, Award, AlertTriangle, ShieldCheck, CalendarCheck } from 'lucide-react';
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
  
  // فصل التقارير بناءً على النوع
  const attendanceReports = useMemo(() => 
    reports.filter(r => r.type === 'غياب' || r.type === 'تأخر_انصراف'),
  [reports]);

  const administrativeReports = useMemo(() => 
    reports.filter(r => r.type === 'إذن_خروج' || r.type === 'خطاب_إنذار' || r.type === 'شكر_وتقدير'),
  [reports]);

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
    <div className="space-y-12 animate-in zoom-in-95 duration-500">
      {/* 1. سجل الحضور والانضباط اليومي */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
              <CalendarCheck size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">سجل الحضور والغياب</h3>
              <p className="text-xs text-slate-400 font-bold">متابعة الغيابات وتأخر الدوام الرسمي</p>
            </div>
          </div>
          
          <button
            onClick={() => generateLateCumulativeLog(selectedEmployee, reports)}
            className="flex items-center gap-2 bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-amber-100 transition-all border border-amber-100 shadow-sm"
          >
            <Clock size={18} />
            توليد سجل حصر التأخر
          </button>
        </div>

        {attendanceReports.length === 0 ? (
          <div className="py-10 text-center text-slate-300 font-bold italic">لا توجد غيابات مسجلة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="p-4 rounded-r-xl">التاريخ</th>
                  <th className="p-4">النوع</th>
                  <th className="p-4">المدة / الحضور</th>
                  <th className="p-4 text-center rounded-l-xl">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendanceReports.map((report) => (
                  <tr key={report.id} className="text-slate-700 hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold">{report.date}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${report.type === 'غياب' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {report.type === 'غياب' ? 'مساءلة غياب' : 'تنبيه تأخر'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-sm">
                      {report.type === 'غياب' ? `${report.daysCount} أيام` : `الحضور: ${report.lateArrivalTime}`}
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => handlePrint(report)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl hover:bg-indigo-700 text-[10px] font-black flex items-center gap-2 shadow-lg"><FileCheck size={14}/> طباعة</button>
                      <button onClick={() => onEditReport(report)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                      <button onClick={() => report.id && onDeleteReport(report.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. سجل الإجراءات الإدارية والتقديرية */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-emerald-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-full -ml-16 -mt-16 opacity-40"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">السجل الإداري والتقديري</h3>
                <p className="text-xs text-slate-400 font-bold">أذونات الخروج، الإنذارات الرسمية، شهادات الشكر</p>
              </div>
            </div>
          </div>

          {administrativeReports.length === 0 ? (
            <div className="py-10 text-center text-slate-300 font-bold italic">لا توجد إجراءات إدارية مسجلة</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-emerald-50/50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                    <th className="p-4 rounded-r-xl">التاريخ</th>
                    <th className="p-4">نوع المستند</th>
                    <th className="p-4">البيان</th>
                    <th className="p-4 text-center rounded-l-xl">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {administrativeReports.map((report) => (
                    <tr key={report.id} className="text-slate-700 hover:bg-emerald-50/30 transition-colors">
                      <td className="p-4 font-mono font-bold">{report.date}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${
                          report.type === 'إذن_خروج' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          report.type === 'خطاب_إنذار' ? 'bg-red-50 text-red-600 border-red-100' : 
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {report.type === 'إذن_خروج' ? 'إذن خروج' : report.type === 'خطاب_إنذار' ? 'إنذار رسمي' : 'شكر وتقدير'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-sm">
                        {report.type === 'إذن_خروج' ? `من ${report.lateArrivalTime} لـ ${report.earlyDepartureTime}` : 
                         report.type === 'خطاب_إنذار' ? `مستوى: ${report.warningLevel}` : 'شهادة تقدير'}
                      </td>
                      <td className="p-4 flex justify-center gap-2">
                        <button onClick={() => handlePrint(report)} className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl hover:bg-emerald-700 text-[10px] font-black flex items-center gap-2 shadow-lg"><FileCheck size={14}/> طباعة</button>
                        <button onClick={() => report.id && onDeleteReport(report.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryList;
