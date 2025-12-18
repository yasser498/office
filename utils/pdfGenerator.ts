
import { Employee, Report } from '../types';
import * as dbUtils from './db';

const MINISTRY_LOGO_URL = 'https://www.raed.net/img?id=1486401';

const getArabicDayName = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(date);
  } catch (e) {
    return '..........';
  }
};

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const printContent = (htmlContent: string) => {
  const oldFrame = document.getElementById('print-iframe');
  if (oldFrame) document.body.removeChild(oldFrame);

  const iframe = document.createElement('iframe');
  iframe.id = 'print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '100%';
  iframe.style.bottom = '100%';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    const isMobile = isMobileDevice();
    const scaleStyle = isMobile ? 'body { zoom: 75%; }' : '';
    const injectedHTML = htmlContent.replace('</head>', `
      <style>${scaleStyle}</style>
      </head>
    `).replace('</body>', `
      <script>
        window.onload = function() {
          const images = document.getElementsByTagName('img');
          let loadedCount = 0;
          if (images.length === 0) { startPrint(); } else {
            for (let img of images) {
              if (img.complete) { loadedCount++; if (loadedCount === images.length) startPrint(); } 
              else { img.onload = () => { loadedCount++; if (loadedCount === images.length) startPrint(); };
                     img.onerror = () => { loadedCount++; if (loadedCount === images.length) startPrint(); }; }
            }
          }
          function startPrint() { setTimeout(() => { window.focus(); window.print(); }, 300); }
        };
      </script>
    </body>`);
    doc.write(injectedHTML);
    doc.close();
  }
};

const getCommonStyles = () => `
  @page { size: A4; margin: 0.5cm 1cm 1cm 1cm; }
  body { 
    font-family: 'Cairo', sans-serif; 
    margin: 0; padding: 0; color: #000; 
    -webkit-print-color-adjust: exact; 
    font-size: 9pt; width: 100%;
    line-height: 1.3;
    direction: rtl;
  }
  .page-container { 
    width: 100%; 
    display: flex; flex-direction: column; 
    position: relative; box-sizing: border-box; 
    background: white;
    page-break-after: always;
    padding: 10px;
  }
  .page-container:last-child { page-break-after: auto; }
  
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; width: 100%; height: 95px; }
  .header-info { flex: 1; font-size: 9pt; font-weight: 700; line-height: 1.3; text-align: right; }
  .logo-container { flex: 1; text-align: center; }
  .logo-container img { max-width: 90px; height: auto; }
  .header-left { flex: 1; text-align: left; font-weight: 700; font-size: 9pt; }

  .title-section { text-align: center; margin-bottom: 12px; width: 100%; }
  .title-section h1 { 
    font-size: 13pt; margin: 0; font-weight: 900; 
    border: 2px solid black; display: inline-block; padding: 5px 25px;
    background: #f8f9fa;
  }
  .title-section p { font-size: 8pt; margin: 5px 0 0 0; font-weight: 700; }

  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1.5px solid black; }
  .data-table th, .data-table td { border: 1px solid black; padding: 6px; text-align: center; }
  .data-table td { font-size: 9pt; font-weight: 700; }
  .data-table th { background: #336655; color: white; font-weight: 900; font-size: 10pt; }
  
  .civil-id-label { background: #336655; color: white; padding: 4px 10px; font-weight: 900; border: 1.5px solid black; border-left: none; }
  .civil-id-box { display: flex; direction: ltr; border: 1.5px solid black; padding: 2px; background: #eee; }
  .digit { width: 22px; height: 22px; border: 1px solid black; display: flex; align-items: center; justify-content: center; font-weight: 900; margin: 0 1px; background: white; font-size: 10pt; }

  .signature-row { display: flex; justify-content: space-between; margin: 10px 0; font-weight: 900; font-size: 10pt; align-items: center; }
  .divider { border-top: 1.5px solid #000; margin: 10px 0; }
  .section-label { font-weight: 900; color: #000; text-decoration: underline; margin-bottom: 5px; font-size: 11pt; }
  .dynamic-data { font-weight: 900; border-bottom: 1px solid black; padding: 0 5px; }
  
  .notes-box { border: 1px dashed #444; padding: 8px; margin: 8px 0; font-size: 8pt; background: #fffcf0; }
  .certificate-border { border: 15px double #336655; padding: 40px; text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; background: #fff; }
`;

