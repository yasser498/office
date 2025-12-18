
import React, { useState, useEffect } from 'react';
import { Report, Employee, ReportType } from '../types';
import { Send, FileText, Clock, Users, X, UserCheck, LogOut, Calendar, AlertCircle, AlertTriangle, Award } from 'lucide-react';

interface ReportFormProps {
  selectedEmployees: Employee[];
  onSave: (report: Report, employeeId: number) => Promise<void>;
  editingReport: Report | null;
  onCancelEdit: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ selectedEmployees, onSave, editingReport, onCancelEdit }) => {
  const [formData, setFormData] = useState<Omit<Report, 'employeeId'>>({
    date: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    daysCount: 1,
    type: 'غياب' as ReportType,
    notes: '',
    actionTaken: '',
    lateArrivalTime: '',
    absenceSession: '',
    earlyDepartureTime: '',
    warningLevel: 'الأول',
    letterNo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const sessions = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة"];

  useEffect(() => {
    if (editingReport) {
      setFormData({
        id: editingReport.id,
        date: editingReport.date,
        endDate: editingReport.endDate || editingReport.date,
        daysCount: editingReport.daysCount || 1,
        type: editingReport.type,
        notes: editingReport.notes,
        actionTaken: editingReport.actionTaken,
        lateArrivalTime: editingReport.lateArrivalTime || '',
        absenceSession: editingReport.absenceSession || '',
        earlyDepartureTime: editingReport.earlyDepartureTime || '',
        warningLevel: editingReport.warningLevel || 'الأول',
        letterNo: editingReport.letterNo || '',
        principalName: editingReport.principalName,
        createdAt: editingReport.createdAt
      });
    }
  }, [editingReport]);

  useEffect(() => {
    if (formData.type === 'غياب' && formData.date && formData.endDate) {
      const start = new Date(formData.date);
      const end = new Date(formData.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (end < start) {
          setDateError("خطأ في التواريخ");
          setFormData(prev => ({ ...prev, daysCount: 0 }));
        } else {
          setDateError(null);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          setFormData(prev => ({ ...prev, daysCount: diffDays }));
        }
      }
    } else {
      setDateError(null);
      setFormData(prev => ({ ...prev, daysCount: 1 }));
    }
  }, [formData.date, formData.endDate, formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) return;
    setIsSubmitting(true);
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      if (editingReport) {
        await onSave({ ...formData, employeeId: selectedEmployees[0].id } as Report, selectedEmployees[0].id);
        onCancelEdit();
      } else {
        for (const emp of selectedEmployees) {
          await onSave({ ...formData, createdAt: todayStr } as Report, emp.id);
        }
        setFormData({
          date: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          daysCount: 1,
          type: 'غياب',
          notes: '',
          actionTaken: '',
          lateArrivalTime: '',
          absenceSession: '',
          earlyDepartureTime: '',
          warningLevel: 'الأول',
          letterNo: ''
        });
      }
      alert('تم حفظ الإجراء وتسجيله بنجاح');
    } catch (err) {
      alert('فشل حفظ التقارير');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl border transition-all ${editingReport ? 'border-indigo-400 ring-8 ring-indigo-50' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${editingReport ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
            <FileText size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">{editingReport ? 'تعديل السجل' : 'إضافة إجراء جديد'}</h3>
            <p className="text-sm font-bold text-slate-400 mt-1">الموظفون المختارون: {selectedEmployees.length}</p>
          </div>
        </div>
        {editingReport && (
          <button onClick={onCancelEdit} className="p-2 text-slate-300 hover:text-rose-500 rounded-full"><X size={24} /></button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          <div className="space-y-2 lg:col-span-4">
            <label className="text-sm font-black text-slate-700 mr-2">نوع الإجراء الرسمي</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ReportType })}
              className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50 font-black text-slate-700 appearance-none"
            >
              <option value="غياب">غياب (مساءلة)</option>
              <option value="تأخر_انصراف">تنبيه تأخر / انصراف</option>
              <option value="إذن_خروج">إذن خروج (20-01)</option>
              <option value="خطاب_إنذار">خطاب إنذار رسمي</option>
              <option value="شكر_وتقدير">شكر وتقدير</option>
            </select>
          </div>

          <div className="space-y-2 lg:col-span-4">
            <label className="text-sm font-black text-slate-700 mr-2">تاريخ الحالة</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black"
            />
          </div>

          {formData.type === 'غياب' && (
            <div className="space-y-2 lg:col-span-4">
              <label className="text-sm font-black text-slate-700 mr-2">إلى تاريخ</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black"
              />
            </div>
          )}

          {(formData.type === 'تأخر_انصراف' || formData.type === 'إذن_خروج') && (
            <>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-black text-slate-700 mr-2">وقت الخروج/الحضور</label>
                <input type="time" value={formData.lateArrivalTime} onChange={(e) => setFormData({...formData, lateArrivalTime: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-black text-slate-700 mr-2">وقت العودة/الانصراف</label>
                <input type="time" value={formData.earlyDepartureTime} onChange={(e) => setFormData({...formData, earlyDepartureTime: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
              </div>
            </>
          )}

          {formData.type === 'خطاب_إنذار' && (
            <>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-black text-slate-700 mr-2">مستوى الإنذار</label>
                <select value={formData.warningLevel} onChange={(e) => setFormData({...formData, warningLevel: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black">
                  <option value="الأول">الأول</option>
                  <option value="الثاني">الثاني</option>
                  <option value="النهائي">النهائي</option>
                </select>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-black text-slate-700 mr-2">رقم الخطاب</label>
                <input type="text" placeholder="123/أ" value={formData.letterNo} onChange={(e) => setFormData({...formData, letterNo: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700 mr-2">الأسباب / ملاحظات إضافية</label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
            placeholder="سيظهر هذا النص في محتوى الخطاب المطبوع..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || selectedEmployees.length === 0}
          className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl active:scale-95 disabled:bg-slate-300"
        >
          <Send size={24} />
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ الإجراء في السجل'}
        </button>
      </form>
    </div>
  );
};

export default ReportForm;
