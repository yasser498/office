
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
  .footer-notice { font-size: 9pt; font-weight: 900; margin-top: 5px; color: #000; }
  .important-notes { margin-top: 8px; border: 1px solid black; padding: 6px; font-size: 9pt; }
  .important-notes-title { font-weight: 900; text-decoration: underline; margin-bottom: 2px; font-size: 11pt; }
  .important-notes-list { margin: 0; padding-right: 15px; font-weight: 700; }
`;

const getLateArrivalHTML = (employee: Employee, report: Report, schoolName: string, principalName: string) => {
  const dayName = getArabicDayName(report.date);
  const civilId = String(employee.civilId || '').padStart(10, ' ').slice(-10);
  const civilIdHtml = civilId.split('').map(num => `<div class="digit">${num.trim() || '&nbsp;'}</div>`).join('');

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

        <div style="display: flex; align-items: center; margin-bottom: 8px;">
           <div style="background: #336655; color: white; padding: 2px 8px; font-weight: 900; border: 1.2px solid black; border-left: none; font-size: 9pt;">السجل المدني</div>
           <div class="civil-id-box" style="border: 1.2px solid black; padding: 2px; background: #eee;">${civilIdHtml}</div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 35%;">الاسم</th>
              <th>التخصص</th>
              <th>المستوى/المرتبة</th>
              <th>رقم الوظيفة</th>
              <th>العمل الحالي</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${employee.name}</td>
              <td>${employee.specialization || '---'}</td>
              <td>${employee.level || '---'}</td>
              <td>${employee.employeeCode || '---'}</td>
              <td>${employee.workplace || '---'}</td>
            </tr>
          </tbody>
        </table>

        <div>
          <div class="signature-row">
            <span>المكرم/ة الأستاذ/ة: <span class="dynamic-data">${employee.name}</span></span>
            <span>وفقه/ا الله</span>
          </div>
          <div style="font-weight: 900; margin: 2px 0;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد:</div>
          <p style="margin: 2px 0; font-weight: 700;">إنه في يوم: <span class="dynamic-data">${dayName}</span>، بتاريخ: <span class="dynamic-data">${report.date}</span>، اتضح لنا ما يلي:</p>
          
          <div style="margin-right: 15px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px; font-weight: 900;">
              <span style="font-size: 11pt;">❑</span>
              <span>تأخركم من بداية الدوام وحضوركم الساعة ( <span style="border-bottom: 1.5px solid black; min-width: 70px; display: inline-block; text-align: center;">${report.lateArrivalTime || '---'}</span> )</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px; font-weight: 900;">
              <span style="font-size: 11pt;">❑</span>
              <span>عدم تواجدكم أثناء العمل في الحصة ( <span style="border-bottom: 1.5px solid black; min-width: 70px; display: inline-block; text-align: center;">${report.absenceSession || '---'}</span> )</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px; font-weight: 900;">
              <span style="font-size: 11pt;">❑</span>
              <span>انصرافكم مبكراً قبل نهاية الدوام من الساعة ( <span style="border-bottom: 1.5px solid black; min-width: 70px; display: inline-block; text-align: center;">${report.earlyDepartureTime || '---'}</span> )</span>
            </div>
          </div>

          ${report.notes ? `<div class="notes-box"><b>ملاحظات الإدارة:</b> ${report.notes}</div>` : ''}

          <p style="margin-top: 5px; font-weight: 700;">نأمل توضيح أسباب ذلك مع إرفاق ما يؤيد عذركم ،،،،،، ولكم تحياتي</p>
          
          <div class="signature-row">
            <span>مدير/ة المدرسة: <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: ..........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144</span>
          </div>
        </div>

        <div class="divider"></div>

        <div>
          <div class="section-label">إفادة الموظف:</div>
          <div class="signature-row">
             <span>المكرم/ة مدير/ة المدرسة / <span class="dynamic-data">${principalName}</span></span>
             <span>وفقه/ا الله</span>
          </div>
          <p style="margin: 2px 0; font-weight: 700;">أفيدكم أن أسباب ذلك هي :</p>
          <div style="border-bottom: 1px dotted black; height: 28px;"></div>
          <div style="border-bottom: 1px dotted black; height: 28px;"></div>
          
          <div class="signature-row" style="margin-top: 8px;">
            <span>الاسم: <span class="dynamic-data">${employee.name}</span></span>
            <span>التوقيع: ..........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144</span>
          </div>
        </div>

        <div style="border: 2px solid black; padding: 6px; margin-top: 6px; background: #fdfdfd;">
          <div class="section-label" style="text-decoration: underline; color: black; margin-bottom: 4px;">رأي مدير/ة المدرسة:</div>
          <div style="display: flex; flex-direction: column; gap: 5px; font-weight: 900; margin-bottom: 5px; font-size: 9pt;">
            <label> ( &nbsp;&nbsp; ) عذره/ا مقبول </label>
            <label> ( &nbsp;&nbsp; ) عذره/ا غير مقبول ويحسم عليه/ا </label>
          </div>
          <div class="signature-row">
            <span>مدير/ة المدرسة: <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: ..........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144</span>
          </div>
        </div>
        <div class="footer-notice">* ملاحظة : ترفق بطاقة المسائلة مع أصل القرار في حالة عدم قبول العذر لحفظها بملفه بالإدارة ، أصله لملفه بالمدرسة.</div>
    </div>`;
};