const gt = (gender: 'boys' | 'girls', masc: string, fem: string) => gender === 'boys' ? masc : fem;

const getOfficialHeaderHTML = (schoolName: string, educationDept: string, date: string, title: string, code: string) => `
  <div class="header">
    <div class="header-info">
      <div>المملكة العربية السعودية</div>
      <div>وزارة التعليم</div>
      <div>${educationDept}</div>
      <div>${schoolName}</div>
    </div>
    <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
    <div class="header-left">التاريخ: ${date} هـ</div>
  </div>
  <div class="title-section">
    <h1>${title}</h1>
    <p>رمز النموذج : ${code}</p>
  </div>
`;

const getEmployeeOfficialTableHTML = (employee: Employee) => {
  const civilId = String(employee.civilId || '').padStart(10, ' ').slice(-10);
  const civilIdHtml = civilId.split('').map(num => `<div class="digit">${num.trim() || '&nbsp;'}</div>`).join('');

  return `
    <div style="display: flex; align-items: center; margin-bottom: 10px;">
       <div class="civil-id-label">السجل المدني</div>
       <div class="civil-id-box">${civilIdHtml}</div>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 35%;">الاسم</th>
          <th>التخصص</th>
          <th>رقم الوظيفة</th>
          <th>العمل الحالي</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${employee.name}</td>
          <td>${employee.specialization || '---'}</td>
          <td>${employee.employeeCode || '---'}</td>
          <td>${employee.workplace || '---'}</td>
        </tr>
      </tbody>
    </table>
  `;
};

// 1. إذن خروج (20-01) المطور
const getExitPermitOfficialHTML = (employee: Employee, report: Report, schoolName: string, principalName: string, educationDept: string, gender: 'boys' | 'girls') => `
  <div class="page-container">
    ${getOfficialHeaderHTML(schoolName, educationDept, report.date, 'بطاقة خروج موظف أثناء الدوام الرسمي', '( و . م . ع . ن - 20 - 01 )')}
    ${getEmployeeOfficialTableHTML(employee)}
    <div style="border: 1.5px solid black; padding: 15px; margin-top: 10px;">
      <div style="margin-bottom: 15px; font-weight: 900;">
        ${gt(gender, 'سعادة مدير المدرسة /', 'سعادة مديرة المدرسة /')} <span class="dynamic-data">${principalName}</span> المحترم/ة
      </div>
      <p style="font-weight: 700; line-height: 2;">
        أرجو التكرم بالموافقة لي بالخروج من المدرسة لظرف طارئ في يوم <span class="dynamic-data">${getArabicDayName(report.date)}</span> 
        من الساعة ( <span class="dynamic-data">${report.lateArrivalTime || '........'}</span> ) إلى الساعة ( <span class="dynamic-data">${report.earlyDepartureTime || '........'}</span> ).
      </p>
      ${report.notes ? `<div style="margin: 10px 0; font-weight: 700;">السبب: <span class="dynamic-data">${report.notes}</span></div>` : ''}
      <div class="signature-row" style="margin-top: 25px;">
        <span>الاسم: <span class="dynamic-data">${employee.name}</span></span>
        <span>التوقيع: ...........................</span>
        <span>التاريخ: ${report.date} هـ</span>
      </div>
    </div>
    <div style="border: 1.5px solid black; border-top: none; padding: 15px; background: #f9f9f9;">
      <div class="section-label">مرئيات الإدارة:</div>
      <div style="margin: 10px 0; font-weight: 900;">( &nbsp;&nbsp; ) يوافق له/ا &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp; ) لا يوافق له/ا</div>
      <div class="signature-row">
        <span>${gt(gender, 'مدير المدرسة', 'مديرة المدرسة')}: <span class="dynamic-data">${principalName}</span></span>
        <span>التوقيع: ...........................</span>
        <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144 هـ</span>
      </div>
    </div>
  </div>
`;

