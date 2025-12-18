
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

// كشف ما إذا كان المستخدم يستخدم جهاز جوال
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
    
    // إضافة كود JS لانتظار تحميل الصور وتطبيق مقياس الرسم 75% للجوال
    const isMobile = isMobileDevice();
    const scaleStyle = isMobile ? 'body { zoom: 75%; }' : '';
    
    const injectedHTML = htmlContent.replace('</head>', `
      <style>${scaleStyle}</style>
      </head>
    `).replace('</body>', `
      <script>
        window.onload = function() {
          // التأكد من تحميل الشعار تماماً
          const images = document.getElementsByTagName('img');
          let loadedCount = 0;
          if (images.length === 0) {
             startPrint();
          } else {
            for (let img of images) {
              if (img.complete) {
                loadedCount++;
                if (loadedCount === images.length) startPrint();
              } else {
                img.onload = () => {
                  loadedCount++;
                  if (loadedCount === images.length) startPrint();
                };
                img.onerror = () => {
                  loadedCount++;
                  if (loadedCount === images.length) startPrint();
                };
              }
            }
          }
          
          function startPrint() {
            setTimeout(() => {
              window.focus();
              window.print();
            }, 300);
          }
        };
      </script>
    </body>`);
    
    doc.write(injectedHTML);
    doc.close();
  }
};

