
import React, { useState } from 'react';
import { Report, Employee, ReportType } from '../types';
import { Send, Clock, AlertTriangle, Award, X, ShieldCheck } from 'lucide-react';

interface AdministrativeFormProps {
  selectedEmployees: Employee[];
  onSave: (report: Report, employeeId: number) => Promise<void>;
  onClose: () => void;
}

const AdministrativeForm: React.FC<AdministrativeFormProps> = ({ selectedEmployees, onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<Report, 'employeeId'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'إذن_خروج' as ReportType,
    notes: '',
    actionTaken: '',
    lateArrivalTime: '08:00',
    earlyDepartureTime: '10:00',
    warningLevel: 'الأول',
    letterNo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) return;
    setIsSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      for (const emp of selectedEmployees) {
        await onSave({ ...formData, createdAt: todayStr } as Report, emp.id);
      }
      alert('تم إصدار الإجراء الإداري بنجاح');
      onClose();
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border-4 border-emerald-500/20">
        <div className="bg-emerald-600 p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black">إصدار مستند إداري رسمي</h3>
              <p className="text-sm text-emerald-100 font-bold mt-1">المستهدفون: {selectedEmployees.length} موظفاً</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={32} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-700 mr-2">اختر نوع المستند</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'إذن_خروج', label: 'إذن خروج (20-01)', icon: Clock },
                  { id: 'خطاب_إنذار', label: 'خطاب إنذار رسمي', icon: AlertTriangle },
                  { id: 'شكر_وتقدير', label: 'شهادة شكر وتقدير', icon: Award }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.id as ReportType })}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all font-black ${
                      formData.type === type.id 
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-700' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200'
                    }`}
                  >
                    <type.icon size={20} />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 mr-2">التاريخ</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 font-black"
                />
              </div>

              {formData.type === 'إذن_خروج' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 mr-2">وقت الخروج</label>
                    <input type="time" value={formData.lateArrivalTime} onChange={(e) => setFormData({...formData, lateArrivalTime: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 mr-2">وقت العودة</label>
                    <input type="time" value={formData.earlyDepartureTime} onChange={(e) => setFormData({...formData, earlyDepartureTime: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                  </div>
                </div>
              )}

              {formData.type === 'خطاب_إنذار' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 mr-2">المستوى</label>
                    <select value={formData.warningLevel} onChange={(e) => setFormData({...formData, warningLevel: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none">
                      <option value="الأول">الإنذار الأول</option>
                      <option value="الثاني">الإنذار الثاني</option>
                      <option value="النهائي">الإنذار النهائي</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 mr-2">رقم القيد</label>
                    <input type="text" placeholder="مثلاً: 12/ق" value={formData.letterNo} onChange={(e) => setFormData({...formData, letterNo: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-black text-slate-700 mr-2">محتوى الخطاب / الملاحظات</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-bold resize-none"
              placeholder="اكتب أسباب الإجراء أو نص الشكر هنا..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || selectedEmployees.length === 0}
            className="w-full flex items-center justify-center gap-4 py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2.5rem] font-black text-2xl transition-all shadow-2xl active:scale-95 disabled:bg-slate-300"
          >
            <Send size={28} />
            {isSubmitting ? 'جاري الإصدار...' : 'حفظ وإصدار المستند'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdministrativeForm;
