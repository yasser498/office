
import { openDB, IDBPDatabase } from 'idb';
import { Employee, Report } from '../types';

const DB_NAME = 'EmployeeReportsDB';
const DB_VERSION = 2;

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('employees', { keyPath: 'id', autoIncrement: true });
        const reportStore = db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
        reportStore.createIndex('employeeId', 'employeeId');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
};

export const addEmployee = async (employee: Omit<Employee, 'id'>) => {
  const db = await initDB();
  return db.add('employees', employee);
};

export const saveEmployees = async (employees: Omit<Employee, 'id'>[]) => {
  const db = await initDB();
  const tx = db.transaction('employees', 'readwrite');
  const store = tx.objectStore('employees');
  await store.clear();
  for (const emp of employees) {
    await store.add(emp);
  }
  await tx.done;
};

export const updateEmployee = async (employee: Employee) => {
  const db = await initDB();
  return db.put('employees', employee);
};

export const deleteEmployee = async (employeeId: number) => {
  const db = await initDB();
  const tx = db.transaction(['employees', 'reports'], 'readwrite');
  await tx.objectStore('employees').delete(employeeId);
  const reportStore = tx.objectStore('reports');
  const index = reportStore.index('employeeId');
  let cursor = await index.openCursor(IDBKeyRange.only(employeeId));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
};

export const getAllEmployees = async (): Promise<Employee[]> => {
  const db = await initDB();
  return db.getAll('employees');
};

export const addReport = async (report: Report) => {
  const db = await initDB();
  return db.add('reports', report);
};

export const updateReport = async (report: Report) => {
  const db = await initDB();
  return db.put('reports', report);
};

export const deleteReport = async (reportId: number) => {
  const db = await initDB();
  return db.delete('reports', reportId);
};

export const getReportsByEmployee = async (employeeId: number): Promise<Report[]> => {
  const db = await initDB();
  return db.getAllFromIndex('reports', 'employeeId', employeeId);
};

export const getAllReports = async (): Promise<Report[]> => {
  const db = await initDB();
  return db.getAll('reports');
};

export const deleteEmployeeData = async () => {
  const db = await initDB();
  const tx = db.transaction(['employees', 'reports'], 'readwrite');
  await tx.objectStore('employees').clear();
  await tx.objectStore('reports').clear();
  await tx.done;
};

export const setSetting = async (key: string, value: any) => {
  const db = await initDB();
  return db.put('settings', value, key);
};

export const getSetting = async (key: string): Promise<any> => {
  const db = await initDB();
  return db.get('settings', key);
};
