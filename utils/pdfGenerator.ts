
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
    doc.write(htmlContent);
    doc.close();
    
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    }, 500);
  }
};

const getCommonStyles = () => `
  @page { size: A4; margin: 0; }
  body { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; color: #000; -webkit-print-color-adjust: exact; font-size: 9pt; }
  .page-container { width: 190mm; margin: 10mm auto; min-height: 277mm; display: flex; flex-direction: column; position: relative; box-sizing: border-box; padding: 5mm; }
  .page-break { page-break-after: always; height: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .header-info { width: 40%; font-size: 9pt; font-weight: bold; line-height: 1.6; text-align: right; }
  .logo-container { width: 20%; text-align: center; }
  .logo-container img { max-width: 110px; height: auto; }
  .title-section { text-align: center; margin-bottom: 15px; }
  .title-section h1 { font-size: 13pt; margin: 0; font-weight: 900; border-bottom: 2px solid black; display: inline-block; padding-bottom: 4px; }
  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  .data-table th, .data-table td { border: 1px solid black; padding: 6px; text-align: center; font-size: 9pt; font-weight: bold; }
  .data-table th { background: #f2f2f2; color: #000; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .stats-card { border: 1.5px solid black; padding: 10px; text-align: center; }
  .stats-card h4 { margin: 0; font-size: 8pt; border-bottom: 1px solid black; padding-bottom: 5px; margin-bottom: 5px; }
  .stats-card div { font-size: 16pt; font-weight: 900; }
  .signature-section { margin-top: auto; padding-top: 20px; display: flex; justify-content: space-between; font-weight: bold; }
`;

