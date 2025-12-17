
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Users, User, ArrowRight, LayoutDashboard, Settings, CheckCircle, Save, School, UserCog, CheckSquare, Square, ClipboardList, BarChart3 } from 'lucide-react';
import { useEmployeeDB } from './hooks/useEmployeeDB';
import FileUpload from './components/FileUpload';
import ReportForm from './components/ReportForm';
import HistoryList from './components/HistoryList';
import DailyLog from './components/DailyLog';
import StatisticsView from './components/StatisticsView';
import { Employee, Report } from './types';
import * as dbUtils from './utils/db';

const App: React.FC = () => {
  const { employees, loading, importEmployees, getReports, saveReport, removeReport, resetData, refresh } = useEmployeeDB();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [employeeReports, setEmployeeReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [viewMode, setViewMode] = useState<'employees' | 'daily_log' | 'statistics'>('employees');
  
  const [tempEmployeeData, setTempEmployeeData] = useState<Employee | null>(null);

  useEffect(() => {
    dbUtils.getSetting('principalName').then(name => { if (name) setPrincipalName(name); }).catch(console.error);
    dbUtils.getSetting('schoolName').then(name => { if (name) setSchoolName(name); }).catch(console.error);
    refreshAllReports();
  }, []);

  const refreshAllReports = async () => {
    try {
      const reports = await dbUtils.getAllReports();
      setAllReports(reports);
    } catch (error) {
      console.error('Error fetching all reports:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await dbUtils.setSetting('principalName', principalName);
      await dbUtils.setSetting('schoolName', schoolName);
      setIsSettingsSaved(true);
      setTimeout(() => setIsSettingsSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('فشل في حفظ الإعدادات');
    }
  };

  const toggleEmployeeSelection = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
    setEditingReport(null);
    setIsEditingEmployee(false);
    setTempEmployeeData(null);
    if (viewMode === 'statistics') setViewMode('employees'); 
  };

  const selectedEmployees = useMemo(() => 
    employees.filter(emp => selectedIds.includes(emp.id)), 
  [employees, selectedIds]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        if (selectedIds.length > 0) {
          const reports = await getReports(selectedIds[0]);
          setEmployeeReports(reports);
        } else {
          setEmployeeReports([]);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
      }
    };
    loadReports();
  }, [selectedIds, getReports]);

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempEmployeeData) {
      try {
        await dbUtils.updateEmployee(tempEmployeeData);
        setIsEditingEmployee(false);
        setTempEmployeeData(null);
        await refresh();
        alert('تم تحديث بيانات الموظف بنجاح');
      } catch (error) {
        console.error('Failed to update employee:', error);
      }
    }
  };

  const handleStartEditing = () => {
    if (selectedEmployees.length === 1) {
      setTempEmployeeData({ ...selectedEmployees[0] });
      setIsEditingEmployee(true);
    }
  };

  const handleSaveReportBatch = async (report: Report, employeeId: number) => {
    try {
      const reportWithSettings = { 
        ...report, 
        employeeId,
        principalName, 
        notes: report.notes
      };
      await saveReport(reportWithSettings);
      await refreshAllReports();
      if (selectedIds.includes(employeeId)) {
        const updatedReports = await getReports(selectedIds[0]);
        setEmployeeReports(updatedReports);
      }
    } catch (error) {
      console.error('Error saving report batch:', error);
      throw error;
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    try {
      await removeReport(reportId);
      await refreshAllReports();
      if (selectedIds.length > 0) {
        const updatedReports = await getReports(selectedIds[0]);
        setEmployeeReports(updatedReports);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setSelectedIds([report.employeeId]);
    setViewMode('employees');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const lowerQuery = searchQuery.toLowerCase();
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(lowerQuery) ||
      emp.civilId?.toLowerCase().includes(lowerQuery) ||
      emp.workplace?.toLowerCase().includes(lowerQuery)
    );
  }, [employees, searchQuery]);

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-indigo-700 text-white shadow-xl mb-8 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-auto lg:h-20 flex flex-col lg:flex-row items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <LayoutDashboard size={28} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">شؤون الموظفين الذكية</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 bg-indigo-800/40 p-2.5 rounded-2xl border border-indigo-400/20 w-full lg:w-auto">
            <div className="flex-1 flex items-center gap-2 bg-indigo-900/40 px-3 py-1.5 rounded-xl border border-indigo-500/30">
              <School size={16} className="text-indigo-300" />
              <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="اسم المدرسة..." className="bg-transparent border-none text-sm outline-none w-full" />
            </div>
            <div className="flex-1 flex items-center gap-2 bg-indigo-900/40 px-3 py-1.5 rounded-xl border border-indigo-500/30">
              <UserCog size={16} className="text-indigo-300" />
              <input type="text" value={principalName} onChange={(e) => setPrincipalName(e.target.value)} placeholder="اسم المدير..." className="bg-transparent border-none text-sm outline-none w-full" />
            </div>
            <button onClick={handleSaveSettings} className={`p-2 rounded-xl transition-all ${isSettingsSaved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
              {isSettingsSaved ? <CheckCircle size={20} /> : <Save size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <FileUpload onDataLoaded={importEmployees} onReset={resetData} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 space-y-4">
            {/* التبويبات الرئيسية */}
            <div className="bg-white p-2 rounded-2xl border border-slate-100 flex flex-col gap-1">
              <button 
                onClick={() => setViewMode('employees')}
                className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all ${viewMode === 'employees' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Users size={18} />
                الموظفون والتقارير
              </button>
              <button 
                onClick={() => setViewMode('daily_log')}
                className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all ${viewMode === 'daily_log' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <ClipboardList size={18} />
                السجل العام والطباعة
              </button>
              <button 
                onClick={() => setViewMode('statistics')}
                className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all ${viewMode === 'statistics' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <BarChart3 size={18} />
                الإحصائيات والتحليل
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 sticky top-24 max-h-[calc(100vh-280px)] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-black text-slate-800 text-lg">
                  <Users size={20} className="text-indigo-600" />
                  قائمة الموظفين
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="بحث بالاسم أو السجل..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar space-y-2 pr-1">
                {loading ? (
                  <div className="py-20 text-center animate-pulse text-slate-400">جاري التحميل...</div>
                ) : filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => toggleEmployeeSelection(emp.id)}
                    className={`w-full text-right p-4 rounded-xl transition-all flex items-center gap-3 border-2 ${
                      selectedIds.includes(emp.id) 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-800 shadow-sm' 
                        : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`${selectedIds.includes(emp.id) ? 'text-indigo-600' : 'text-slate-300'}`}>
                      {selectedIds.includes(emp.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="font-bold text-[15px]">{emp.name}</span>
                      <span className="text-[11px] opacity-70 font-mono tracking-wide">{emp.civilId || 'بدون سجل'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-8 space-y-8 pb-10">
            {viewMode === 'statistics' ? (
              <StatisticsView reports={allReports} employees={employees} />
            ) : viewMode === 'daily_log' ? (
              <DailyLog reports={allReports} employees={employees} onDeleteReport={handleDeleteReport} />
            ) : (
              <>
                {selectedIds.length === 0 ? (
                  <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl border-4 border-dashed border-slate-100 text-slate-300 text-center p-10">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <User size={64} className="opacity-20" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-400">ابدأ باختيار موظف أو أكثر</h2>
                    <p className="mt-2 text-slate-400 max-w-xs">اختر الأسماء من القائمة الجانبية لإجراء الحالات أو عرض التاريخ</p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
                      
                      {selectedEmployees.length === 1 && (
                        <button 
                          onClick={handleStartEditing} 
                          className="absolute left-6 top-6 p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-indigo-100"
                          title="تعديل بيانات الموظف"
                        >
                          <Settings size={22} />
                        </button>
                      )}

                      {isEditingEmployee && tempEmployeeData ? (
                        <form onSubmit={handleUpdateEmployee} className="space-y-5 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">الاسم الكامل</label>
                              <input 
                                type="text" 
                                value={tempEmployeeData.name} 
                                onChange={(e) => setTempEmployeeData({...tempEmployeeData, name: e.target.value})}
                                className="w-full border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-400 outline-none" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">السجل المدني</label>
                              <input 
                                type="text" 
                                value={tempEmployeeData.civilId || ''} 
                                onChange={(e) => setTempEmployeeData({...tempEmployeeData, civilId: e.target.value})}
                                className="w-full border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-400 outline-none" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">التخصص</label>
                              <input 
                                type="text" 
                                value={tempEmployeeData.specialization || ''} 
                                onChange={(e) => setTempEmployeeData({...tempEmployeeData, specialization: e.target.value})}
                                className="w-full border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-400 outline-none" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">رقم الوظيفة</label>
                              <input 
                                type="text" 
                                value={tempEmployeeData.employeeCode || ''} 
                                onChange={(e) => setTempEmployeeData({...tempEmployeeData, employeeCode: e.target.value})}
                                className="w-full border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-400 outline-none" 
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg">حفظ التعديلات</button>
                            <button type="button" onClick={() => { setIsEditingEmployee(false); setTempEmployeeData(null); }} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold">إلغاء</button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                               <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                                {selectedEmployees.length}
                               </div>
                               <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                {selectedEmployees.length === 1 ? selectedEmployees[0].name : 'إجراء جماعي للمجموعة مختارة'}
                               </h2>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-3">
                              {selectedEmployees.length === 1 ? (
                                <>
                                  <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-sm font-bold">تخصص: {selectedEmployees[0].specialization || '---'}</span>
                                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-sm font-bold border border-indigo-100">السجل: {selectedEmployees[0].civilId}</span>
                                </>
                              ) : (
                                <p className="text-slate-500 font-bold">سيتم تطبيق التقرير على {selectedEmployees.length} أسماء مختارة.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <ReportForm selectedEmployees={selectedEmployees} onSave={handleSaveReportBatch} editingReport={editingReport} onCancelEdit={() => setEditingReport(null)} />
                    <HistoryList reports={employeeReports} selectedEmployee={selectedEmployees[0]} onDeleteReport={handleDeleteReport} onEditReport={handleEditReport} />
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;