// 2. خطاب إنذار رسمي المطور
const getWarningOfficialHTML = (employee: Employee, report: Report, schoolName: string, principalName: string, educationDept: string, gender: 'boys' | 'girls') => `
  <div class="page-container">
    ${getOfficialHeaderHTML(schoolName, educationDept, report.date, `خطاب إنذار (${report.warningLevel})`, '( و . م . ع . ن - 01 - 05 )')}
    ${getEmployeeOfficialTableHTML(employee)}
    <div style="margin-top: 20px;">
      <p style="font-weight: 900;">${gt(gender, 'المكرم الأستاذ:', 'المكرمة الأستاذة:')} <span class="dynamic-data">${employee.name}</span> المحترم/ة</p>
      <p style="font-weight: 900; margin: 10px 0;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد:</p>
      <div style="text-align: justify; font-weight: 700; line-height: 2; margin-bottom: 20px;">
        نظراً لملاحظة تكرار مخالفة الأنظمة والتعليمات الخاصة بالانضباط المدرسي، وتحديداً ما ورد في سجلاتنا بتاريخ <span class="dynamic-data">${report.date} هـ</span>، 
        وحيث أن مصلحة العمل تقتضي الالتزام التام بالدوام الرسمي، فقد تقرر توجيه هذا الإنذار ( <span class="dynamic-data">${report.warningLevel}</span> ) برقم قيد ( <span class="dynamic-data">${report.letterNo || '---'}</span> ).
        نأمل منكم التقيد بالتعليمات مستقبلاً لتلافي اتخاذ إجراءات نظامية أشد وفقاً للأنظمة واللوائح.
      </div>
      ${report.notes ? `<div class="notes-box"><b>ملاحظات إضافية:</b> ${report.notes}</div>` : ''}
      <p style="text-align: center; font-weight: 900; margin-top: 30px;">ولكم تحياتنا ،،،</p>
      <div class="signature-row" style="margin-top: 40px;">
        <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')} <span class="dynamic-data">${principalName}</span></span>
        <span>التوقيع: .........................</span>
        <span>التاريخ: ${report.date} هـ</span>
      </div>
    </div>
  </div>
`;

// 3. شهادة شكر وتقدير المطور
const getAppreciationOfficialHTML = (employee: Employee, report: Report, schoolName: string, principalName: string, educationDept: string, gender: 'boys' | 'girls') => `
  <div class="page-container">
    <div class="certificate-border">
       <div class="header" style="height: auto; margin-bottom: 30px;">
        <div class="header-info"><div>المملكة العربية السعودية</div><div>وزارة التعليم</div><div>${educationDept}</div><div>${schoolName}</div></div>
        <div class="logo-container"><img src="${MINISTRY_LOGO_URL}" style="max-width: 120px;"></div>
        <div class="header-left">التاريخ: ${report.date} هـ</div>
      </div>
      <h1 style="font-size: 28pt; font-weight: 900; color: #336655; margin-bottom: 30px;">شهادة شكر وتقدير</h1>
      <p style="font-size: 14pt; font-weight: 700; line-height: 2;">
        يسر إدارة <span class="dynamic-data">${schoolName}</span> أن تتقدم بجزيل الشكر والعرفان
        <br>
        ${gt(gender, 'للأستاذ /', 'للأستاذة /')}
        <br>
        <span style="font-size: 20pt; font-weight: 900; border-bottom: 2px solid #336655; padding: 0 40px;">${employee.name}</span>
        <br>
        وذلك نظير انضباطه وتميزه في الأداء الوظيفي،
        <br>
        سائلين المولى عز وجل له دوام التوفيق والسداد.
      </p>
      <div class="signature-row" style="margin-top: 60px; justify-content: center; gap: 100px;">
        <div style="text-align: center;">
          <div style="font-weight: 900; font-size: 12pt;">${gt(gender, 'مدير المدرسة', 'مديرة المدرسة')}</div>
          <div style="margin-top: 10px; font-weight: 900;">${principalName}</div>
        </div>
      </div>
    </div>
  </div>
`;

