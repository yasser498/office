
import React, { useState, useEffect } from 'react';
import { Report, Employee, ReportType } from '../types';
import { Send, FileText, Clock, Users, X, UserCheck, LogOut } from 'lucide-react';

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
    earlyDepartureTime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, daysCount: diffDays > 0 ? diffDays : 1 }));
      }
    } else {
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
          // إضافة تاريخ الإدخال الفعلي لكل تقرير جديد
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
          earlyDepartureTime: ''
        });
      }
      alert(editingReport ? 'تم تحديث التقرير' : `تم إنشاء ${selectedEmployees.length} تقارير بنجاح`);
    } catch (err) {
      alert('فشل حفظ التقارير');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white p-5 md:p-6 rounded-2xl shadow-sm border transition-all ${editingReport ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${editingReport ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{editingReport ? 'تعديل التقرير' : 'إضافة حالة جديدة'}</h3>
            <div className="flex items-center gap-1.5 text-indigo-600 text-sm font-semibold">
              <UserCheck size={14} />
              <span>مختار: {selectedEmployees.length} موظفين</span>
            </div>
          </div>
        </div>
        {editingReport && (
          <button onClick={onCancelEdit} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {selectedEmployees.map(emp => (
          <span key={emp.id} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100 animate-in zoom-in-50 duration-200">
            {emp.name}
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-sm font-bold text-slate-700">نوع الحالة</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ReportType })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white font-semibold"
            >
              <option value="غياب">غياب (مساءلة)</option>
              <option value="تأخر_انصراف">تنبيه تأخر / انصراف</option>
            </select>
          </div>

          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-sm font-bold text-slate-700">التاريخ</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>

          {formData.type === 'غياب' && (
            <div className="space-y-1.5 lg:col-span-1">
              <label className="text-sm font-bold text-slate-700">إلى تاريخ</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>
          )}

          {formData.type === 'تأخر_انصراف' && (
            <>
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Clock size={14}/> وقت الحضور</label>
                <input
                  type="time"
                  value={formData.lateArrivalTime}
                  onChange={(e) => setFormData({ ...formData, lateArrivalTime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><LogOut size={14}/> وقت الانصراف</label>
                <input
                  type="time"
                  value={formData.earlyDepartureTime}
                  onChange={(e) => setFormData({ ...formData, earlyDepartureTime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                />
              </div>
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Users size={14}/> الحصة</label>
                <select
                  value={formData.absenceSession}
                  onChange={(e) => setFormData({ ...formData, absenceSession: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
                >
                  <option value="">-- اختر الحصة --</option>
                  {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700">الأسباب / ملاحظات إضافية</label>
          <textarea
            rows={3}
            value={formData.notes}
            placeholder="اكتب الأسباب هنا لتظهر في النموذج المطبوع..."
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-semibold"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || selectedEmployees.length === 0}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-[0.98] text-white ${editingReport ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none'}`}
          >
            <Send size={22} />
            {isSubmitting ? 'جاري التنفيذ...' : editingReport ? 'تحديث البيانات' : `تطبيق على ${selectedEmployees.length} موظفين`}
          </button>
          
          {editingReport && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-8 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-bold transition-all"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