const getCommonStyles = () => `
  @page { size: A4; margin: 0; }
  body { 
    font-family: 'Cairo', sans-serif; 
    margin: 0; 
    padding: 0; 
    color: #000; 
    -webkit-print-color-adjust: exact; 
    font-size: 9pt; 
    width: 100%;
  }
  .page-container { 
    width: 190mm; 
    margin: 10mm auto; 
    min-height: 277mm; 
    display: flex; 
    flex-direction: column; 
    position: relative; 
    box-sizing: border-box; 
    padding: 5mm; 
    background: white;
  }
  .page-break { page-break-after: always; height: 0; }
  .header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 20px; 
    width: 100%; 
    height: 100px;
  }
  .header-info { 
    flex: 1;
    font-size: 9pt; 
    font-weight: bold; 
    line-height: 1.6; 
    text-align: right; 
  }
  .logo-container { 
    flex: 1;
    text-align: center; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
  }
  .logo-container img { 
    max-width: 110px; 
    height: auto; 
    display: block;
    margin: 0 auto;
  }
  .header-left { 
    flex: 1;
    text-align: left; 
    font-weight: bold; 
    font-size: 9pt;
  }
  .title-section { text-align: center; margin-bottom: 15px; width: 100%; }
  .title-section h1 { 
    font-size: 13pt; 
    margin: 0; 
    font-weight: 900; 
    border-bottom: 2px solid black; 
    display: inline-block; 
    padding-bottom: 4px; 
  }
  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  .data-table th, .data-table td { border: 1px solid black; padding: 6px; text-align: center; font-size: 9pt; font-weight: bold; }
  .data-table th { background: #f2f2f2; color: #000; }
  .signature-section { margin-top: auto; padding-top: 20px; display: flex; justify-content: space-between; font-weight: bold; }
  .dynamic-data { font-weight: 900; }
  .signature-row { display: flex; justify-content: space-between; margin: 8px 0; font-weight: bold; font-size: 9.5pt; }
  .divider { border-top: 1.5px solid #000; margin: 8px 0; }
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
      <style>${getCommonStyles()} .pdf-section-title { background: #336655; color: white; padding: 5px 10px; font-weight: bold; margin-bottom: 10px; font-size: 10pt; }</style>
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
          <div class="header-left">
            التاريخ: ${currentDate}هـ
          </div>
        </div>

        <div class="title-section">
          <h1>تقرير الإحصائيات والتحليل العام للانضباط</h1>
        </div>

        <div class="pdf-section-title">أولاً: ملخص عام</div>
        <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div style="border: 1.5px solid black; padding: 10px; text-align: center;">
            <h4 style="margin: 0; font-size: 8pt; border-bottom: 1px solid black; padding-bottom: 5px; margin-bottom: 5px;">إجمالي السجلات المسجلة</h4>
            <div style="font-size: 16pt; font-weight: 900;">${stats.totalReports}</div>
          </div>
          <div style="border: 1.5px solid black; padding: 10px; text-align: center;">
            <h4 style="margin: 0; font-size: 8pt; border-bottom: 1px solid black; padding-bottom: 5px; margin-bottom: 5px;">إجمالي حالات الغياب</h4>
            <div style="font-size: 16pt; font-weight: 900;">${stats.absenceCount}</div>
          </div>
          <div style="border: 1.5px solid black; padding: 10px; text-align: center;">
            <h4 style="margin: 0; font-size: 8pt; border-bottom: 1px solid black; padding-bottom: 5px; margin-bottom: 5px;">إجمالي تنبيهات التأخر</h4>
            <div style="font-size: 16pt; font-weight: 900;">${stats.lateCount}</div>
          </div>
        </div>

        <div class="pdf-section-title">ثانياً: قائمة الموظفين الأكثر تسجيلاً</div>
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

        <div class="pdf-section-title">ثالثاً: التوزيع الشهري</div>
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
            <p>يعتمد مدير/ة المدرسة</p>
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

const getLateArrivalHTML = (employee: Employee, report: Report, schoolName: string, principalName: string) => {
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

        <div style="display: flex; justify-content: flex-start; margin-bottom: 10px; width: 100%;">
          <div style="border: 1px solid black; display: flex; align-items: center;">
             <div style="background: #336655; color: white; padding: 2px 10px; font-weight: bold; font-size: 9pt; border-left: 1px solid black;">السجل المدني</div>
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
            <span>المكرم/ة / ${employee.name}</span>
            <span>وفقه/ا الله</span>
          </div>
          <div style="margin: 3px 0; font-weight: bold;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد:</div>
          <p style="margin: 3px 0;">إنه في يوم: ${dayName}، بتاريخ: ${report.date}هـ، اتضح ما يلي:</p>
          
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-weight: bold;">
            <span style="color: #000; font-size: 12pt;">❖</span>
            <span>تأخركم من بداية العمل وحضوركم الساعة ( <span style="border-bottom: 1px dotted black; min-width: 80px; display: inline-block; text-align: center;">${report.lateArrivalTime || '---'}</span> )</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-weight: bold;">
            <span style="color: #000; font-size: 12pt;">❖</span>
            <span>عدم تواجدكم أثناء العمل في الحصة ( <span style="border-bottom: 1px dotted black; min-width: 80px; display: inline-block; text-align: center;">${report.absenceSession || '---'}</span> )</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-weight: bold;">
            <span style="color: #000; font-size: 12pt;">❖</span>
            <span>انصرافكم مبكراً قبل نهاية العمل من الساعة ( <span style="border-bottom: 1px dotted black; min-width: 80px; display: inline-block; text-align: center;">${report.earlyDepartureTime || '---'}</span> )</span>
          </div>

          <p style="margin-top: 10px;">عليه نأمل توضيح أسباب ذلك مع إرفاق ما يؤيد عذركم ،،،،،، ولكم تحياتي</p>
          
          <div class="signature-row">
            <span>مدير/ة المدرسة: ${principalName || '..........'}</span>
            <span>التوقيع: ..........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144 هـ</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="form-body">
          <div style="display: flex; justify-content: space-between;">
             <span>المكرم/ة مدير/ة المدرسة / ${principalName}</span>
             <span>وفقه/ا الله</span>
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

        <div style="border: 1.5px solid black; padding: 8px; margin-top: 5px; font-size: 9pt; font-weight: bold;">
          <div style="text-decoration: underline; margin-bottom: 8px; font-size: 13pt;">رأي مدير/ة المدرسة</div>
          <div>
            <span>( &nbsp;&nbsp;&nbsp; ) عذره/ا مقبول .</span>
          </div>
          <div>
            <span>( &nbsp;&nbsp;&nbsp; ) عذره/ا غير مقبول ويحسم عليه/ا .</span>
          </div>
          <div class="signature-row" style="margin-top: 10px;">
            <span>مدير/ة المدرسة: ${principalName || '..........'}</span>
            <span>التوقيع: ..........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144 هـ</span>
          </div>
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
          <div class="header-left"></div>
        </div>

        <div class="title-section">
          <h1>مساءلة غياب</h1>
          <p>رمز النموذج : ( و . م . ع . ن - 01 - 04 )</p>
        </div>

        <div style="display: flex; justify-content: flex-start; margin-bottom: 10px; width: 100%;">
          <div style="border: 1px solid black; display: flex; align-items: center;">
            <div style="background: #336655; color: white; padding: 2px 10px; font-weight: bold; font-size: 9pt; border-left: 1px solid black;">السجل المدني</div>
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

        <div style="background: #f9f9f9; border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-size: 9.5pt; margin-bottom: 10px;">
          إنه في يوم (${dayName}) بتاريخ (${report.date})هـ تغيبت/تغيبتِ عن العمل إلى يوم (${endDayName})هـ الموافق (${report.endDate || report.date})هـ
        </div>

        <div style="border: 1px solid #eee; padding: 10px; margin-bottom: 10px;">
          <div style="font-weight: 900; margin-bottom: 5px; color: #336655;">(1) طلب الإفادة :</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>الأستاذ/ة : <span style="border-bottom: 1px solid black; min-width: 250px; display: inline-block; text-align: center;" class="dynamic-data">${employee.name}</span></span>
            <span>وفقه/ا الله</span>
          </div>
          <div style="margin-bottom: 6px; font-weight: bold;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد :</div>
          <p style="text-align: justify; margin: 0 0 8px 0;">من خلال متابعة سجل الدوام تبين غيابكم خلال الفترة الموضحة بعالية ، أمل الإفادة عن أسباب ذلك وعليكم تقديم ما يؤيد عذركم خلال أسبوع من تاريخه ، علماً بأنه في حالة عدم الالتزام سيتم اتخاذ اللازم حسب التعليمات .</p>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <span>مدير/ة المدرسة: <span style="color: #336655;" class="dynamic-data">${principalName || '..........'}</span></span>
            <span>التوقيع: .........................</span>
            <span>التاريخ: <span class="dynamic-data">${report.date}هـ</span></span>
          </div>
        </div>

        <div class="divider"></div>

        <div style="border: 1px solid #eee; padding: 10px; margin-bottom: 10px;">
          <div style="font-weight: 900; margin-bottom: 5px; color: #336655;">(2) الإفادة :</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>المكرم/ة مدير/ة المدرسة / <span class="dynamic-data">${principalName}</span></span>
            <span>وفقه/ا الله</span>
          </div>
          <div style="margin-bottom: 6px; font-weight: bold;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد :</div>
          <div>أفيدكم أن غيابي كان للأسباب التالية :</div>
          <div style="border-bottom: 1px dotted black; height: 30px;"></div>
          <div style="border-bottom: 1px dotted black; height: 30px; margin-bottom: 8px;"></div>
          <div style="margin-bottom: 12px; font-weight: bold;">وسأقوم بتقديم ما يثبت ذلك خلال أسبوع من تاريخه .</div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <span style="width: 55%;">الاسم: <span style="border-bottom: 1px solid black; min-width: 200px; display: inline-block; text-align: center;" class="dynamic-data">${employee.name}</span></span>
            <span>التوقيع: .................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 144 هـ</span>
          </div>
        </div>

        <div class="divider"></div>

        <div style="border: 1px solid #eee; padding: 10px; margin-bottom: 10px;">
          <div style="font-weight: 900; margin-bottom: 5px; color: #336655;">(3) قرار مدير/ة المدرسة :</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; font-weight: bold;">
            <div>( &nbsp;&nbsp;&nbsp; ) تحتسب له/ا إجازة مرضية .</div>
            <div>( &nbsp;&nbsp;&nbsp; ) تحتسب له/ا إجازة وفاة .</div>
            <div>( &nbsp;&nbsp;&nbsp; ) تحتسب له/ا إجازة مرافقة .</div>
            <div>( &nbsp;&nbsp;&nbsp; ) يعتمد الحسم لعدم قبول عذره/ا .</div>
            <div style="grid-column: span 2;">( &nbsp;&nbsp;&nbsp; ) يحتسب غيابه/ا من رصيد الإجازات الاضطرارية .</div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <span>الاسم: <span style="color: #336655;" class="dynamic-data">${principalName || '..........'}</span></span>
            <span>التوقيع: .........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 144 هـ</span>
          </div>
        </div>
    </div>`;
};