const getAbsenceHTML = (employee: Employee, report: Report, schoolName: string, principalName: string) => {
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

        <div style="display: flex; align-items: center; margin-bottom: 8px;">
           <div style="background: #336655; color: white; padding: 2px 8px; font-weight: 900; border: 1.2px solid black; border-left: none; font-size: 9pt;">السجل المدني</div>
           <div class="civil-id-box" style="border: 1.2px solid black; padding: 2px; background: #eee;">${civilIdHtml}</div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 32%;">الاسم</th>
              <th>التخصص</th>
              <th>المستوى</th>
              <th>الدرجة</th>
              <th>رقم الوظيفة</th>
              <th>الأيام</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${employee.name}</td>
              <td>${employee.specialization || '---'}</td>
              <td>${employee.level || '---'}</td>
              <td>${employee.grade || '---'}</td>
              <td>${employee.employeeCode || '---'}</td>
              <td style="font-size: 10pt; font-weight: 900;">${report.daysCount || '1'}</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #f2f2f2; border: 1.5 solid #000; padding: 5px; text-align: center; font-weight: 900; font-size: 9pt; margin-bottom: 8px;">
          إنه في يوم (<span class="dynamic-data">${dayName}</span>) بتاريخ (<span class="dynamic-data">${report.date}</span>) تغيبت/تغيبت عن العمل إلى يوم (<span class="dynamic-data">${endDayName}</span>) الموافق (<span class="dynamic-data">${report.endDate || report.date}</span>)
        </div>

        <div style="border: 1px solid #000; padding: 8px; margin-bottom: 5px;">
          <div class="section-label">(1) طلب الإفادة :</div>
          <div class="signature-row">
            <span>الأستاذ/ة : <span class="dynamic-data" style="border-bottom: 1.5px solid black; padding: 0 10px;">${employee.name}</span></span>
            <span>وفقه/ا الله</span>
          </div>
          <div style="margin-bottom: 3px; font-weight: bold;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد :</div>
          <p style="text-align: justify; margin: 4px 0; font-weight: 700;">من خلال متابعة سجل الدوام تبين غيابكم خلال الفترة الموضحة أعلاه ، نأمل الإفادة عن أسباب ذلك وتقديم ما يؤيد عذركم خلال أسبوع من تاريخه.</p>
          
          ${report.notes ? `<div class="notes-box"><b>ملاحظات الإدارة:</b> ${report.notes}</div>` : ''}

          <div class="signature-row" style="margin-top: 8px;">
            <span>مدير/ة المدرسة: <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: .........................</span>
            <span>تاريخ الطلب: <span class="dynamic-data">${report.date}</span></span>
          </div>
        </div>

        <div class="divider"></div>

        <div style="border: 1px solid #000; padding: 8px; margin-bottom: 5px;">
          <div class="section-label">(2) الإفادة :</div>
          <div class="signature-row">
            <span>المكرم/ة مدير/ة المدرسة / <span class="dynamic-data">${principalName}</span></span>
            <span>وفقه/ا الله</span>
          </div>
          <p style="margin: 2px 0; font-weight: 700;">أفيدكم أن غيابي كان للأسباب التالية :</p>
          <div style="border-bottom: 1px dotted black; height: 28px;"></div>
          <div style="border-bottom: 1px dotted black; height: 28px;"></div>
          <div class="signature-row" style="margin-top: 8px;">
            <span style="width: 55%;">الاسم: <span class="dynamic-data">${employee.name}</span></span>
            <span>التوقيع: .................</span>
            <span>تاريخ الإفادة: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144</span>
          </div>
        </div>

        <div style="border: 2px solid #000; padding: 8px; background: #fafafa;">
          <div class="section-label">(3) قرار مدير/ة المدرسة :</div>
          <div style="display: flex; flex-direction: column; gap: 5px; margin: 5px 0; font-weight: 900; font-size: 9pt;">
            <div>❑ تحتسب له/ا إجازة مرضية بعد التأكد من نظامية التقرير.</div>
            <div>❑ تحتسب له/ا إجازة وفاة.</div>
            <div>❑ تحتسب له/ا إجازة مرافقة.</div>
            <div>❑ يحتسب غيابه/ا من رصيده/ا للإجازات الاضطرارية لقبول عذره/ا إذا كان رصيده/ا يسمح وإلا يحسم عليه/ا.</div>
            <div>❑ يعتمد الحسم لعدم قبول عذره/ا.</div>
          </div>
          <div class="signature-row" style="margin-top: 8px;">
            <span>مدير/ة المدرسة: <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: .........................</span>
            <span>تاريخ القرار: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144</span>
          </div>
        </div>

        <div class="important-notes">
          <div class="important-notes-title">ملاحظات هامة:</div>
          <ol class="important-notes-list">
            <li>تستكمل الاستمارة من المدير المباشر وإصدار القرار بموجبه.</li>
            <li>إذا سبق عطلة نهاية الأسبوع غياب وألحقها غياب تحتسب مدة الغياب كاملة.</li>
            <li>يجب أن يوضح المتغيب أسباب غيابه فور تسلمه الاستمارة ويعيدها لمدير المباشر.</li>
            <li>يعطى المتغيب مدة أسبوع لتقديم ما يفيد عذره فإذا انقضت المدة الزمنية تستكمل الاستمارة ويتم الحسم.</li>
          </ol>
        </div>
    </div>`;
};

export const generateStatisticsPDF = async (stats: any, schoolName: string, principalName: string) => {
  const currentDate = new Date().toLocaleDateString('ar-SA');
  const topEmployees = stats.topEmployees || [];
  const firstPageLimit = 22;
  const subsequentPagesLimit = 40;
  
  const pages: any[][] = [];
  if (topEmployees.length > 0) {
    pages.push(topEmployees.slice(0, firstPageLimit));
    let remaining = topEmployees.slice(firstPageLimit);
    while (remaining.length > 0) {
      pages.push(remaining.slice(0, subsequentPagesLimit));
      remaining = remaining.slice(subsequentPagesLimit);
    }
  } else {
    pages.push([]);
  }

  const renderHeader = (isContinued: boolean) => `
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
        التاريخ: ${currentDate}
      </div>
    </div>
    <div class="title-section">
      <h1>تقرير الإحصائيات والتحليل العام للانضباط ${isContinued ? '(تابع)' : ''}</h1>
    </div>
  `;

  const renderTableColumn = (items: any[], startIdx: number) => `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 15%;">م</th>
          <th style="width: 60%;">الاسم</th>
          <th style="width: 25%;">السجلات</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
          <tr>
            <td>${startIdx + idx + 1}</td>
            <td style="text-align: right; font-size: 8pt;">${item.employee?.name}</td>
            <td>${item.count}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  let fullPagesHTML = '';
  pages.forEach((pageItems, pageIdx) => {
    const isFirstPage = pageIdx === 0;
    let pageContent = `<div class="page-container">`;
    pageContent += renderHeader(!isFirstPage);
    if (isFirstPage) {
      pageContent += `
        <div class="pdf-section-title">أولاً: ملخص عام للمدرسة</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div style="border: 1.5px solid black; padding: 6px; text-align: center;">
            <h4 style="margin: 0; font-size: 8pt; border-bottom: 1px solid black; padding-bottom: 3px; margin-bottom: 3px;">إجمالي السجلات</h4>
            <div style="font-size: 13pt; font-weight: 900;">${stats.totalReports}</div>
          </div>
          <div style="border: 1.5px solid black; padding: 6px; text-align: center;">
            <h4 style="margin: 0; font-size: 8pt; border-bottom: 1px solid black; padding-bottom: 3px; margin-bottom: 3px;">حالات الغياب</h4>
            <div style="font-size: 13pt; font-weight: 900;">${stats.absenceCount}</div>
          </div>
          <div style="border: 1.5px solid black; padding: 6px; text-align: center;">
            <h4 style="margin: 0; font-size: 8pt; border-bottom: 1px solid black; padding-bottom: 3px; margin-bottom: 3px;">تنبيهات التأخر</h4>
            <div style="font-size: 13pt; font-weight: 900;">${stats.lateCount}</div>
          </div>
        </div>
        <div class="pdf-section-title">ثانياً: الموظفون الأكثر تسجيلاً (قائمة المتابعة)</div>
      `;
    } else {
      pageContent += `<div class="pdf-section-title">تابع: الموظفون الأكثر تسجيلاً (قائمة المتابعة)</div>`;
    }
    
    if (pageItems.length > 0) {
      const mid = Math.ceil(pageItems.length / 2);
      const leftCol = pageItems.slice(0, mid);
      const rightCol = pageItems.slice(mid);
      const startIdxOffset = isFirstPage ? 0 : firstPageLimit + (pageIdx - 1) * subsequentPagesLimit;
      pageContent += `
        <div class="two-column-layout">
          <div class="column">${renderTableColumn(leftCol, startIdxOffset)}</div>
          <div class="column">${rightCol.length > 0 ? renderTableColumn(rightCol, startIdxOffset + mid) : ''}</div>
        </div>
      `;
    }
    
    if (pageIdx === pages.length - 1) {
      pageContent += `
        <div class="signature-section" style="margin-top: 15px; display: flex; justify-content: space-between; font-weight: 900;">
          <div style="text-align: center;">
            <p>معد التقرير</p>
            <p>................................</p>
          </div>
          <div style="text-align: center;">
            <p>مدير/ة المدرسة</p>
            <p>${principalName}</p>
            <p>التوقيع: ...........................</p>
          </div>
        </div>
      `;
    }
    pageContent += `</div>`;
    fullPagesHTML += pageContent;
  });

  const finalHTML = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${fullPagesHTML}</body></html>`;
  printContent(finalHTML);
};

export const generateBatchForms = async (batch: { employee: Employee, report: Report }[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const principalNameSetting = await dbUtils.getSetting('principalName') || '..........';
  const formsHTML = batch.map((item) => {
    return item.report.type === 'تأخر_انصراف' 
      ? getLateArrivalHTML(item.employee, item.report, schoolName, principalNameSetting)
      : getAbsenceHTML(item.employee, item.report, schoolName, principalNameSetting);
  }).join('');
  const fullHTML = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${formsHTML}</body></html>`;
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
      <td>${r.type === 'تأخر_انصراف' ? 'تنبيه تأخر' : 'مساءلة غياب'}</td>
      <td>${r.type === 'غياب' ? (r.daysCount + ' أيام') : (r.lateArrivalTime || 'تأخر/انصراف')}</td>
      <td style="text-align: right;">${r.notes || '---'}</td>
    </tr>
  `).join('');
  
  const content = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head>
    <body><div class="page-container">
      <div class="header">
        <div class="header-info"><div>المملكة العربية السعودية</div><div>وزارة التعليم</div><div>${schoolName}</div></div>
        <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
        <div class="header-left">التاريخ: ${currentDate}</div>
      </div>
      <div class="title-section"><h1>بيان بحالات ومخالفات الموظف</h1></div>
      <table class="data-table">
        <tr><th style="width:20%;">اسم الموظف</th><td colspan="3" style="text-align:right;">${employee.name}</td></tr>
        <tr><th>السجل المدني</th><td>${employee.civilId || '---'}</td><th>رقم الوظيفة</th><td>${employee.employeeCode || '---'}</td></tr>
      </table>
      <table class="data-table">
        <thead><tr><th>التاريخ</th><th>النوع</th><th>التفاصيل</th><th>الملاحظات</th></tr></thead>
        <tbody>${reportRows}</tbody>
      </table>
      <div class="signature-section" style="margin-top: 15px; display: flex; justify-content: space-between; font-weight: 900;">
        <div style="text-align:center;"><p>مدير/ة المدرسة</p><p>${principalName}</p></div>
      </div>
    </div></body></html>`;
  printContent(content);
};