export const generateStatisticsPDF = async (stats: any, schoolName: string, principalName: string) => {
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const topEmployeesRows = stats.topEmployees.map((item: any, idx: number) => `
    <tr>
      <td>${idx + 1}</td>
      <td style="text-align: right; padding-right: 10px;">${item.employee?.name}</td>
      <td>${item.employee?.civilId}</td>
      <td>${item.count}</td>
    </tr>
  `).join('');

  const monthlyRows = monthNames.map((name, idx) => {
    const val = stats.monthlyData[idx] || 0;
    return val > 0 ? `<tr><td>${name}</td><td>${val} سجل</td></tr>` : '';
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        ${getCommonStyles()}
        .section-title { background: #336655; color: white; padding: 5px 10px; font-weight: bold; margin-bottom: 10px; font-size: 10pt; }
      </style>
    </head>
    <body>
      <div class="page-container">
        <div class="header">
          <div class="header-info">
            <div>المملكة العربية السعودية</div>
            <div>وزارة التعليم</div>
            <div>الإدارة العامة للتعليم بجدة</div>
            <div>${schoolName}</div>
          </div>
          <div class="logo-container">
            <img src="${MINISTRY_LOGO_URL}" alt="شعار الوزارة">
          </div>
          <div style="width: 40%; text-align: left; font-weight: bold;">
            التاريخ: ${currentDate}هـ
          </div>
        </div>

        <div class="title-section">
          <h1>تقرير الإحصائيات والتحليل العام للانضباط</h1>
        </div>

        <div class="section-title">أولاً: ملخص عام</div>
        <div class="stats-grid">
          <div class="stats-card">
            <h4>إجمالي السجلات المسجلة</h4>
            <div>${stats.totalReports}</div>
          </div>
          <div class="stats-card">
            <h4>إجمالي حالات الغياب</h4>
            <div>${stats.absenceCount}</div>
          </div>
          <div class="stats-card">
            <h4>إجمالي تنبيهات التأخر</h4>
            <div>${stats.lateCount}</div>
          </div>
        </div>

        <div class="section-title">ثانياً: قائمة الموظفين الأكثر تسجيلاً (قائمة المتابعة)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 10%;">م</th>
              <th style="width: 45%;">اسم الموظف</th>
              <th style="width: 25%;">السجل المدني</th>
              <th style="width: 20%;">عدد السجلات</th>
            </tr>
          </thead>
          <tbody>
            ${topEmployeesRows || '<tr><td colspan="4">لا توجد بيانات مسجلة</td></tr>'}
          </tbody>
        </table>

        <div class="section-title">ثالثاً: النشاط الشهري (توزيع السجلات)</div>
        <table class="data-table" style="width: 50%; margin-right: 0;">
          <thead>
            <tr>
              <th>الشهر</th>
              <th>عدد الحالات</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyRows || '<tr><td colspan="2">لا توجد سجلات شهرية</td></tr>'}
          </tbody>
        </table>

        <div class="signature-section">
          <div style="text-align: center;">
            <p>معد التقرير</p>
            <p>................................</p>
          </div>
          <div style="text-align: center;">
            <p>يعتمد مدير المدرسة</p>
            <p>${principalName}</p>
            <p>التوقيع: ...........................</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printContent(html);
};

const getLateArrivalHTML = (employee: Employee, report: Report, schoolName: string) => {
  const dayName = getArabicDayName(report.date);
  const civilId = String(employee.civilId || '').padStart(10, ' ').slice(-10);
  const civilIdHtml = civilId.split('').map(num => 
    `<div style="width: 22px; height: 22px; border: 1px solid black; display: inline-flex; align-items: center; justify-content: center; font-family: sans-serif; font-weight: bold; margin: 0 1px; background: white; font-size: 10pt;">${num.trim()}</div>`
  ).join('');

  return `
    <div class="page-container">
        <div class="header">
          <div class="header-info">
            <div>المملكة العربية السعودية</div>
            <div>وزارة التعليم</div>
            <div>الإدارة العامة للتعليم بجدة</div>
            <div>${schoolName}</div>
          </div>
          <div class="logo-container">
            <img src="${MINISTRY_LOGO_URL}" alt="شعار الوزارة">
          </div>
          <div class="header-left"></div>
        </div>

        <div class="title-section">
          <h1>نموذج تنبيه على تأخر / انصراف</h1>
          <p>رمز النموذج : ( و . م . ع . ن - 20 - 02 )</p>
        </div>

        <div class="civil-id-box">
          <div class="civil-id-inner">
             <div class="civil-id-label">السجل المدني</div>
             <div style="padding: 2px; display: flex; direction: ltr;">${civilIdHtml}</div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 32%;">الاسم</th>
              <th>التخصص</th>
              <th>المستوى والمرتبة</th>
              <th>رقم الوظيفة</th>
              <th>العمل الحالي</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-size: 10pt;">${employee.name}</td>
              <td>${employee.specialization || '---'}</td>
              <td>${employee.level || '---'}</td>
              <td>${employee.employeeCode || '---'}</td>
              <td>${employee.workplace || '---'}</td>
            </tr>
          </tbody>
        </table>

        <div class="form-body">
          <div style="display: flex; justify-content: space-between;">
            <span>المكرم / ${employee.name}</span>
            <span>وفقه الله</span>
          </div>
          <div style="margin: 3px 0; font-weight: bold;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد:</div>
          <p style="margin: 3px 0;">إنه في يوم: ${dayName}، بتاريخ: ${report.date}هـ، اتضح ما يلي:</p>
          
          <div class="bullet-point">
            <span class="diamond">❖</span>
            <span>تأخركم من بداية العمل وحضوركم الساعة ( <span class="input-line">${report.lateArrivalTime || '---'}</span> )</span>
          </div>
          <div class="bullet-point">
            <span class="diamond">❖</span>
            <span>عدم تواجدكم أثناء العمل في الحصة ( <span class="input-line">${report.absenceSession || '---'}</span> )</span>
          </div>
          <div class="bullet-point">
            <span class="diamond">❖</span>
            <span>انصرافكم مبكراً قبل نهاية العمل من الساعة ( <span class="input-line">${report.earlyDepartureTime || '---'}</span> )</span>
          </div>

          <p style="margin-top: 10px;">عليه نأمل توضيح أسباب ذلك مع إرفاق ما يؤيد عذركم ،،،،،، ولكم تحياتي</p>
          
          <div class="signature-row">
            <span>مدير المدرسة: ${report.principalName || '..........'}</span>
            <span>التوقيع: ..........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144 هـ</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="form-body">
          <div style="display: flex; justify-content: space-between;">
             <span>المكرم مدير المدرسة</span>
             <span>وفقه الله</span>
          </div>
          <div style="margin: 3px 0;">أفيدكم أن أسباب ذلك ما يلي :</div>
          <div style="border-bottom: 1px dotted black; height: 32px;"></div>
          <div style="border-bottom: 1px dotted black; height: 32px;"></div>
          
          <div class="signature-row" style="margin-top: 15px;">
            <span>الاسم: ${employee.name}</span>
            <span>التوقيع: ..........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144 هـ</span>
          </div>
        </div>

        <div class="decision-box">
          <div style="text-decoration: underline; margin-bottom: 8px; font-size: 13pt;">رأي مدير المدرسة</div>
          <div class="decision-line">
            <span>( &nbsp;&nbsp;&nbsp; ) عذره مقبول .</span>
          </div>
          <div class="decision-line">
            <span>( &nbsp;&nbsp;&nbsp; ) عذره غير مقبول ويحسم عليه .</span>
          </div>
          <div class="signature-row" style="margin-top: 10px;">
            <span>مدير المدرسة: ${report.principalName || '..........'}</span>
            <span>التوقيع: ..........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144 هـ</span>
          </div>
        </div>

        <div class="note-footer">
          * ملاحظة: ترفق بطاقة المساءلة مع أصل القرار في حالة عدم قبول العذر لحفظها بملفه بالإدارة ، أصله لملفه بالمدرسة
        </div>
    </div>`;
};

const getAbsenceHTML = (employee: Employee, report: Report, schoolName: string, principalName: string) => {
  const dayName = getArabicDayName(report.date);
  const endDayName = getArabicDayName(report.endDate || report.date);
  const civilId = String(employee.civilId || '').padStart(10, ' ').slice(-10);
  const civilIdHtml = civilId.split('').map(num => 
    `<div style="width: 22px; height: 22px; border: 1px solid black; display: inline-flex; align-items: center; justify-content: center; font-family: sans-serif; font-weight: bold; margin: 0 1px; background: white; font-size: 9pt;">${num.trim()}</div>`
  ).join('');

  return `
    <div class="page-container">
        <div class="header">
          <div class="header-info">
            <div>المملكة العربية السعودية</div>
            <div>وزارة التعليم</div>
            <div>الإدارة العامة للتعليم بجدة</div>
            <div>${schoolName}</div>
          </div>
          <div class="logo-container">
            <img src="${MINISTRY_LOGO_URL}" alt="شعار الوزارة">
          </div>
          <div style="width: 35%;"></div>
        </div>

        <div class="title-section">
          <h1>مساءلة غياب</h1>
          <p>رمز النموذج : ( و . م . ع . ن - 01 - 04 )</p>
        </div>

        <div class="civil-id-box">
          <div class="civil-id-inner">
            <div class="civil-id-label">السجل المدني</div>
            <div style="padding: 2px; display: flex; direction: ltr;">${civilIdHtml}</div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 32%;">الاسم</th>
              <th style="width: 14%;">التخصص</th>
              <th style="width: 14%;">المستوى</th>
              <th style="width: 8%;">الدرجة</th>
              <th style="width: 12%;">رقم الوظيفة</th>
              <th style="width: 12%;">العمل الحالي</th>
              <th style="width: 8%;">الأيام</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-size: 9pt; text-align: right; padding-right: 8px;">${employee.name || '---'}</td>
              <td>${employee.specialization || '---'}</td>
              <td>${employee.level || '---'}</td>
              <td>${employee.grade || '---'}</td>
              <td>${employee.employeeCode || '---'}</td>
              <td>${employee.workplace || '---'}</td>
              <td class="dynamic-data">${report.daysCount || '1'}</td>
            </tr>
          </tbody>
        </table>

        <div class="absence-line">
          إنه في يوم (${dayName}) بتاريخ (${report.date})هـ تغيبت عن العمل إلى يوم (${endDayName})هـ الموافق (${report.endDate || report.date})هـ
        </div>

        <div class="content-box">
          <div class="section-title">(1) طلب الإفادة :</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>الأستاذ / ة : <span style="border-bottom: 1px solid black; min-width: 250px; display: inline-block; text-align: center;" class="dynamic-data">${employee.name}</span></span>
            <span>وفقه الله</span>
          </div>
          <div style="margin-bottom: 6px; font-weight: bold;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد :</div>
          <p style="text-align: justify; margin: 0 0 8px 0;">من خلال متابعة سجل الدوام تبين غيابكم خلال الفترة الموضحة بعالية ، أمل الإفادة عن أسباب ذلك وعليكم تقديم ما يؤيد عذركم خلال أسبوع من تاريخه ، علماً بأنه في حالة عدم الالتزام سيتم اتخاذ اللازم حسب التعليمات .</p>
          <div class="signatures">
            <span>مدير المدرسة: <span style="color: #336655;" class="dynamic-data">${principalName || '..........'}</span></span>
            <span>التوقيع: .........................</span>
            <span>التاريخ: <span class="dynamic-data">${report.date}هـ</span></span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="content-box">
          <div class="section-title">(2) الإفادة :</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>مدير / ة المدرسة : <span class="dynamic-data">${principalName}</span></span>
            <span>وفقه الله</span>
          </div>
          <div style="margin-bottom: 6px; font-weight: bold;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد :</div>
          <div>أفيدكم أن غيابي كان للأسباب التالية :</div>
          <div style="border-bottom: 1px dotted black; height: 30px;"></div>
          <div style="border-bottom: 1px dotted black; height: 30px; margin-bottom: 8px;"></div>
          <div style="margin-bottom: 12px; font-weight: bold;">وسأقوم بتقديم ما يثبت ذلك خلال أسبوع من تاريخه .</div>
          <div class="signatures">
            <span style="width: 55%;">الاسم: <span style="border-bottom: 1px solid black; min-width: 200px; display: inline-block; text-align: center;" class="dynamic-data">${employee.name}</span></span>
            <span>التوقيع: .................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 144 هـ</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="content-box">
          <div class="section-title">(3) قرار مدير المدرسة :</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; font-weight: bold;">
            <div>( &nbsp;&nbsp;&nbsp; ) تحتسب له إجازة مرضية .</div>
            <div>( &nbsp;&nbsp;&nbsp; ) تحتسب له إجازة وفاة .</div>
            <div>( &nbsp;&nbsp;&nbsp; ) تحتسب له إجازة مرافقة .</div>
            <div>( &nbsp;&nbsp;&nbsp; ) يعتمد الحسم لعدم قبول عذره .</div>
            <div style="grid-column: span 2;">( &nbsp;&nbsp;&nbsp; ) يحتسب غيابه من رصيد الإجازات الاضطرارية .</div>
          </div>
          <div class="signatures">
            <span>الاسم: <span style="color: #336655;" class="dynamic-data">${principalName || '..........'}</span></span>
            <span>التوقيع: .........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 144 هـ</span>
          </div>
        </div>

        <div class="notes-box">
          <strong style="text-decoration: underline; margin-bottom: 4px; display: block;">ملاحظات هامة :</strong>
          <ul class="notes-list">
            <li>1- تستكمل الاستمارة من المدير المباشر وإصدار القرار بموجبه .</li>
            <li>2- إذا سبق عطلة نهاية الأسبوع غياب وألحقها غياب تحتسب مدة الغياب كاملة .</li>
            <li>3- يجب أن يوضح المتغيب أسباب غيابه فور تسلمه الاستمارة ويعيدها لمديره .</li>
            <li>4- يعطى المتغيب مدة أسبوع لتقديم ما يفيد عذره فإذا انقضت المدة يتم الحسم .</li>
          </ul>
        </div>
    </div>`;
};

export const generateBatchForms = async (batch: { employee: Employee, report: Report }[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalNameSetting = await dbUtils.getSetting('principalName') || '..........';

  const formsHTML = batch.map((item, index) => {
    let formContent = '';
    if (item.report.type === 'تأخر_انصراف') {
      formContent = getLateArrivalHTML(item.employee, item.report, schoolName);
    } else {
      formContent = getAbsenceHTML(item.employee, item.report, schoolName, principalNameSetting);
    }
    
    const pageBreak = index < batch.length - 1 ? '<div class="page-break"></div>' : '';
    return formContent + pageBreak;
  }).join('');

  const fullHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>طباعة مجمعة</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        @page { size: A4; margin: 0; }
        body { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; color: #000; -webkit-print-color-adjust: exact; font-size: 9pt; }
        .page-container { width: 190mm; margin: 10mm auto; min-height: 277mm; display: flex; flex-direction: column; position: relative; box-sizing: border-box; }
        .page-break { page-break-after: always; height: 0; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .header-info { width: 40%; font-size: 9pt; font-weight: bold; line-height: 1.6; text-align: right; }
        .logo-container { width: 20%; text-align: center; }
        .logo-container img { max-width: 110px; height: auto; }
        .title-section { text-align: center; margin-bottom: 10px; }
        .title-section h1 { font-size: 11pt; margin: 0; font-weight: 900; border-bottom: 1.5px solid black; display: inline-block; padding-bottom: 2px; }
        .civil-id-box { display: flex; justify-content: flex-start; margin-bottom: 10px; width: 100%; }
        .civil-id-inner { border: 1px solid black; display: flex; align-items: center; }
        .civil-id-label { background: #336655; color: white; padding: 2px 10px; font-weight: bold; font-size: 9pt; border-left: 1px solid black; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
        .data-table th, .data-table td { border: 1px solid black; padding: 4px; text-align: center; font-size: 9pt; font-weight: bold; }
        .data-table th { background: #336655; color: white; }
        .bullet-point { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-weight: bold; }
        .diamond { color: #000; font-size: 12pt; }
        .input-line { border-bottom: 1px dotted black; min-width: 80px; display: inline-block; text-align: center; }
        .dynamic-data { font-weight: 900; }
        .absence-line { background: #f9f9f9; border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 9.5pt; margin-bottom: 10px; }
        .signature-row, .signatures { display: flex; justify-content: space-between; margin: 8px 0; font-weight: bold; font-size: 9.5pt; }
        .divider { border-top: 1.5px solid #000; margin: 8px 0; }
        .decision-box { border: 1.5px solid black; padding: 8px; margin-top: 5px; font-size: 9pt; font-weight: bold; }
        .notes-box { border: 1px solid black; padding: 6px; font-size: 8pt; margin-top: auto; line-height: 1.4; }
        @media print { .page-container { margin: 10mm auto; } }
      </style>
    </head>
    <body>${formsHTML}</body>
    </html>
  `;

  printContent(fullHTML);
};

export const generateLateArrivalDepartureForm = async (employee: Employee, report: Report) => {
    return generateBatchForms([{ employee, report }]);
};

export const generateOfficialAbsenceForm = async (employee: Employee, report: Report) => {
    return generateBatchForms([{ employee, report }]);
};

export const generateEmployeePDF = (employee: Employee, reports: Report[]) => {
  const content = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>سجل موظف - ${employee.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Cairo', sans-serif; padding: 20px; }
        h1 { text-align: center; color: #336655; border-bottom: 3px solid #336655; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid black; padding: 10px; text-align: center; font-size: 10pt; }
        th { background: #336655; color: white; }
      </style>
    </head>
    <body>
      <h1>سجل حالات الموظف: ${employee.name}</h1>
      <table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>النوع</th>
            <th>الأيام / التفاصيل</th>
            <th>الملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${reports.map(r => `
            <tr>
              <td>${r.date}</td>
              <td>${r.type === 'تأخر_انصراف' ? 'تنبيه تأخر' : r.type}</td>
              <td>
                ${r.type === 'غياب' ? (r.daysCount + ' أيام') : 
                  r.type === 'تأخر_انصراف' ? (r.lateArrivalTime || 'تأخر') : '---'}
              </td>
              <td>${r.notes || '---'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  printContent(content);
};