// 4. سجل حصر التأخر التراكمي المطور
const getCumulativeLateOfficialHTML = (employee: Employee, reports: Report[], schoolName: string, principalName: string, educationDept: string, gender: 'boys' | 'girls') => {
  const lateReports = reports.filter(r => r.type === 'تأخر_انصراف');
  const rows = lateReports.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${getArabicDayName(r.date)}</td>
      <td>${r.date}</td>
      <td>${r.lateArrivalTime || '--'}</td>
      <td>${r.earlyDepartureTime || '--'}</td>
      <td>${r.notes || '---'}</td>
    </tr>
  `).join('');

  return `
    <div class="page-container">
      ${getOfficialHeaderHTML(schoolName, educationDept, new Date().toLocaleDateString('ar-SA'), 'سجل حصر التأخر التراكمي للموظف', '( و . م . ع . ن - 20 - 05 )')}
      ${getEmployeeOfficialTableHTML(employee)}
      <div style="margin-top: 15px;">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px;">م</th>
              <th>اليوم</th>
              <th>التاريخ</th>
              <th>وقت الحضور</th>
              <th>وقت الانصراف</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6" style="padding:20px;">لا توجد سجلات تأخر مسجلة لهذا الموظف</td></tr>'}
          </tbody>
        </table>
        <div style="margin-top: 20px; font-weight: 700;">
          إجمالي عدد حالات التأخر المحصورة في سجل الدوام: <span class="dynamic-data">${lateReports.length}</span> حالة.
        </div>
        <div class="signature-row" style="margin-top: 40px;">
          <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')} <span class="dynamic-data">${principalName}</span></span>
          <span>التوقيع: .........................</span>
        </div>
      </div>
    </div>
  `;
};

// الدوال العامة للطباعة
export const generateExitPermit = async (employee: Employee, report: Report) => {
  const settings = {
    schoolName: await dbUtils.getSetting('schoolName') || '..........',
    educationDept: await dbUtils.getSetting('educationDept') || '..........',
    principalName: await dbUtils.getSetting('principalName') || '..........',
    gender: await dbUtils.getSetting('schoolGender') || 'boys'
  };
  const html = getExitPermitOfficialHTML(employee, report, settings.schoolName, settings.principalName, settings.educationDept, settings.gender);
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateWarningLetter = async (employee: Employee, report: Report) => {
  const settings = {
    schoolName: await dbUtils.getSetting('schoolName') || '..........',
    educationDept: await dbUtils.getSetting('educationDept') || '..........',
    principalName: await dbUtils.getSetting('principalName') || '..........',
    gender: await dbUtils.getSetting('schoolGender') || 'boys'
  };
  const html = getWarningOfficialHTML(employee, report, settings.schoolName, settings.principalName, settings.educationDept, settings.gender);
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateAppreciationCertificate = async (employee: Employee, report: Report) => {
  const settings = {
    schoolName: await dbUtils.getSetting('schoolName') || '..........',
    educationDept: await dbUtils.getSetting('educationDept') || '..........',
    principalName: await dbUtils.getSetting('principalName') || '..........',
    gender: await dbUtils.getSetting('schoolGender') || 'boys'
  };
  const html = getAppreciationOfficialHTML(employee, report, settings.schoolName, settings.principalName, settings.educationDept, settings.gender);
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateLateCumulativeLog = async (employee: Employee, reports: Report[]) => {
  const settings = {
    schoolName: await dbUtils.getSetting('schoolName') || '..........',
    educationDept: await dbUtils.getSetting('educationDept') || '..........',
    principalName: await dbUtils.getSetting('principalName') || '..........',
    gender: await dbUtils.getSetting('schoolGender') || 'boys'
  };
  const html = getCumulativeLateOfficialHTML(employee, reports, settings.schoolName, settings.principalName, settings.educationDept, settings.gender);
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateOfficialAbsenceForm = async (employee: Employee, report: Report) => {
    const principalName = await dbUtils.getSetting('principalName') || '..........';
    const schoolName = await dbUtils.getSetting('schoolName') || '..........';
    const educationDept = await dbUtils.getSetting('educationDept') || '..........';
    const gender = await dbUtils.getSetting('schoolGender') || 'boys';
    const dayName = getArabicDayName(report.date);
    const endDayName = getArabicDayName(report.endDate || report.date);

    const html = `
      <div class="page-container">
          ${getOfficialHeaderHTML(schoolName, educationDept, report.date, 'مساءلة غياب', '( و . م . ع . ن - 01 - 04 )')}
          ${getEmployeeOfficialTableHTML(employee)}
          <div style="background: #f2f2f2; border: 1.5px solid #000; padding: 10px; text-align: center; font-weight: 900; margin-bottom: 12px;">
            إنه في يوم (<span class="dynamic-data">${dayName}</span>) بتاريخ (<span class="dynamic-data">${report.date} هـ</span>) 
            ${gt(gender, 'تغيب', 'تغيبت')} عن العمل إلى يوم (<span class="dynamic-data">${endDayName}</span>) الموافق (<span class="dynamic-data">${report.endDate || report.date} هـ</span>)
          </div>
          <div style="border: 1px solid #000; padding: 12px; margin-bottom: 10px;">
            <div class="section-label small-text-7">(1) طلب الإفادة :</div>
            <p class="small-text-7" style="font-weight: 700;">من خلال متابعة سجل الدوام تبين غيابكم خلال الفترة الموضحة أعلاه ، نأمل الإفادة عن أسباب ذلك.</p>
            <div class="signature-row small-text-7">
              <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')} <span class="dynamic-data">${principalName}</span></span>
              <span>التوقيع: .........................</span>
            </div>
          </div>
          <div style="border: 1px solid #000; padding: 12px; margin-bottom: 10px;">
            <div class="section-label small-text-7">(2) الإفادة :</div>
            <p class="small-text-7" style="margin: 5px 0; font-weight: 700;">أفيدكم أن غيابي كان للأسباب التالية :</p>
            <div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 8px;"></div>
            <div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 10px;"></div>
            <div class="signature-row small-text-7"><span>الاسم: <span class="dynamic-data">${employee.name}</span></span><span>التوقيع: .................</span></div>
          </div>
          <div style="border: 2px solid #000; padding: 12px; background: #fafafa;">
            <div class="section-label small-text-7">(3) قرار ${gt(gender, 'مدير المدرسة :', 'مديرة المدرسة :')}</div>
            <div class="checkbox-list small-text-7">
              <div class="checkbox-item"><span class="checkbox-square"></span> تحتسب له إجازة مرضية.</div>
              <div class="checkbox-item"><span class="checkbox-square"></span> تحتسب له إجازة وفاة.</div>
              <div class="checkbox-item"><span class="checkbox-square"></span> تحتسب له إجازة مرافقة.</div>
              <div class="checkbox-item"><span class="checkbox-square"></span> يحتسب غيابه من رصيد الإجازات الاضطرارية.</div>
              <div class="checkbox-item"><span class="checkbox-square"></span> يعتمد الحسم لعدم قبول العذر.</div>
            </div>
          </div>
      </div>`;
    printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateLateArrivalDepartureForm = async (employee: Employee, report: Report) => {
    const principalName = await dbUtils.getSetting('principalName') || '..........';
    const schoolName = await dbUtils.getSetting('schoolName') || '..........';
    const educationDept = await dbUtils.getSetting('educationDept') || '..........';
    const gender = await dbUtils.getSetting('schoolGender') || 'boys';
    const dayName = getArabicDayName(report.date);

    const html = `
      <div class="page-container">
          ${getOfficialHeaderHTML(schoolName, educationDept, report.date, 'نموذج تنبيه على تأخر / انصراف', '( و . م . ع . ن - 20 - 02 )')}
          ${getEmployeeOfficialTableHTML(employee)}
          <div style="margin-top: 10px;">
            <p style="font-weight: 700; line-height: 1.6;">إنه في يوم: <span class="dynamic-data">${dayName}</span>، بتاريخ: <span class="dynamic-data">${report.date} هـ</span>، اتضح لنا ما يلي:</p>
            <div style="margin-right: 20px; margin-top: 8px;">
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;"><span style="width:14px; height:14px; border:1px solid #000; text-align:center; line-height:12px;">${report.lateArrivalTime ? '✓' : ''}</span> <span style="font-weight: 900;">تأخركم وحضوركم الساعة ( <span class="dynamic-data">${report.lateArrivalTime || '.......'}</span> )</span></div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;"><span style="width:14px; height:14px; border:1px solid #000; text-align:center; line-height:12px;">${report.earlyDepartureTime ? '✓' : ''}</span> <span style="font-weight: 900;">انصرافكم مبكراً الساعة ( <span class="dynamic-data">${report.earlyDepartureTime || '.......'}</span> )</span></div>
            </div>
            ${report.notes ? `<div class="notes-box"><b>الأسباب:</b> ${report.notes}</div>` : ''}
            <p style="margin-top: 10px; font-weight: 700;">نأمل توضيح أسباب ذلك خلال أسبوع من تاريخه.</p>
            <div class="signature-row" style="margin-top: 20px;">
              <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')} <span class="dynamic-data">${principalName}</span></span>
              <span>التوقيع: ..........................</span>
            </div>
          </div>
          <div class="divider"></div>
          <div><div class="section-label">إفادة الموظف/ة:</div><div style="border-bottom: 1px dotted black; height: 35px; margin-bottom: 10px;"></div><div class="signature-row"><span>الاسم: <span class="dynamic-data">${employee.name}</span></span><span>التوقيع: .................</span></div></div>
      </div>`;
    printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateBatchForms = async (batch: { employee: Employee, report: Report }[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const educationDept = await dbUtils.getSetting('educationDept') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';
  
  const formsHTML = batch.map((item) => {
    switch(item.report.type) {
      case 'غياب': return getOfficialAbsenceFormHTML_Batch(item.employee, item.report, schoolName, principalName, educationDept, gender);
      case 'تأخر_انصراف': return getLateArrivalOfficialHTML_Batch(item.employee, item.report, schoolName, principalName, educationDept, gender);
      case 'إذن_خروج': return getExitPermitOfficialHTML(item.employee, item.report, schoolName, principalName, educationDept, gender);
      case 'خطاب_إنذار': return getWarningOfficialHTML(item.employee, item.report, schoolName, principalName, educationDept, gender);
      case 'شكر_وتقدير': return getAppreciationOfficialHTML(item.employee, item.report, schoolName, principalName, educationDept, gender);
      default: return '';
    }
  }).join('');
  
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${formsHTML}</body></html>`);
};