export const generateBatchForms = async (batch: { employee: Employee, report: Report }[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalNameSetting = await dbUtils.getSetting('principalName') || '..........';

  const formsHTML = batch.map((item, index) => {
    let formContent = '';
    if (item.report.type === 'تأخر_انصراف') {
      formContent = getLateArrivalHTML(item.employee, item.report, schoolName, principalNameSetting);
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
      <style>${getCommonStyles()}</style>
    </head>
    <body>${formsHTML}</body>
    </html>
  `;

  printContent(fullHTML);
};

export const generateLateArrivalDepartureForm = async (employee: Employee, report: Report) => {
    const principalNameSetting = await dbUtils.getSetting('principalName') || '..........';
    const schoolName = await dbUtils.getSetting('schoolName') || '..........';
    const html = getLateArrivalHTML(employee, report, schoolName, principalNameSetting);
    printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateOfficialAbsenceForm = async (employee: Employee, report: Report) => {
    const principalNameSetting = await dbUtils.getSetting('principalName') || '..........';
    const schoolName = await dbUtils.getSetting('schoolName') || '..........';
    const html = getAbsenceHTML(employee, report, schoolName, principalNameSetting);
    printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateEmployeePDF = async (employee: Employee, reports: Report[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const reportRows = reports.map(r => `
    <tr>
      <td>${r.date}</td>
      <td>${r.type === 'تأخر_انصراف' ? 'تنبيه تأخر/انصراف' : 'مساءلة غياب'}</td>
      <td>
        ${r.type === 'غياب' ? (r.daysCount + ' أيام') : 
          r.type === 'تأخر_انصراف' ? (r.lateArrivalTime ? 'حضور: ' + r.lateArrivalTime : 'انصراف مبكر') : '---'}
      </td>
      <td style="text-align: right; padding: 8px;">${r.notes || '---'}</td>
    </tr>
  `).join('');

  const content = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>سجل موظف - ${employee.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        ${getCommonStyles()}
        .emp-info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .emp-info-table td { border: 1.5px solid #000; padding: 8px 12px; font-weight: bold; }
        .label-cell { background: #f2f2f2; width: 20%; color: #336655; font-weight: 900; }
        .value-cell { width: 30%; }
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
          <div class="header-left">
            التاريخ: ${currentDate}هـ
          </div>
        </div>

        <div class="title-section">
          <h1>بيان بحالات ومخالفات الموظف</h1>
        </div>

        <table class="emp-info-table">
          <tr>
            <td class="label-cell">اسم الموظف</td>
            <td class="value-cell" colspan="3">${employee.name}</td>
          </tr>
          <tr>
            <td class="label-cell">السجل المدني</td>
            <td class="value-cell">${employee.civilId || '---'}</td>
            <td class="label-cell">التخصص</td>
            <td class="value-cell">${employee.specialization || '---'}</td>
          </tr>
          <tr>
            <td class="label-cell">رقم الوظيفة</td>
            <td class="value-cell">${employee.employeeCode || '---'}</td>
            <td class="label-cell">العمل الحالي</td>
            <td class="value-cell">${employee.workplace || '---'}</td>
          </tr>
        </table>

        <div style="font-weight: 900; margin-bottom: 10px; border-right: 4px solid #336655; padding-right: 10px; color: #336655;">تفاصيل السجل التاريخي:</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 15%;">التاريخ</th>
              <th style="width: 20%;">نوع الحالة</th>
              <th style="width: 20%;">التفاصيل / المدة</th>
              <th style="width: 45%;">الملاحظات والأسباب</th>
            </tr>
          </thead>
          <tbody>
            ${reportRows || '<tr><td colspan="4">لا توجد سجلات مسجلة لهذا الموظف</td></tr>'}
          </tbody>
        </table>

        <div class="signature-section">
          <div style="text-align: center;">
            <p>معد السجل</p>
            <p>................................</p>
            <p>التوقيع: .....................</p>
          </div>
          <div style="text-align: center;">
            <p>يعتمد مدير/ة المدرسة</p>
            <p>${principalName}</p>
            <p>التوقيع: ...........................</p>
          </div>
        </div>

        <div style="margin-top: 30px; font-size: 8pt; color: #666; text-align: center; border-top: 1px solid #eee; pt-10px;">
          تم توليد هذا التقرير آلياً عبر نظام شؤون الموظفين الذكي بتاريخ ${currentDate}
        </div>
      </div>
    </body>
    </html>
  `;
  printContent(content);
};
