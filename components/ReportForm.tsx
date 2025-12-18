
import React, { useState, useEffect } from 'react';
import { Report, Employee, ReportType } from '../types';
import { Send, FileText, Clock, X, Calendar } from 'lucide-react';

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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        createdAt: editingReport.createdAt
      });
    }
  }, [editingReport]);

  useEffect(() => {
    if (formData.type === 'غياب' && formData.date && formData.endDate) {
      const start = new Date(formData.date);
      const end = new Date(formData.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, daysCount: diffDays }));
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
        });
      }
      alert('تم حفظ سجل الحضور بنجاح');
    } catch (err) {
      alert('فشل حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl border transition-all ${editingReport ? 'border-indigo-400 ring-8 ring-indigo-50' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${editingReport ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
            <Clock size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">{editingReport ? 'تعديل سجل الحضور' : 'تسجيل (غياب / تأخر)'}</h3>
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
            <label className="text-sm font-black text-slate-700 mr-2">نوع الحالة</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ReportType })}
              className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 bg-slate-50 font-black text-slate-700"
            >
              <option value="غياب">غياب كلي</option>
              <option value="تأخر_انصراف">تأخر صباحي / انصراف مبكر</option>
            </select>
          </div>

          <div className="space-y-2 lg:col-span-4">
            <label className="text-sm font-black text-slate-700 mr-2">التاريخ</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black"
            />
          </div>

          {formData.type === 'غياب' ? (
            <div className="space-y-2 lg:col-span-4">
              <label className="text-sm font-black text-slate-700 mr-2">إلى تاريخ</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black"
              />
            </div>
          ) : (
            <div className="space-y-2 lg:col-span-4">
               <label className="text-sm font-black text-slate-700 mr-2">وقت الحضور</label>
               <input type="time" value={formData.lateArrivalTime} onChange={(e) => setFormData({...formData, lateArrivalTime: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700 mr-2">ملاحظات المساءلة</label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
            placeholder="اكتب تفاصيل أو أسباب الحالة هنا..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || selectedEmployees.length === 0}
          className="w-full flex items-center justify-center gap-3 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl active:scale-95 disabled:bg-slate-300"
        >
          <Send size={24} />
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ سجل الحضور'}
        </button>
      </form>
    </div>
  );
};

export default ReportForm;