function getOfficialAbsenceFormHTML_Batch(employee: Employee, report: Report, schoolName: string, principalName: string, educationDept: string, gender: 'boys' | 'girls') {
   return `<div class="page-container">${getOfficialHeaderHTML(schoolName, educationDept, report.date, 'مساءلة غياب', '( و . م . ع . ن - 01 - 04 )')}${getEmployeeOfficialTableHTML(employee)}<div style="padding:20px; border:1px solid #000; margin-top:10px; font-weight:700;">بيان غياب مسجل بتاريخ ${report.date} هـ للموظف الموضح أعلاه.</div></div>`;
}
function getLateArrivalOfficialHTML_Batch(employee: Employee, report: Report, schoolName: string, principalName: string, educationDept: string, gender: 'boys' | 'girls') {
   return `<div class="page-container">${getOfficialHeaderHTML(schoolName, educationDept, report.date, 'تنبيه تأخر', '( و . م . ع . ن - 20 - 02 )')}${getEmployeeOfficialTableHTML(employee)}<div style="padding:20px; border:1px solid #000; margin-top:10px; font-weight:700;">بيان تأخر مسجل بتاريخ ${report.date} هـ للموظف الموضح أعلاه.</div></div>`;
}

export const generateAcknowledgmentLog = async (employees: Employee[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const educationDept = await dbUtils.getSetting('educationDept') || '..........';
  const rows = employees.map((emp, idx) => `<tr><td>${idx+1}</td><td style="text-align:right;">${emp.name}</td><td>${emp.employeeCode}</td><td></td></tr>`).join('');
  const html = `<div class="page-container">${getOfficialHeaderHTML(schoolName, educationDept, '', 'بيان التوقيع بالعلم', '---')}<table class="data-table"><thead><tr><th>م</th><th>الاسم</th><th>رقم الوظيفة</th><th>التوقيع</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateStatisticsPDF = async (stats: any, schoolName: string, principalName: string) => {
  const educationDept = await dbUtils.getSetting('educationDept') || '..........';
  const html = `<div class="page-container">${getOfficialHeaderHTML(schoolName, educationDept, '', 'التقرير الإحصائي العام', '---')}<h1>ملخص الإحصائيات</h1><p>إجمالي التقارير: ${stats.totalReports}</p></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateEmployeePDF = async (employee: Employee, reports: Report[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const educationDept = await dbUtils.getSetting('educationDept') || '..........';
  const html = `<div class="page-container">${getOfficialHeaderHTML(schoolName, educationDept, '', 'سجل متابعة الموظف', '---')}${getEmployeeOfficialTableHTML(employee)}<p>عدد السجلات: ${reports.length}</p></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};
