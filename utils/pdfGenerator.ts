
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
  @page { 
    size: A4; 
    margin: 0.5cm 1cm 1cm 1cm; 
  }
  body { 
    font-family: 'Cairo', sans-serif; 
    margin: 0; padding: 0; color: #000; 
    -webkit-print-color-adjust: exact; 
    font-size: 9pt; width: 100%;
    line-height: 1.3;
  }
  .page-container { 
    width: 100%; 
    display: flex; flex-direction: column; 
    position: relative; box-sizing: border-box; 
    background: white;
    page-break-after: always;
  }
  .page-container:last-child { page-break-after: auto; }
  
  .header { 
    display: flex; justify-content: space-between; 
    align-items: center; margin-bottom: 8px; 
    width: 100%; height: 80px;
  }
  .header-info { flex: 1; font-size: 9pt; font-weight: 700; line-height: 1.4; text-align: right; }
  .logo-container { flex: 1; text-align: center; }
  .logo-container img { max-width: 90px; height: auto; }
  .header-left { flex: 1; text-align: left; font-weight: 700; font-size: 9pt; }

  .title-section { text-align: center; margin-bottom: 8px; width: 100%; }
  .title-section h1 { 
    font-size: 11pt; margin: 0; font-weight: 900; 
    border-bottom: 2.5px solid black; display: inline-block; padding-bottom: 2px; 
  }
  .title-section p { font-size: 8pt; margin: 2px 0 0 0; font-weight: 700; }

  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1.5px solid black; }
  .data-table th, .data-table td { border: 1px solid black; padding: 4px; text-align: center; }
  .data-table td { font-size: 9pt; font-weight: 700; }
  .data-table th { background: #336655; color: white; font-weight: 900; font-size: 11pt; }
  
  .civil-id-box { display: flex; direction: ltr; margin-right: 5px; }
  .digit { width: 18px; height: 18px; border: 1px solid black; display: flex; align-items: center; justify-content: center; font-weight: 900; margin: 0 1px; background: white; font-size: 9pt; }

  .signature-row { display: flex; justify-content: space-between; margin: 6px 0; font-weight: 900; font-size: 9pt; }
  .divider { border-top: 1.5px solid #000; margin: 8px 0; }
  .section-label { font-weight: 900; color: #336655; text-decoration: underline; margin-bottom: 2px; font-size: 11pt; }
  .dynamic-data { font-weight: 900; color: #000; }
  .notes-box { border: 1px dashed #444; padding: 4px; margin: 4px 0; font-size: 9pt; background: #fffcf0; }
`;

const gt = (gender: 'boys' | 'girls', masc: string, fem: string) => gender === 'boys' ? masc : fem;

// 1. نموذج إذن الخروج الاستثنائي (20-01) مع المدخلات
export const generateExitPermit = async (employee: Employee, startTime?: string, endTime?: string, reason?: string) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const html = `
    <div class="page-container" style="padding: 20px;">
        <div class="header">
          <div class="header-info">
            <div>المملكة العربية السعودية</div>
            <div>وزارة التعليم</div>
            <div>${schoolName}</div>
          </div>
          <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
          <div class="header-left">التاريخ: ${currentDate}</div>
        </div>

        <div class="title-section">
          <h1>بطاقة خروج موظف أثناء الدوام الرسمي</h1>
          <p>رمز النموذج : ( و . م . ع . ن - 20 - 01 )</p>
        </div>

        <div style="border: 1.5px solid black; padding: 15px; margin-top: 10px;">
          <div style="margin-bottom: 15px; font-weight: 900;">
            ${gt(gender, 'سعادة مدير المدرسة /', 'سعادة مديرة المدرسة /')} <span class="dynamic-data">${principalName}</span> المحترم/ة
          </div>
          <p style="font-weight: 700; text-indent: 30px; line-height: 2;">
            أرجو التكرم بالموافقة لي بالخروج من المدرسة لظرف طارئ في يوم <span class="dynamic-data">${getArabicDayName(new Date().toISOString())}</span> 
            الموافق <span class="dynamic-data">${currentDate}</span> من الساعة ( <span class="dynamic-data">${startTime || '........'}</span> ) 
            إلى الساعة ( <span class="dynamic-data">${endTime || '........'}</span> ).
          </p>
          ${reason ? `<div style="margin: 10px 0; font-weight: 700;">بسبب: <span class="dynamic-data">${reason}</span></div>` : '<div style="margin: 15px 0; height: 20px;"></div>'}
          
          <div class="signature-row" style="margin-top: 30px;">
            <span>الاسم: <span class="dynamic-data">${employee.name}</span></span>
            <span>التوقيع: ...........................</span>
          </div>
        </div>

        <div style="border: 1.5px solid black; border-top: none; padding: 15px; background: #f9f9f9;">
          <div class="section-label" style="color: black;">مرئيات الإدارة:</div>
          <div style="margin: 15px 0; font-weight: 900; font-size: 11pt;">
            ( &nbsp;&nbsp; ) يوافق له/ا &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp; ) لا يوافق له/ا
          </div>
          <div class="signature-row" style="margin-top: 30px;">
            <span>${gt(gender, 'مدير المدرسة', 'مديرة المدرسة')}: <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: ...........................</span>
          </div>
        </div>
        
        <div style="margin-top: 15px; font-size: 9pt; font-weight: 700; color: #666; border-right: 4px solid #336655; padding-right: 10px;">
          * ملاحظة هامة: يجب العودة والتوقيع في سجل الاستئذان بالمدرسة فور العودة لمباشرة العمل.
        </div>
    </div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

// 2. خطاب إنذار رسمي مع مدخلات
export const generateWarningLetter = async (employee: Employee, warningLevel: string, letterNo?: string) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const html = `
    <div class="page-container" style="padding: 40px; border: 1px solid #eee;">
      <div class="header">
        <div class="header-info">
          <div>المملكة العربية السعودية</div>
          <div>وزارة التعليم</div>
          <div>${schoolName}</div>
        </div>
        <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
        <div class="header-left">
          الرقم: ${letterNo || '............'}<br>
          التاريخ: ${currentDate}
        </div>
      </div>

      <div class="title-section" style="margin: 40px 0;">
        <h1 style="font-size: 16pt; padding: 5px 20px;">خطاب إنذار (${warningLevel})</h1>
      </div>

      <div style="font-weight: 900; font-size: 12pt; margin-bottom: 20px;">
        ${gt(gender, 'المكرم الأستاذ /', 'المكرمة الأستاذة /')} <span class="dynamic-data">${employee.name}</span> المحترم/ة
      </div>

      <p style="font-size: 12pt; font-weight: 700; line-height: 2; text-align: justify;">
        السلام عليكم ورحمة الله وبركاته ،، وبعد :<br>
        نظراً لما لوحظ عليكم من ${warningLevel === 'الأول' ? 'تكرار الغياب / التأخر' : 'عدم الالتزام بالأنظمة رغم الإنذارات السابقة'}، 
        وحيث أن ذلك يؤثر سلباً على سير العملية التعليمية ومصلحة الطلاب، لذا فقد جرى إنذاركم ${warningLevel} 
        للالتزام بالدوام الرسمي والتقيد بالتعليمات المنظمة لذلك.
      </p>

      <p style="font-size: 12pt; font-weight: 900; margin: 30px 0; color: #c00;">
        ونأمل منكم عدم تكرار ذلك مستقبلاً حتى لا تضطر الإدارة لاتخاذ إجراءات نظامية أخرى بحقكم.
      </p>

      <div style="margin-top: 60px; display: flex; justify-content: flex-end;">
        <div style="text-align: center; min-width: 250px;">
          <p style="font-weight: 900; font-size: 12pt;">${gt(gender, 'مدير المدرسة', 'مديرة المدرسة')}</p><br>
          <p style="font-weight: 900; font-size: 13pt;">${principalName}</p>
          <p>...........................</p>
        </div>
      </div>

      <div style="margin-top: 50px; border-top: 1px solid #000; padding-top: 10px;">
        <p style="font-weight: 900;">إقرار باستلام الإنذار:</p>
        <p style="font-weight: 700;">أقر أنا / .................................................... باستلامي لهذا الإنذار والتعهد بالالتزام.</p>
        <div class="signature-row" style="margin-top: 20px;">
          <span>التوقيع: ...........................</span>
          <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144</span>
        </div>
      </div>
    </div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

// سجل حصر ساعات التأخر التراكمي
export const generateLateCumulativeLog = async (employee: Employee, reports: Report[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const lateReports = reports.filter(r => r.type === 'تأخر_انصراف');
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const rows = lateReports.map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${r.date}</td>
      <td>${r.lateArrivalTime || '---'}</td>
      <td>${r.earlyDepartureTime || '---'}</td>
      <td style="font-weight: 900;">........ دقائق</td>
    </tr>
  `).join('');

  const html = `
    <div class="page-container">
      <div class="header">
        <div class="header-info"><div>وزارة التعليم</div><div>${schoolName}</div></div>
        <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
        <div class="header-left">التاريخ: ${currentDate}</div>
      </div>
      <div class="title-section">
        <h1>سجل حصر تأخر وانصراف الموظف (تراكمي)</h1>
      </div>
      <div style="margin-bottom: 10px; font-weight: 900;">اسم الموظف: <span class="dynamic-data">${employee.name}</span></div>
      <table class="data-table">
        <thead>
          <tr>
            <th>م</th>
            <th>التاريخ</th>
            <th>وقت الحضور</th>
            <th>وقت الانصراف</th>
            <th>مقدار التأخر</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr style="background: #eee;">
            <td colspan="4" style="text-align: left; padding-left: 20px;">الإجمالي التراكمي</td>
            <td style="font-weight: 900; color: #c00;">........ ساعة / دقيقة</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 20px; font-weight: 700; text-align: justify; line-height: 1.6;">
        بناءً على المادة (........) من نظام الخدمة المدنية، فإنه يتم حسم يوم كامل عند بلوغ مجموع ساعات التأخر (7) ساعات.
      </div>
      <div class="signature-row" style="margin-top: 40px;">
        <div style="text-align: center;"><span>وكيل الشؤون المدرسية</span><br><br><span>...........................</span></div>
        <div style="text-align: center;"><span>مدير المدرسة</span><br><span>${principalName}</span><br><span>...........................</span></div>
      </div>
    </div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

// بيان التوقيع بالعلم لجميع الموظفين
export const generateAcknowledgmentLog = async (employees: Employee[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const currentDate = new Date().toLocaleDateString('ar-SA');
  
  const rows = employees.map((emp, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td style="text-align: right;">${emp.name}</td>
      <td>${emp.employeeCode || '---'}</td>
      <td style="width: 150px;"></td>
    </tr>
  `).join('');

  const html = `
    <div class="page-container">
      <div class="header">
        <div class="header-info"><div>وزارة التعليم</div><div>${schoolName}</div></div>
        <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
        <div class="header-left">التاريخ: ${currentDate}</div>
      </div>
      <div class="title-section">
        <h1>بيان توقيع منسوبي المدرسة بالعلم على الأنظمة</h1>
        <p>الموضوع: (تعليمات الدوام الرسمي والالتزام بالانضباط)</p>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px;">م</th>
            <th>اسم الموظف</th>
            <th>رقم الوظيفة</th>
            <th>التوقيع بالعلم</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

// شهادة شكر وتقدير للمتميزين
export const generateAppreciationCertificate = async (employee: Employee) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';

  const html = `
    <div class="page-container" style="border: 15px double #336655; padding: 40px; text-align: center; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
           <div style="text-align: right; font-weight: 900; font-size: 10pt;">المملكة العربية السعودية<br>وزارة التعليم<br>${schoolName}</div>
           <div class="logo-container"><img src="${MINISTRY_LOGO_URL}" style="max-width: 120px;"></div>
           <div style="text-align: left; font-weight: 900; font-size: 10pt;">قسم التميز المؤسسي<br>وحدة الانضباط المدرسية</div>
        </div>

        <h1 style="color: #336655; font-size: 28pt; margin: 20px 0; font-family: 'Cairo', sans-serif;">شهادة شكر وتقدير</h1>
        
        <p style="font-size: 16pt; font-weight: 700; margin: 20px 0;">يسر إدارة ${schoolName} أن تتقدم بخالص الشكر والتقدير</p>
        
        <div style="font-size: 24pt; font-weight: 900; color: #000; margin: 20px 0; border-bottom: 2px solid #336655; display: inline-block; padding: 0 40px;">
          ${gt(gender, 'للأستاذ / ', 'للأستاذة / ')} ${employee.name}
        </div>

        <p style="font-size: 14pt; line-height: 1.8; margin: 20px 60px; font-weight: 700;">
          وذلك نظير تميزه/ا وانضباطه/ا في العمل خلال الفترة الماضية، وجهوده/ا الملموسة في الرقي بالعملية التعليمية. 
          سائلين المولى عز وجل له/ا مزيداً من التوفيق والسداد.
        </p>

        <div style="margin-top: 60px; display: flex; justify-content: center;">
          <div style="text-align: center;">
            <p style="font-weight: 900; font-size: 14pt;">${gt(gender, 'مدير المدرسة', 'مديرة المدرسة')}</p>
            <p style="font-weight: 900; font-size: 16pt; color: #336655;">${principalName}</p>
            <p>...........................</p>
          </div>
        </div>
    </div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

const getLateArrivalHTML = (employee: Employee, report: Report, schoolName: string, principalName: string, gender: 'boys' | 'girls') => {
  const dayName = getArabicDayName(report.date);
  const civilId = String(employee.civilId || '').padStart(10, ' ').slice(-10);
  const civilIdHtml = civilId.split('').map(num => `<div class="digit">${num.trim() || '&nbsp;'}</div>`).join('');

  return `
    <div class="page-container">
        <div class="header">
          <div class="header-info"><div>وزارة التعليم</div><div>${schoolName}</div></div>
          <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
          <div class="header-left"></div>
        </div>
        <div class="title-section"><h1>نموذج تنبيه على تأخر / انصراف</h1></div>
        <div style="display: flex; align-items: center; margin-bottom: 8px;"><div class="civil-id-box">${civilIdHtml}</div></div>
        <table class="data-table"><thead><tr><th>الاسم</th><th>رقم الوظيفة</th><th>العمل الحالي</th></tr></thead><tbody><tr><td>${employee.name}</td><td>${employee.employeeCode || '---'}</td><td>${employee.workplace || '---'}</td></tr></tbody></table>
        <div>
          <p>${gt(gender, 'المكرم الأستاذ:', 'المكرمة الأستاذة:')} ${employee.name} ${gt(gender, 'وفقه الله', 'وفقها الله')}</p>
          <p>إنه في يوم: ${dayName}، بتاريخ: ${report.date}، اتضح لنا تأخركم.</p>
          <p>وقت الحضور: ${report.lateArrivalTime || '---'}</p>
          <p>وقت الانصراف: ${report.earlyDepartureTime || '---'}</p>
          <div class="notes-box">ملاحظات: ${report.notes}</div>
          <div class="signature-row"><span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')} ${principalName}</span></div>
        </div>
    </div>`;
};

const getAbsenceHTML = (employee: Employee, report: Report, schoolName: string, principalName: string, gender: 'boys' | 'girls') => {
  const dayName = getArabicDayName(report.date);
  return `<div class="page-container"><h1>مساءلة غياب</h1><p>${employee.name}</p><p>تاريخ الغياب: ${dayName} ${report.date}</p></div>`;
};

export const generateBatchForms = async (batch: { employee: Employee, report: Report }[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';
  const formsHTML = batch.map((item) => {
    return item.report.type === 'تأخر_انصراف' 
      ? getLateArrivalHTML(item.employee, item.report, schoolName, principalName, gender)
      : getAbsenceHTML(item.employee, item.report, schoolName, principalName, gender);
  }).join('');
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${formsHTML}</body></html>`);
};

export const generateLateArrivalDepartureForm = async (employee: Employee, report: Report) => {
    const principalName = await dbUtils.getSetting('principalName') || '..........';
    const schoolName = await dbUtils.getSetting('schoolName') || '..........';
    const gender = await dbUtils.getSetting('schoolGender') || 'boys';
    const html = getLateArrivalHTML(employee, report, schoolName, principalName, gender);
    printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateOfficialAbsenceForm = async (employee: Employee, report: Report) => {
    const principalName = await dbUtils.getSetting('principalName') || '..........';
    const schoolName = await dbUtils.getSetting('schoolName') || '..........';
    const gender = await dbUtils.getSetting('schoolGender') || 'boys';
    const html = getAbsenceHTML(employee, report, schoolName, principalName, gender);
    printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateEmployeePDF = async (employee: Employee, reports: Report[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const content = `<!DOCTYPE html><html dir="rtl" lang="ar"><body>${employee.name} - ${schoolName}</body></html>`;
  printContent(content);
};

// تقرير إحصائي عام للانضباط المدرسي
export const generateStatisticsPDF = async (stats: any, schoolName: string, principalName: string) => {
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const topEmployeesRows = stats.topEmployees.map((item: any, idx: number) => `
    <tr>
      <td>${idx + 1}</td>
      <td style="text-align: right;">${item.employee?.name}</td>
      <td>${item.employee?.civilId || '---'}</td>
      <td>${item.count} سجلات</td>
    </tr>
  `).join('');

  const html = `
    <div class="page-container" style="padding: 20px;">
      <div class="header">
        <div class="header-info">
          <div>المملكة العربية السعودية</div>
          <div>وزارة التعليم</div>
          <div>${schoolName}</div>
        </div>
        <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
        <div class="header-left">التاريخ: ${currentDate}</div>
      </div>

      <div class="title-section">
        <h1>التقرير الإحصائي العام للانضباط المدرسي</h1>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
        <div style="border: 1.5px solid black; padding: 10px; text-align: center;">
          <div style="font-weight: 900; font-size: 10pt;">إجمالي السجلات</div>
          <div style="font-size: 18pt; font-weight: 900;">${stats.totalReports}</div>
        </div>
        <div style="border: 1.5px solid black; padding: 10px; text-align: center;">
          <div style="font-weight: 900; font-size: 10pt;">حالات الغياب</div>
          <div style="font-size: 18pt; font-weight: 900; color: #c00;">${stats.absenceCount}</div>
        </div>
        <div style="border: 1.5px solid black; padding: 10px; text-align: center;">
          <div style="font-weight: 900; font-size: 10pt;">تنبيهات التأخر</div>
          <div style="font-size: 18pt; font-weight: 900; color: #f59e0b;">${stats.lateCount}</div>
        </div>
      </div>

      <div class="section-label">قائمة المتابعة (الأكثر تكراراً):</div>
      <table class="data-table" style="margin-top: 5px;">
        <thead>
          <tr>
            <th style="width: 40px;">م</th>
            <th>اسم الموظف</th>
            <th>السجل المدني</th>
            <th>عدد السجلات</th>
          </tr>
        </thead>
        <tbody>
          ${topEmployeesRows || '<tr><td colspan="4">لا توجد بيانات</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 20px; display: flex; justify-content: space-between;">
        <div style="flex: 1; border: 1.5px solid black; padding: 10px; margin-left: 5px;">
          <div class="section-label" style="font-size: 10pt;">أعلى شهر نشاط:</div>
          <div style="font-weight: 900; font-size: 12pt;">${stats.highestMonth?.name || '---'} (${stats.highestMonth?.count || 0} سجل)</div>
        </div>
        <div style="flex: 1; border: 1.5px solid black; padding: 10px; margin-right: 5px;">
          <div class="section-label" style="font-size: 10pt;">أقل شهر نشاط:</div>
          <div style="font-weight: 900; font-size: 12pt;">${stats.lowestMonth?.name || '---'} (${stats.lowestMonth?.count || 0} سجل)</div>
        </div>
      </div>

      <div class="signature-row" style="margin-top: 40px;">
        <div style="text-align: center;"><span>وكيل الشؤون المدرسية</span><br><br><span>...........................</span></div>
        <div style="text-align: center;"><span>مدير المدرسة</span><br><span>${principalName}</span><br><span>...........................</span></div>
      </div>
    </div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};
