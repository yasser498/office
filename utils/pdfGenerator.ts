
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
  
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; width: 100%; height: 80px; }
  .header-info { flex: 1; font-size: 9pt; font-weight: 700; line-height: 1.4; text-align: right; }
  .logo-container { flex: 1; text-align: center; }
  .logo-container img { max-width: 90px; height: auto; }
  .header-left { flex: 1; text-align: left; font-weight: 700; font-size: 9pt; }

  .title-section { text-align: center; margin-bottom: 15px; width: 100%; }
  .title-section h1 { 
    font-size: 13pt; margin: 0; font-weight: 900; 
    border: 2px solid black; display: inline-block; padding: 5px 20px;
    background: #f0f0f0;
  }
  .title-section p { font-size: 8pt; margin: 5px 0 0 0; font-weight: 700; }

  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1.5px solid black; }
  .data-table th, .data-table td { border: 1px solid black; padding: 6px; text-align: center; }
  .data-table td { font-size: 9pt; font-weight: 700; }
  .data-table th { background: #e9ecef; color: black; font-weight: 900; font-size: 10pt; }
  
  .civil-id-box { display: flex; direction: ltr; }
  .digit { width: 22px; height: 22px; border: 1.2px solid black; display: flex; align-items: center; justify-content: center; font-weight: 900; margin: 0 1px; background: white; font-size: 10pt; }

  .signature-row { display: flex; justify-content: space-between; margin: 15px 0; font-weight: 900; font-size: 10pt; }
  .divider { border-top: 1.5px solid #000; margin: 15px 0; }
  .section-label { font-weight: 900; color: #000; text-decoration: underline; margin-bottom: 5px; font-size: 11pt; }
  .dynamic-data { font-weight: 900; border-bottom: 1px solid black; padding: 0 5px; }
  .notes-box { border: 1px dashed #444; padding: 8px; margin: 10px 0; font-size: 9pt; background: #fffcf0; }
  
  .important-notes { border: 1.5px solid black; padding: 10px; margin-top: 10px; font-size: 8pt; }
  .important-notes-title { font-weight: 900; text-decoration: underline; margin-bottom: 5px; }
  .important-notes-list { margin: 0; padding-right: 20px; font-weight: 700; }
`;

const gt = (gender: 'boys' | 'girls', masc: string, fem: string) => gender === 'boys' ? masc : fem;

const getLateArrivalHTML = (employee: Employee, report: Report, schoolName: string, principalName: string, gender: 'boys' | 'girls') => {
  const dayName = getArabicDayName(report.date);
  const civilId = String(employee.civilId || '').padStart(10, ' ').slice(-10);
  const civilIdHtml = civilId.split('').map(num => `<div class="digit">${num.trim() || '&nbsp;'}</div>`).join('');

  return `
    <div class="page-container">
        <div class="header">
          <div class="header-info">
            <div>المملكة العربية السعودية</div>
            <div>وزارة التعليم</div>
            <div>${schoolName}</div>
          </div>
          <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
          <div class="header-left">التاريخ: ${report.date}</div>
        </div>

        <div class="title-section">
          <h1>نموذج تنبيه على تأخر / انصراف</h1>
          <p>رمز النموذج : ( و . م . ع . ن - 20 - 02 )</p>
        </div>

        <div style="display: flex; align-items: center; margin-bottom: 10px;">
           <div style="font-weight: 900; margin-left: 10px;">السجل المدني:</div>
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

        <div style="margin-top: 15px;">
          <div class="signature-row">
            <span>${gt(gender, 'المكرم الأستاذ:', 'المكرمة الأستاذة:')} <span class="dynamic-data">${employee.name}</span></span>
            <span>${gt(gender, 'وفقه الله', 'وفقها الله')}</span>
          </div>
          <p style="font-weight: 900; margin: 10px 0;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد:</p>
          <p style="font-weight: 700; line-height: 1.6;">
            إنه في يوم: <span class="dynamic-data">${dayName}</span>، بتاريخ: <span class="dynamic-data">${report.date}</span>، اتضح لنا ما يلي:
          </p>
          
          <div style="margin-right: 25px; margin-top: 10px; space-y: 8px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <span style="width: 20px; height: 20px; border: 1.5px solid black; display: inline-block; text-align: center; line-height: 18px;">${report.lateArrivalTime ? '✓' : ''}</span>
              <span style="font-weight: 900;">${gt(gender, 'تأخركم', 'تأخركن')} من بداية الدوام وحضوركم الساعة ( <span class="dynamic-data">${report.lateArrivalTime || '.......'}</span> )</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <span style="width: 20px; height: 20px; border: 1.5px solid black; display: inline-block; text-align: center; line-height: 18px;">${report.absenceSession ? '✓' : ''}</span>
              <span style="font-weight: 900;">عدم تواجدكم أثناء العمل في الحصة ( <span class="dynamic-data">${report.absenceSession || '.......'}</span> )</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <span style="width: 20px; height: 20px; border: 1.5px solid black; display: inline-block; text-align: center; line-height: 18px;">${report.earlyDepartureTime ? '✓' : ''}</span>
              <span style="font-weight: 900;">انصرافكم مبكراً قبل نهاية الدوام من الساعة ( <span class="dynamic-data">${report.earlyDepartureTime || '.......'}</span> )</span>
            </div>
          </div>

          ${report.notes ? `<div class="notes-box"><b>ملاحظات الإدارة:</b> ${report.notes}</div>` : ''}

          <p style="margin-top: 15px; font-weight: 700;">نأمل توضيح أسباب ذلك مع إرفاق ما يؤيد عذركم ،،،،،، ولكم تحياتي</p>
          
          <div class="signature-row" style="margin-top: 25px;">
            <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')} <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: ..........................</span>
          </div>
        </div>

        <div class="divider"></div>

        <div>
          <div class="section-label">إفادة الموظف/ة:</div>
          <p style="font-weight: 700; margin-bottom: 10px;">أفيدكم أن أسباب ذلك هي :</p>
          <div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 10px;"></div>
          <div style="border-bottom: 1px dotted black; height: 25px;"></div>
          
          <div class="signature-row" style="margin-top: 20px;">
            <span>الاسم: <span class="dynamic-data">${employee.name}</span></span>
            <span>التوقيع: ..........................</span>
          </div>
        </div>

        <div style="border: 2px solid black; padding: 10px; margin-top: 15px; background: #fafafa;">
          <div class="section-label" style="text-decoration: underline;">رأي ${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')}</div>
          <div style="margin: 10px 0; font-weight: 900;">
            ( &nbsp;&nbsp; ) ${gt(gender, 'عذره مقبول', 'عذرها مقبول')} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
            ( &nbsp;&nbsp; ) ${gt(gender, 'عذره غير مقبول ويحسم عليه', 'عذرها غير مقبول ويحسم عليها')}
          </div>
          <div class="signature-row">
            <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')} <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: ..........................</span>
          </div>
        </div>
    </div>`;
};

const getAbsenceHTML = (employee: Employee, report: Report, schoolName: string, principalName: string, gender: 'boys' | 'girls') => {
  const dayName = getArabicDayName(report.date);
  const endDayName = getArabicDayName(report.endDate || report.date);
  const civilId = String(employee.civilId || '').padStart(10, ' ').slice(-10);
  const civilIdHtml = civilId.split('').map(num => `<div class="digit">${num.trim() || '&nbsp;'}</div>`).join('');

  return `
    <div class="page-container">
        <div class="header">
          <div class="header-info">
            <div>المملكة العربية السعودية</div>
            <div>وزارة التعليم</div>
            <div>${schoolName}</div>
          </div>
          <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
          <div class="header-left">التاريخ: ${report.date}</div>
        </div>

        <div class="title-section">
          <h1>مساءلة غياب</h1>
          <p>رمز النموذج : ( و . م . ع . ن - 01 - 04 )</p>
        </div>

        <div style="display: flex; align-items: center; margin-bottom: 10px;">
           <div style="font-weight: 900; margin-left: 10px;">السجل المدني:</div>
           <div class="civil-id-box">${civilIdHtml}</div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 32%;">الاسم</th>
              <th>التخصص</th>
              <th>المستوى</th>
              <th>رقم الوظيفة</th>
              <th>عدد الأيام</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${employee.name}</td>
              <td>${employee.specialization || '---'}</td>
              <td>${employee.level || '---'}</td>
              <td>${employee.employeeCode || '---'}</td>
              <td style="font-size: 11pt; font-weight: 900;">${report.daysCount || '1'}</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #f2f2f2; border: 1.5px solid #000; padding: 10px; text-align: center; font-weight: 900; margin-bottom: 15px;">
          إنه في يوم (<span class="dynamic-data">${dayName}</span>) بتاريخ (<span class="dynamic-data">${report.date}</span>) 
          ${gt(gender, 'تغيب', 'تغيبت')} عن العمل إلى يوم (<span class="dynamic-data">${endDayName}</span>) الموافق (<span class="dynamic-data">${report.endDate || report.date}</span>)
        </div>

        <div style="border: 1px solid #000; padding: 12px; margin-bottom: 10px;">
          <div class="section-label">(1) طلب الإفادة :</div>
          <div class="signature-row">
            <span>${gt(gender, 'الأستاذ:', 'الأستاذة:')} <span class="dynamic-data">${employee.name}</span></span>
            <span>${gt(gender, 'وفقه الله', 'وفقها الله')}</span>
          </div>
          <p style="font-weight: 700;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد :</p>
          <p style="text-align: justify; font-weight: 700; line-height: 1.6;">
            من خلال متابعة سجل الدوام تبين غيابكم خلال الفترة الموضحة أعلاه ، نأمل الإفادة عن أسباب ذلك وتقديم ما يؤيد عذركم خلال أسبوع من تاريخه.
          </p>
          <div class="signature-row" style="margin-top: 15px;">
            <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')} <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: .........................</span>
          </div>
        </div>

        <div style="border: 1px solid #000; padding: 12px; margin-bottom: 10px;">
          <div class="section-label">(2) الإفادة :</div>
          <p style="font-weight: 700;">أفيدكم أن غيابي كان للأسباب التالية :</p>
          <div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 10px;"></div>
          <div style="border-bottom: 1px dotted black; height: 25px;"></div>
          <div class="signature-row" style="margin-top: 15px;">
            <span>الاسم: <span class="dynamic-data">${employee.name}</span></span>
            <span>التوقيع: .................</span>
          </div>
        </div>

        <div style="border: 2px solid #000; padding: 12px; background: #fafafa;">
          <div class="section-label">(3) قرار ${gt(gender, 'مدير المدرسة :', 'مديرة المدرسة :')}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-weight: 900; font-size: 8.5pt;">
            <div>❑ تحتسب إجازة مرضية.</div>
            <div>❑ تحتسب إجازة وفاة.</div>
            <div>❑ تحتسب إجازة مرافقة.</div>
            <div>❑ تحتسب إجازة اضطرارية.</div>
            <div style="grid-column: span 2;">❑ يعتمد الحسم لعدم قبول العذر.</div>
          </div>
          <div class="signature-row" style="margin-top: 15px;">
            <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:') } <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: .........................</span>
          </div>
        </div>

        <div class="important-notes">
          <div class="important-notes-title">ملاحظات هامة:</div>
          <ol class="important-notes-list">
            <li>يجب أن يوضح المتغيب أسباب غيابه فور تسلمه الاستمارة.</li>
            <li>يعطى المتغيب مدة أسبوع لتقديم ما يفيد عذره.</li>
            <li>تحفظ أصل المساءلة في ملف الموظف بالمدرسة والرفع بالحسم للإدارة في حال عدم قبول العذر.</li>
          </ol>
        </div>
    </div>`;
};

// الدوال المساعدة للطباعة
export const generateExitPermit = async (employee: Employee, startTime?: string, endTime?: string, reason?: string) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const html = `
    <div class="page-container" style="padding: 20px;">
        <div class="header">
          <div class="header-info"><div>وزارة التعليم</div><div>${schoolName}</div></div>
          <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
          <div class="header-left">التاريخ: ${currentDate}</div>
        </div>
        <div class="title-section">
          <h1>بطاقة خروج موظف أثناء الدوام الرسمي</h1>
          <p>رمز النموذج : ( و . م . ع . ن - 20 - 01 )</p>
        </div>
        <div style="border: 1.5px solid black; padding: 15px;">
          <div style="margin-bottom: 15px; font-weight: 900;">
            ${gt(gender, 'سعادة مدير المدرسة /', 'سعادة مديرة المدرسة /')} <span class="dynamic-data">${principalName}</span> المحترم/ة
          </div>
          <p style="font-weight: 700; line-height: 2;">
            أرجو التكرم بالموافقة لي بالخروج من المدرسة لظرف طارئ في يوم <span class="dynamic-data">${getArabicDayName(new Date().toISOString())}</span> 
            من الساعة ( <span class="dynamic-data">${startTime || '........'}</span> ) إلى الساعة ( <span class="dynamic-data">${endTime || '........'}</span> ).
          </p>
          ${reason ? `<div style="margin: 10px 0; font-weight: 700;">السبب: <span class="dynamic-data">${reason}</span></div>` : ''}
          <div class="signature-row" style="margin-top: 25px;">
            <span>الاسم: <span class="dynamic-data">${employee.name}</span></span>
            <span>التوقيع: ...........................</span>
          </div>
        </div>
        <div style="border: 1.5px solid black; border-top: none; padding: 15px; background: #f9f9f9;">
          <div class="section-label">مرئيات الإدارة:</div>
          <div style="margin: 10px 0; font-weight: 900;">( &nbsp;&nbsp; ) يوافق له/ا &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp; ) لا يوافق له/ا</div>
          <div class="signature-row">
            <span>${gt(gender, 'مدير المدرسة', 'مديرة المدرسة')}: <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: ...........................</span>
          </div>
        </div>
    </div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
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

// استيراد بقية الدوال الإحصائية والتحويلية
export const generateWarningLetter = async (employee: Employee, warningLevel: string, letterNo?: string) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';
  const currentDate = new Date().toLocaleDateString('ar-SA');
  const html = `<div class="page-container" style="padding: 40px;"><h1>خطاب إنذار (${warningLevel})</h1><p>${gt(gender, 'المكرم الأستاذ:', 'المكرمة الأستاذة:')} ${employee.name}</p></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateLateCumulativeLog = async (employee: Employee, reports: Report[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const currentDate = new Date().toLocaleDateString('ar-SA');
  const html = `<div class="page-container"><h1>سجل حصر التأخر التراكمي</h1><p>الموظف: ${employee.name}</p></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateAcknowledgmentLog = async (employees: Employee[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const html = `<div class="page-container"><h1>بيان التوقيع بالعلم</h1><p>المدرسة: ${schoolName}</p></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateAppreciationCertificate = async (employee: Employee) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';
  const html = `<div class="page-container" style="border: 10px double #336655; text-align: center; padding: 50px;"><h1>شهادة شكر وتقدير</h1><p>${gt(gender, 'للأستاذ /', 'للأستاذة /')} ${employee.name}</p></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateStatisticsPDF = async (stats: any, schoolName: string, principalName: string) => {
  const html = `<div class="page-container"><h1>التقرير الإحصائي العام</h1><p>إجمالي السجلات: ${stats.totalReports}</p></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateEmployeePDF = async (employee: Employee, reports: Report[]) => {
  const html = `<div class="page-container"><h1>سجل الموظف</h1><p>${employee.name}</p></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};
