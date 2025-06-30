const installmentsInputs = document.getElementById('installmentsInputs');
let VAT_RATE = 0.07; // เปลี่ยนเป็นตัวแปรที่สามารถปรับได้

// Precise rounding function to avoid floating point errors
function preciseRound(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

// Alert System
function showAlert(message, type = 'error') {
  const alertContainer = document.getElementById('alertContainer');
  const alertBox = document.getElementById('alertBox');
  const alertIcon = document.getElementById('alertIcon');
  const alertMessage = document.getElementById('alertMessage');
  
  const types = {
    success: { bg: 'bg-green-100 border-green-400 text-green-700', icon: '✅' },
    error: { bg: 'bg-red-100 border-red-400 text-red-700', icon: '❌' },
    warning: { bg: 'bg-yellow-100 border-yellow-400 text-yellow-700', icon: '⚠️' },
    info: { bg: 'bg-blue-100 border-blue-400 text-blue-700', icon: 'ℹ️' }
  };
  
  const style = types[type] || types.error;
  alertBox.className = `p-4 rounded-lg flex items-center space-x-3 border-l-4 ${style.bg}`;
  alertIcon.textContent = style.icon;
  alertMessage.textContent = message;
  alertContainer.classList.remove('hidden');
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    alertContainer.classList.add('hidden');
  }, 5000);
}

// Hide alert
document.getElementById('alertClose').addEventListener('click', () => {
  document.getElementById('alertContainer').classList.add('hidden');
});

function resetForm() {
  if (confirm('ต้องการเริ่มใหม่หรือไม่?')) {
    document.getElementById('calcForm').reset();
    document.getElementById('totalBeforeVAT').value = '';
    document.getElementById('whtRate').value = '3';
    document.getElementById('vatRate').value = '7';
    document.getElementById('result').classList.add('hidden');
    document.getElementById('exportResults').classList.add('hidden');
    initializeInstallments();
    showAlert('เริ่มใหม่เรียบร้อยแล้ว', 'success');
  }
}

function formatNumberWithComma(num) {
  return num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function formatNumberInput(value) {
  if (!value) return '';
  
  // Handle decimal places
  const parts = value.toString().split('.');
  let integerPart = parts[0].replace(/\D/g, '');
  if (integerPart === '') return '';
  
  // Format with commas
  let formatted = Number(integerPart).toLocaleString('en-US');
  
  if (parts.length > 1) {
    let decimalPart = parts[1].replace(/\D/g, '').slice(0, 2);
    formatted += '.' + decimalPart;
  }
  
  return formatted;
}

function parseNumberFromInput(value) {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Enhanced validation
function validateInput(value, min = 0, max = Infinity, fieldName = 'ค่า') {
  const num = parseNumberFromInput(value);
  
  if (isNaN(num)) {
    throw new Error(`${fieldName}ต้องเป็นตัวเลข`);
  }
  
  if (num < min) {
    throw new Error(`${fieldName}ต้องมากกว่าหรือเท่ากับ ${min}`);
  }
  
  if (num > max) {
    throw new Error(`${fieldName}ต้องน้อยกว่าหรือเท่ากับ ${max}`);
  }
  
  return num;
}

function addCommaInputListener(input) {
  input.addEventListener('input', e => {
    const cursorPos = input.selectionStart;
    const originalLength = input.value.length;

    let value = input.value.replace(/,/g, '');
    if (value === '') {
      input.value = '';
      return;
    }
    
    // Allow decimal point and numbers only
    if (!/^\d*\.?\d*$/.test(value)) {
      value = value.replace(/[^\d.]/g, '');
    }
    
    if (value !== '' && !isNaN(value)) {
      input.value = formatNumberInput(value);
    } else if (value === '') {
      input.value = '';
    }

    const newLength = input.value.length;
    const diff = newLength - originalLength;
    input.selectionEnd = cursorPos + diff;
  });

  // Add blur validation
  input.addEventListener('blur', e => {
    const value = parseNumberFromInput(input.value);
    if (value > 0) {
      input.value = formatNumberWithComma(value);
    }
  });
}

function createInstallmentInput(index) {
  const div = document.createElement('div');
  div.className = 'flex items-center space-x-3 installment-row bg-gray-50 p-3 rounded-lg';

  const label = document.createElement('label');
  label.textContent = `งวดที่ ${index + 1}`;
  label.className = 'flex-shrink-0 w-20 font-medium text-gray-700';

  const input = document.createElement('input');
  input.type = 'text';
  input.required = true;
  input.value = '100'; // เริ่มต้นด้วย 100%
  input.className = 'flex-grow p-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-bold';
  input.placeholder = 'ใส่เปอร์เซ็นต์';

  const percentLabel = document.createElement('span');
  percentLabel.textContent = '%';
  percentLabel.className = 'text-gray-500 font-medium';

  // Add percentage validation
  input.addEventListener('input', e => {
    let value = input.value.replace(/[^\d.]/g, '');
    if (value > 100) value = '100';
    input.value = value;
    updateInstallmentSummary();
  });

  addCommaInputListener(input);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.textContent = '❌';
  deleteBtn.className = 'px-2 py-1 text-red-500 hover:bg-red-50 rounded flex-shrink-0 text-sm';
  deleteBtn.title = 'ลบงวดนี้';
  deleteBtn.addEventListener('click', () => {
    if (installmentsInputs.children.length > 1) {
      div.remove();
      updateInstallmentLabels();
      redistributePercentages();
    } else {
      showAlert('ต้องมีอย่างน้อย 1 งวด', 'warning');
    }
  });

  div.appendChild(label);
  div.appendChild(input);
  div.appendChild(percentLabel);
  div.appendChild(deleteBtn);

  return div;
}

function updateInstallmentLabels() {
  const rows = installmentsInputs.querySelectorAll('.installment-row');
  rows.forEach((row, index) => {
    const label = row.querySelector('label');
    label.textContent = `งวดที่ ${index + 1} (%)`;
  });
}

function updateInstallmentSummary() {
  const inputs = installmentsInputs.querySelectorAll('input');
  
  if (inputs.length === 0) {
    // ถ้าไม่มีงวดเลย แสดงข้อความแจ้งเตือน
    let existingSummary = document.getElementById('installmentSummary');
    
    if (!existingSummary) {
      existingSummary = document.createElement('div');
      existingSummary.id = 'installmentSummary';
      existingSummary.className = 'text-sm font-medium text-center mt-2 p-2 rounded';
      installmentsInputs.parentNode.insertBefore(existingSummary, installmentsInputs.nextSibling);
    }
    
    existingSummary.textContent = 'กรุณากดปุ่ม "เพิ่ม" เพื่อเพิ่มงวดชำระ';
    existingSummary.className = 'text-sm font-medium text-center mt-2 p-2 rounded bg-orange-100 text-orange-700';
    return;
  }
  
  const total = Array.from(inputs).reduce((sum, input) => {
    return sum + parseNumberFromInput(input.value);
  }, 0);
  
  // Show percentage summary
  const summaryText = `รวม: ${total.toFixed(2)}% (${inputs.length} งวด)`;
  let existingSummary = document.getElementById('installmentSummary');
  
  if (!existingSummary) {
    existingSummary = document.createElement('div');
    existingSummary.id = 'installmentSummary';
    existingSummary.className = 'text-sm font-medium text-center mt-2 p-2 rounded';
    installmentsInputs.parentNode.insertBefore(existingSummary, installmentsInputs.nextSibling);
  }
  
  existingSummary.textContent = summaryText;
  
  if (Math.abs(total - 100) < 0.02) { // เพิ่ม tolerance เป็น 0.02
    existingSummary.className = 'text-sm font-medium text-center mt-2 p-2 rounded bg-green-100 text-green-700';
  } else {
    existingSummary.className = 'text-sm font-medium text-center mt-2 p-2 rounded bg-red-100 text-red-700';
  }
}

function equalInstallments() {
  const count = installmentsInputs.children.length;
  
  if (count === 0) {
    showAlert('กรุณาเพิ่มงวดก่อนใช้งานฟังก์ชันนี้', 'warning');
    return;
  }
  
  redistributePercentages();
  
  const equalPercent = parseFloat((100 / count).toFixed(2));
  const lastPercent = parseFloat((100 - (equalPercent * (count - 1))).toFixed(2));
  
  showAlert(`แบ่งเป็น ${count} งวด (งวดแรก ${count-1} งวด: ${equalPercent}%, งวดสุดท้าย: ${lastPercent}%)`, 'success');
}

function initializeInstallments() {
  installmentsInputs.innerHTML = '';
  // เริ่มต้นด้วย 1 งวดที่ 100%
  installmentsInputs.appendChild(createInstallmentInput(0));
  updateInstallmentSummary();
}

// Function to redistribute percentages automatically
function redistributePercentages() {
  const inputs = installmentsInputs.querySelectorAll('input');
  const count = inputs.length;
  
  if (count > 0) {
    const equalPercent = parseFloat((100 / count).toFixed(2));
    let remainingPercent = 100;
    
    // ใส่เปอร์เซ็นต์เท่าๆ กันในงวดแรกๆ
    inputs.forEach((input, index) => {
      if (index < count - 1) {
        input.value = equalPercent.toFixed(2);
        remainingPercent -= equalPercent;
      } else {
        // งวดสุดท้ายได้ส่วนที่เหลือเพื่อให้รวมเป็น 100% พอดี
        input.value = remainingPercent.toFixed(2);
      }
    });
    
    updateInstallmentSummary();
  }
}

// Enhanced Export Functions
function exportToExcel(results) {
  try {
    const calculationMethod = document.getElementById('calculationMethod').value;
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // All methods now include withholding tax
    csvContent += "งวดชำระ,ยอดก่อน VAT (บาท),VAT 7% (บาท),หัก ณ ที่จ่าย (บาท),ยอดชำระสุทธิ (บาท)\n";
    results.forEach(r => {
      csvContent += `ครั้งที่ ${r.installment},${r.beforeVAT.toFixed(2)},${r.vat.toFixed(2)},${r.withholding.toFixed(2)},${r.net.toFixed(2)}\n`;
    });
    
    // Add summary
    const sumBeforeVAT = results.reduce((a,b) => a + b.beforeVAT, 0);
    const sumVAT = results.reduce((a,b) => a + b.vat, 0);
    const sumWithholding = results.reduce((a,b) => a + b.withholding, 0);
    const sumNet = results.reduce((a,b) => a + b.net, 0);
    csvContent += `รวม,${sumBeforeVAT.toFixed(2)},${sumVAT.toFixed(2)},${sumWithholding.toFixed(2)},${sumNet.toFixed(2)}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VAT_Calculation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('ส่งออกไฟล์ Excel เรียบร้อยแล้ว', 'success');
  } catch (error) {
    showAlert('เกิดข้อผิดพลาดในการส่งออกไฟล์', 'error');
  }
}

function copyResultsToClipboard(results) {
  try {
    const calculationMethod = document.getElementById('calculationMethod').value;
    let text = "ผลลัพธ์การคำนวณ VAT + หัก ณ ที่จ่าย\n";
    text += "=" .repeat(50) + "\n\n";
    
    // All methods now include withholding tax
    results.forEach(r => {
      text += `ครั้งที่ ${r.installment}:\n`;
      text += `  ยอดก่อน VAT: ${formatNumberWithComma(r.beforeVAT)} บาท\n`;
      text += `  VAT 7%: ${formatNumberWithComma(r.vat)} บาท\n`;
      text += `  หัก ณ ที่จ่าย: ${formatNumberWithComma(r.withholding)} บาท\n`;
      text += `  ยอดชำระสุทธิ: ${formatNumberWithComma(r.net)} บาท\n\n`;
    });
    
    const sumBeforeVAT = results.reduce((a, b) => a + b.beforeVAT, 0);
    const sumVAT = results.reduce((a, b) => a + b.vat, 0);
    const sumWithholding = results.reduce((a, b) => a + b.withholding, 0);
    const sumNet = results.reduce((a, b) => a + b.net, 0);
    
    text += "รวมทั้งหมด:\n";
    text += `  ยอดก่อน VAT: ${formatNumberWithComma(sumBeforeVAT)} บาท\n`;
    text += `  VAT: ${formatNumberWithComma(sumVAT)} บาท\n`;
    text += `  หัก ณ ที่จ่าย: ${formatNumberWithComma(sumWithholding)} บาท\n`;
    text += `  ยอดสุทธิ: ${formatNumberWithComma(sumNet)} บาท\n`;
    
    navigator.clipboard.writeText(text).then(() => {
      showAlert('คัดลอกผลลัพธ์เรียบร้อยแล้ว', 'success');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showAlert('คัดลอกผลลัพธ์เรียบร้อยแล้ว', 'success');
    });
  } catch (error) {
    showAlert('เกิดข้อผิดพลาดในการคัดลอก', 'error');
  }
}

function printResults() {
  const printWindow = window.open('', '_blank');
  const resultContent = document.getElementById('result').innerHTML;
  
  printWindow.document.write(`
    <html>
      <head>
        <title>ผลลัพธ์การคำนวณ VAT</title>
        <style>
          body { font-family: 'Sarabun', Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; text-align: center; }
          .no-print { display: none; }
        </style>
      </head>
      <body>
        <h1 style="text-align: center;">ผลลัพธ์การคำนวณ VAT + หัก ณ ที่จ่าย</h1>
        <p style="text-align: center;">พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
        ${resultContent}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.print();
}

// Event Listeners
document.getElementById('addInstallment').addEventListener('click', () => {
  const count = installmentsInputs.children.length;
  if (count >= 20) {
    showAlert('เพิ่มงวดได้สูงสุด 20 งวด', 'warning');
    return;
  }
  const newInput = createInstallmentInput(count);
  installmentsInputs.appendChild(newInput);
  redistributePercentages(); // แบ่งเปอร์เซ็นต์อัตโนมัติ
});

document.getElementById('removeInstallment').addEventListener('click', () => {
  const count = installmentsInputs.children.length;
  if (count <= 1) {
    showAlert('ต้องมีอย่างน้อย 1 งวด', 'warning');
    return;
  }
  installmentsInputs.removeChild(installmentsInputs.lastChild);
  updateInstallmentLabels();
  redistributePercentages(); // แบ่งเปอร์เซ็นต์อัตโนมัติ
});

document.getElementById('equalInstallments').addEventListener('click', equalInstallments);

// Data management buttons
document.getElementById('resetForm').addEventListener('click', resetForm);

// Result buttons
document.getElementById('exportResults').addEventListener('click', () => {
  if (window.currentResults) {
    exportToExcel(window.currentResults);
  }
});

document.getElementById('copyResults').addEventListener('click', () => {
  if (window.currentResults) {
    copyResultsToClipboard(window.currentResults);
  }
});

document.getElementById('printResults').addEventListener('click', printResults);

// Enhanced input listeners
const totalBeforeVATInput = document.getElementById('totalBeforeVAT');
addCommaInputListener(totalBeforeVATInput);

const whtRateInput = document.getElementById('whtRate');
addCommaInputListener(whtRateInput);

const vatRateInput = document.getElementById('vatRate');
addCommaInputListener(vatRateInput);

// Add calculation method change listener
document.getElementById('calculationMethod').addEventListener('change', function() {
  const whtRateInput = document.getElementById('whtRate');
  const whtRateContainer = whtRateInput.closest('div');
  
  // All methods now use withholding tax, so keep it enabled
  whtRateInput.disabled = false;
  whtRateInput.style.backgroundColor = '';
  whtRateInput.style.color = '';
  whtRateContainer.querySelector('label').style.color = '';
  whtRateContainer.querySelector('small').style.color = '';
});

// Initialize the calculation method handler
document.getElementById('calculationMethod').dispatchEvent(new Event('change'));

// VAT rate change listener
vatRateInput.addEventListener('input', () => {
  VAT_RATE = parseNumberFromInput(vatRateInput.value) / 100;
});

// Enhanced form submission
document.getElementById('calcForm').addEventListener('submit', e => {
  e.preventDefault();

  try {
    // Validate inputs with enhanced error handling
    const totalBeforeVAT = validateInput(
      totalBeforeVATInput.value, 
      0.01, 
      999999999, 
      'ยอดรวมก่อน VAT'
    );

    const whtRate = validateInput(
      whtRateInput.value, 
      0, 
      100, 
      'อัตราหัก ณ ที่จ่าย'
    ) / 100;

    VAT_RATE = validateInput(
      vatRateInput.value, 
      0, 
      100, 
      'อัตรา VAT'
    ) / 100;

    const calculationMethod = document.getElementById('calculationMethod').value;

    const inputs = installmentsInputs.querySelectorAll('input');
    
    if (inputs.length === 0) {
      throw new Error('กรุณาเพิ่มอย่างน้อย 1 งวดก่อนคำนวณ');
    }
    
    const portions = Array.from(inputs).map((input, index) => {
      const value = validateInput(input.value, 0.01, 100, `งวดที่ ${index + 1}`); // ต้องมากกว่า 0
      return value;
    });

    const totalPortion = portions.reduce((a, b) => a + b, 0);
    if (Math.abs(totalPortion - 100) > 0.02) { // เพิ่ม tolerance เป็น 0.02
      throw new Error(`สัดส่วนงวดรวมต้องเท่ากับ 100% (ตอนนี้รวม ${totalPortion.toFixed(2)}%)`);
    }

    // Enhanced calculation with correct formulas based on user examples
    const results = portions.map((portion, i) => {
      let beforeVAT, vat, withholding, net;
      const portionAmount = totalBeforeVAT * portion / 100;

      switch (calculationMethod) {
        case 'A': // 1. จากราคาก่อน VAT
          // Example: 1,000,000 + 70,000 - 30,000 = 1,040,000
          beforeVAT = portionAmount;
          vat = beforeVAT * VAT_RATE;
          withholding = beforeVAT * whtRate; // หักภาษี 3% จากราคาก่อน VAT
          net = beforeVAT + vat - withholding;
          break;
          
        case 'B': // 2. จากราคารวม VAT
          // Example: จากราคารวม VAT 1,000,000 ย้อนกลับหาราคาก่อน VAT
          const totalWithVAT = portionAmount; // Input เป็นราคารวม VAT
          beforeVAT = totalWithVAT / (1 + VAT_RATE);
          vat = totalWithVAT - beforeVAT;
          withholding = beforeVAT * whtRate; // หักภาษี 3% จากราคาก่อน VAT
          net = totalWithVAT - withholding;
          break;
          
        case 'C': // 3. จากราคารับสุทธิ รวม VAT รวม หัก ณ ที่จ่ายในยอด
          // Example: จากยอดสุทธิ 1,000,000 ย้อนกลับหาราคาก่อน VAT
          const netAmount = portionAmount; // Input เป็นยอดสุทธิ
          
          // สูตร: netAmount = beforeVAT + VAT - withholding
          // netAmount = beforeVAT + (beforeVAT * VAT_RATE) - (beforeVAT * whtRate)
          // netAmount = beforeVAT * (1 + VAT_RATE - whtRate)
          // beforeVAT = netAmount / (1 + VAT_RATE - whtRate)
          
          beforeVAT = netAmount / (1 + VAT_RATE - whtRate);
          vat = beforeVAT * VAT_RATE;
          withholding = beforeVAT * whtRate;
          net = beforeVAT + vat - withholding;
          break;
          
        default:
          // Default to method A
          beforeVAT = portionAmount;
          vat = beforeVAT * VAT_RATE;
          withholding = beforeVAT * whtRate;
          net = beforeVAT + vat - withholding;
      }

      return { installment: i + 1, 
               beforeVAT: preciseRound(beforeVAT), 
               vat: preciseRound(vat), 
               withholding: preciseRound(withholding), 
               net: preciseRound(net) };
    });

    // Store results globally for export functions
    window.currentResults = results;

    // Update result table - all methods show withholding tax
    const resultBody = document.getElementById('resultBody');
    resultBody.innerHTML = results.map(r => `
      <tr class="border-b hover:bg-gray-50">
        <td class="py-3 px-4 font-medium">${r.installment}</td>
        <td class="py-3 px-4 text-right">${formatNumberWithComma(r.beforeVAT)}</td>
        <td class="py-3 px-4 text-right">${formatNumberWithComma(r.vat)}</td>
        <td class="py-3 px-4 text-right">${formatNumberWithComma(r.withholding)}</td>
        <td class="py-3 px-4 text-right font-bold text-green-600">${formatNumberWithComma(r.net)}</td>
      </tr>
    `).join('');

    // Calculate and display totals - ใช้ค่าที่แท้จริงก่อนปัด
    let totalRawBeforeVAT = 0, totalRawVAT = 0, totalRawWithholding = 0, totalRawNet = 0;
    
    // คำนวณยอดรวมจากค่าดิบก่อนปัดทศนิยม
    const rawResults = portions.map((portion, i) => {
      const portionAmount = totalBeforeVAT * portion / 100;
      let beforeVAT, vat, withholding, net;

      switch (calculationMethod) {
        case 'A': // 1. จากราคาก่อน VAT
          beforeVAT = portionAmount;
          vat = beforeVAT * VAT_RATE;
          withholding = beforeVAT * whtRate;
          net = beforeVAT + vat - withholding;
          break;
          
        case 'B': // 2. จากราคารวม VAT
          const totalWithVAT = portionAmount;
          beforeVAT = totalWithVAT / (1 + VAT_RATE);
          vat = totalWithVAT - beforeVAT;
          withholding = beforeVAT * whtRate;
          net = totalWithVAT - withholding;
          break;
          
        case 'C': // 3. จากราคารับสุทธิ รวม VAT รวม หัก ณ ที่จ่ายในยอด
          const netAmount = portionAmount;
          beforeVAT = netAmount / (1 + VAT_RATE - whtRate);
          vat = beforeVAT * VAT_RATE;
          withholding = beforeVAT * whtRate;
          net = beforeVAT + vat - withholding;
          break;
          
        default:
          beforeVAT = portionAmount;
          vat = beforeVAT * VAT_RATE;
          withholding = beforeVAT * whtRate;
          net = beforeVAT + vat - withholding;
      }

      // เก็บค่าดิบไว้คำนวณยอดรวม
      totalRawBeforeVAT += beforeVAT;
      totalRawVAT += vat;
      totalRawWithholding += withholding;
      totalRawNet += net;

      return { beforeVAT, vat, withholding, net };
    });

    // ปัดทศนิยมสำหรับยอดรวม
    const sumBeforeVAT = preciseRound(totalRawBeforeVAT);
    const sumVAT = preciseRound(totalRawVAT);
    const sumWithholding = preciseRound(totalRawWithholding);
    const sumNet = preciseRound(totalRawNet);

    // Update table header and footer - all methods show withholding tax
    const whtHeader = document.querySelector('thead th:nth-child(4)');
    const sumWhtHeader = document.querySelector('tfoot td:nth-child(4)');
    
    whtHeader.style.color = '#374151'; // gray-700
    whtHeader.style.fontStyle = 'normal';
    sumWhtHeader.style.color = '#1D4ED8'; // blue-700
    sumWhtHeader.style.fontStyle = 'normal';

    // Update table footer
    document.getElementById('sumBeforeVAT').textContent = formatNumberWithComma(sumBeforeVAT);
    document.getElementById('sumVAT').textContent = formatNumberWithComma(sumVAT);
    document.getElementById('sumWithholding').textContent = formatNumberWithComma(sumWithholding);
    document.getElementById('sumWithholding').className = 'py-3 px-4 text-right text-blue-700';
    document.getElementById('sumNet').textContent = formatNumberWithComma(sumNet);

    // Update simple summary - all methods show withholding tax
    const priceBeforeVAT = results.reduce((a, b) => a + b.beforeVAT, 0);
    const priceWithVAT = results.reduce((a, b) => a + b.beforeVAT + b.vat, 0);
    const priceAfterWithholding = results.reduce((a, b) => a + b.net, 0);
    const totalWithholding = results.reduce((a, b) => a + b.withholding, 0);

    document.getElementById('priceBeforeVAT').textContent = formatNumberWithComma(priceBeforeVAT);
    document.getElementById('priceWithVAT').textContent = formatNumberWithComma(priceWithVAT);
    document.getElementById('priceAfterWithholding').textContent = formatNumberWithComma(priceAfterWithholding);

    // Update labels - always show as "หลังหักภาษี" with red color
    const summaryCard3 = document.querySelector('#priceAfterWithholding').closest('.bg-green-50, .bg-red-50');
    const summaryLabel3 = summaryCard3.querySelector('.text-green-600, .text-red-600');
    
    summaryCard3.className = 'text-center p-4 bg-red-50 rounded-lg';
    summaryLabel3.className = 'text-sm text-red-600 font-medium';
    summaryLabel3.textContent = 'หลังหักภาษี';
    const valueElement = summaryCard3.querySelector('.text-2xl');
    if (valueElement) {
      valueElement.className = 'text-2xl font-bold text-red-700';
    }

    // Show results
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('exportResults').classList.remove('hidden');
    document.getElementById('additionalTools').classList.remove('hidden');

    // Scroll to results
    document.getElementById('result').scrollIntoView({ behavior: 'smooth' });

    showAlert('คำนวณเรียบร้อยแล้ว', 'success');

  } catch (error) {
    showAlert(error.message, 'error');
  }
});

// Tax calculation function for comparisons
function calculateTaxes(totalAmount, whtRate, vatRate, method) {
  let beforeVAT, vat, withholding, netTotal;

  switch (method) {
    case 'A': // จากราคาก่อน VAT
      beforeVAT = totalAmount;
      vat = beforeVAT * vatRate;
      withholding = beforeVAT * whtRate;
      netTotal = beforeVAT + vat - withholding;
      break;
      
    case 'B': // จากราคารวม VAT
      const totalWithVAT = totalAmount;
      beforeVAT = totalWithVAT / (1 + vatRate);
      vat = totalWithVAT - beforeVAT;
      withholding = beforeVAT * whtRate;
      netTotal = totalWithVAT - withholding;
      break;
      
    case 'C': // จากราคารับสุทธิ รวม VAT รวม หัก ณ ที่จ่ายในยอด
      const netAmount = totalAmount;
      beforeVAT = netAmount / (1 + vatRate - whtRate);
      vat = beforeVAT * vatRate;
      withholding = beforeVAT * whtRate;
      netTotal = beforeVAT + vat - withholding;
      break;
      
    default:
      beforeVAT = totalAmount;
      vat = beforeVAT * vatRate;
      withholding = beforeVAT * whtRate;
      netTotal = beforeVAT + vat - withholding;
  }

  return {
    beforeVAT: preciseRound(beforeVAT),
    vat: preciseRound(vat),
    withholding: preciseRound(withholding),
    netTotal: preciseRound(netTotal)
  };
}

// Initialize the application
initializeInstallments();

// Auto-load saved data on page load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the form
  initializeInstallments();
});

// Auto-save data when form changes (debounced)
let autoSaveTimeout;
function autoSaveData() {
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    try {
      const data = {
        totalBeforeVAT: document.getElementById('totalBeforeVAT').value,
        calculationMethod: document.getElementById('calculationMethod').value,
        whtRate: document.getElementById('whtRate').value,
        vatRate: document.getElementById('vatRate').value,
        installments: Array.from(installmentsInputs.querySelectorAll('input')).map(input => input.value),
        timestamp: new Date().toISOString()
      };
      sessionStorage.setItem('vatCalculatorAutoSave', JSON.stringify(data));
    } catch (error) {
      console.log('Auto-save failed:', error);
    }
  }, 2000);
}

// Add auto-save listeners
document.getElementById('totalBeforeVAT').addEventListener('input', autoSaveData);
document.getElementById('calculationMethod').addEventListener('change', autoSaveData);
document.getElementById('whtRate').addEventListener('input', autoSaveData);
document.getElementById('vatRate').addEventListener('input', autoSaveData);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        document.getElementById('calcForm').dispatchEvent(new Event('submit'));
        break;
      case 'r':
        e.preventDefault();
        resetForm();
        break;
    }
  }
});

// Template Presets
const CALCULATION_PRESETS = {
  'service': { name: 'บริการทั่วไป', whtRate: '3.0', vatRate: '7.0' },
  'professional': { name: 'บริการวิชาชีพ', whtRate: '5.0', vatRate: '7.0' },
  'rental': { name: 'ค่าเช่า', whtRate: '5.0', vatRate: '7.0' },
  'interest': { name: 'ดอกเบี้ย', whtRate: '15.0', vatRate: '0.0' },
  'dividend': { name: 'เงินปันผล', whtRate: '10.0', vatRate: '0.0' },
  'goods': { name: 'ขายสินค้า', whtRate: '1.0', vatRate: '7.0' }
};

// Enhanced Validation System
function validateInputs() {
  const errors = [];
  const warnings = [];
  
  try {
    const totalBeforeVAT = validateInput(document.getElementById('totalBeforeVAT').value, 0, 999999999, 'ยอดก่อน VAT');
    const whtRate = validateInput(document.getElementById('whtRate').value, 0, 100, 'อัตราหัก ณ ที่จ่าย');
    const vatRate = validateInput(document.getElementById('vatRate').value, 0, 100, 'อัตรา VAT');
    
    // Check installments
    const installmentInputs = installmentsInputs.querySelectorAll('input');
    const installmentValues = Array.from(installmentInputs).map(input => parseNumberFromInput(input.value));
    const totalPercentage = installmentValues.reduce((sum, val) => sum + val, 0);
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      errors.push(`ผลรวมเปอร์เซ็นต์ทุกงวด = ${totalPercentage.toFixed(2)}% (ต้องเป็น 100%)`);
    }
    
    // Warnings
    if (whtRate > 50) warnings.push('อัตราหัก ณ ที่จ่ายสูงผิดปกติ');
    if (vatRate !== 7 && vatRate !== 0) warnings.push('อัตรา VAT ไม่ใช่ 7% หรือ 0%');
    if (totalBeforeVAT > 50000000) warnings.push('ยอดเงินสูงมาก กรุณาตรวจสอบ');
    
    return { errors, warnings, isValid: errors.length === 0 };
  } catch (error) {
    return { errors: [error.message], warnings, isValid: false };
  }
}

function showValidationStatus(validation) {
  const status = document.getElementById('validationStatus');
  const icon = document.getElementById('validationIcon');
  const message = document.getElementById('validationMessage');
  
  if (validation.isValid && validation.warnings.length === 0) {
    status.className = 'p-3 rounded-lg mb-4 bg-green-50 border border-green-200';
    icon.textContent = '✅';
    message.textContent = 'ข้อมูลถูกต้องครบถ้วน';
  } else if (validation.isValid && validation.warnings.length > 0) {
    status.className = 'p-3 rounded-lg mb-4 bg-yellow-50 border border-yellow-200';
    icon.textContent = '⚠️';
    message.innerHTML = `ข้อมูลถูกต้อง แต่มีข้อควรระวัง:<br>• ${validation.warnings.join('<br>• ')}`;
  } else {
    status.className = 'p-3 rounded-lg mb-4 bg-red-50 border border-red-200';
    icon.textContent = '❌';
    message.innerHTML = `พบข้อผิดพลาด:<br>• ${validation.errors.join('<br>• ')}`;
  }
  
  status.classList.remove('hidden');
}

// Additional Tools Functions
function compareAllMethods() {
  try {
    const totalBeforeVAT = parseNumberFromInput(document.getElementById('totalBeforeVAT').value);
    const whtRate = parseNumberFromInput(document.getElementById('whtRate').value) / 100;
    const vatRate = parseNumberFromInput(document.getElementById('vatRate').value) / 100;
    
    if (totalBeforeVAT <= 0) {
      showAlert('กรุณากรอกยอดก่อน VAT ก่อน', 'warning');
      return;
    }
    
    const methods = ['A', 'B', 'C'];
    const results = methods.map(method => {
      const calc = calculateTaxes(totalBeforeVAT, whtRate, vatRate, method);
      return {
        method,
        methodName: getMethodName(method),
        vat: calc.vat,
        withholding: calc.withholding,
        netTotal: calc.netTotal
      };
    });
    
    displayComparisonResults(results);
  } catch (error) {
    showAlert('เกิดข้อผิดพลาดในการเปรียบเทียบ', 'error');
  }
}

function getMethodName(method) {
  const names = {
    'A': 'จากราคาก่อน VAT',
    'B': 'จากราคารวม VAT',
    'C': 'จากราคารับสุทธิ รวม VAT รวม หัก ณ ที่จ่ายในยอด'
  };
  return names[method] || method;
}

function displayComparisonResults(results) {
  const tbody = document.getElementById('comparisonBody');
  tbody.innerHTML = '';
  
  const baseResult = results[0]; // Method A as base
  
  results.forEach(result => {
    const row = document.createElement('tr');
    const difference = result.netTotal - baseResult.netTotal;
    const differenceText = difference === 0 ? '-' : 
      (difference > 0 ? `+${formatNumberWithComma(Math.abs(difference))}` : 
       `-${formatNumberWithComma(Math.abs(difference))}`);
    
    row.innerHTML = `
      <td class="py-2 px-3 border-b">${result.methodName}</td>
      <td class="py-2 px-3 border-b text-right">${formatNumberWithComma(result.vat)}</td>
      <td class="py-2 px-3 border-b text-right">${formatNumberWithComma(result.withholding)}</td>
      <td class="py-2 px-3 border-b text-right">${formatNumberWithComma(result.netTotal)}</td>
      <td class="py-2 px-3 border-b text-center ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'}">${differenceText}</td>
    `;
    tbody.appendChild(row);
  });
  
  document.getElementById('comparisonResults').classList.remove('hidden');
}

function reverseCalculate() {
  try {
    const targetNet = parseNumberFromInput(document.getElementById('reverseAmount').value);
    const whtRate = parseNumberFromInput(document.getElementById('whtRate').value) / 100;
    const vatRate = parseNumberFromInput(document.getElementById('vatRate').value) / 100;
    const method = document.getElementById('calculationMethod').value;
    
    if (targetNet <= 0) {
      showAlert('กรุณากรอกยอดสุทธิที่ต้องการ', 'warning');
      return;
    }
    
    // Reverse calculation based on method
    let beforeVAT = 0;
    switch (method) {
      case 'A': // จากราคาก่อน VAT
        beforeVAT = targetNet / (1 + vatRate - whtRate);
        break;
      case 'B': // จากราคารวม VAT  
        beforeVAT = targetNet / (1 + vatRate - whtRate);
        break;
      case 'C': // จากราคารับสุทธิ รวม VAT รวม หัก ณ ที่จ่ายในยอด
        beforeVAT = targetNet / (1 + vatRate - whtRate);
        break;
    }
    
    const result = calculateTaxes(beforeVAT, whtRate, vatRate, method);
    
    document.getElementById('reverseResult').innerHTML = `
      <strong>ผลลัพธ์:</strong><br>
      ยอดก่อน VAT: ${formatNumberWithComma(beforeVAT)} บาท<br>
      VAT: ${formatNumberWithComma(result.vat)} บาท<br>
      หัก ณ ที่จ่าย: ${formatNumberWithComma(result.withholding)} บาท<br>
      ยอดสุทธิ: ${formatNumberWithComma(result.netTotal)} บาท
    `;
  } catch (error) {
    showAlert('เกิดข้อผิดพลาดในการคำนวณย้อนกลับ', 'error');
  }
}

function compareRates() {
  try {
    const altRate = parseNumberFromInput(document.getElementById('alternateRate').value) / 100;
    const currentRate = parseNumberFromInput(document.getElementById('whtRate').value) / 100;
    const totalBeforeVAT = parseNumberFromInput(document.getElementById('totalBeforeVAT').value);
    const vatRate = parseNumberFromInput(document.getElementById('vatRate').value) / 100;
    const method = document.getElementById('calculationMethod').value;
    
    if (totalBeforeVAT <= 0) {
      showAlert('กรุณากรอกยอดก่อน VAT ก่อน', 'warning');
      return;
    }
    
    const currentResult = calculateTaxes(totalBeforeVAT, currentRate, vatRate, method);
    const altResult = calculateTaxes(totalBeforeVAT, altRate, vatRate, method);
    const difference = altResult.netTotal - currentResult.netTotal;
    
    document.getElementById('rateDifferenceResult').innerHTML = `
      <strong>เปรียบเทียบอัตรา:</strong><br>
      อัตราปัจจุบัน (${(currentRate * 100).toFixed(2)}%): ${formatNumberWithComma(currentResult.netTotal)} บาท<br>
      อัตราใหม่ (${(altRate * 100).toFixed(2)}%): ${formatNumberWithComma(altResult.netTotal)} บาท<br>
      ความแตกต่าง: <span class="${difference > 0 ? 'text-green-600' : 'text-red-600'}">${difference > 0 ? '+' : ''}${formatNumberWithComma(difference)} บาท</span>
    `;
  } catch (error) {
    showAlert('เกิดข้อผิดพลาดในการเปรียบเทียบอัตรา', 'error');
  }
}

function validateCalculation() {
  const validation = validateInputs();
  showValidationStatus(validation);
  
  // Additional calculation checks
  const details = [];
  
  try {
    const totalBeforeVAT = parseNumberFromInput(document.getElementById('totalBeforeVAT').value);
    const whtRate = parseNumberFromInput(document.getElementById('whtRate').value) / 100;
    const vatRate = parseNumberFromInput(document.getElementById('vatRate').value) / 100;
    
    details.push(`ยอดก่อน VAT: ${formatNumberWithComma(totalBeforeVAT)} บาท`);
    details.push(`อัตรา VAT: ${(vatRate * 100).toFixed(2)}%`);
    details.push(`อัตราหัก ณ ที่จ่าย: ${(whtRate * 100).toFixed(2)}%`);
    
    const vat = totalBeforeVAT * vatRate;
    const totalWithVAT = totalBeforeVAT + vat;
    
    details.push(`VAT = ${formatNumberWithComma(totalBeforeVAT)} × ${(vatRate * 100).toFixed(2)}% = ${formatNumberWithComma(vat)} บาท`);
    details.push(`ยอดรวม = ${formatNumberWithComma(totalBeforeVAT)} + ${formatNumberWithComma(vat)} = ${formatNumberWithComma(totalWithVAT)} บาท`);
    
  } catch (error) {
    details.push(`เกิดข้อผิดพลาด: ${error.message}`);
  }
  
  document.getElementById('validationDetails').innerHTML = details.join('<br>');
  document.getElementById('validationResults').classList.remove('hidden');
}

function checkCompliance() {
  const whtRate = parseNumberFromInput(document.getElementById('whtRate').value);
  const vatRate = parseNumberFromInput(document.getElementById('vatRate').value);
  
  const compliance = [];
  
  // Check VAT rate
  if (vatRate === 7) {
    compliance.push('✅ อัตรา VAT 7% ถูกต้องตามกฎหมายปัจจุบัน');
  } else if (vatRate === 0) {
    compliance.push('✅ อัตรา VAT 0% สำหรับสินค้าหรือบริการยกเว้น');
  } else {
    compliance.push('⚠️ อัตรา VAT ไม่ตรงกับมาตรฐาน กรุณาตรวจสอบ');
  }
  
  // Check withholding tax rates
  const commonRates = [0, 1, 2, 3, 5, 10, 15];
  if (commonRates.includes(whtRate)) {
    compliance.push(`✅ อัตราหัก ณ ที่จ่าย ${whtRate}% เป็นอัตรามาตรฐาน`);
  } else {
    compliance.push(`⚠️ อัตราหัก ณ ที่จ่าย ${whtRate}% กรุณาตรวจสอบความถูกต้อง`);
  }
  
  // General compliance notes
  compliance.push('ℹ️ ควรตรวจสอบประเภทรายได้เพื่อใช้อัตรา ณ ที่จ่ายที่ถูกต้อง');
  compliance.push('ℹ️ กรุณาปรึกษาผู้เชี่ยวชาญด้านภาษีสำหรับกรณีเฉพาะ');
  
  document.getElementById('validationDetails').innerHTML = compliance.join('<br>');
  document.getElementById('validationResults').classList.remove('hidden');
}

function applyPreset(presetKey) {
  const preset = CALCULATION_PRESETS[presetKey];
  if (preset) {
    document.getElementById('whtRate').value = preset.whtRate;
    document.getElementById('vatRate').value = preset.vatRate;
    showAlert(`ใช้เทมเพลต: ${preset.name}`, 'success');
  }
}

// Event Listeners for new features
document.getElementById('compareAll').addEventListener('click', compareAllMethods);
document.getElementById('showDifferences').addEventListener('click', compareAllMethods);
document.getElementById('reverseCalculate').addEventListener('click', reverseCalculate);
document.getElementById('rateDifference').addEventListener('click', compareRates);
document.getElementById('validateCalculation').addEventListener('click', validateCalculation);
document.getElementById('checkCompliance').addEventListener('click', checkCompliance);

// Template presets
document.getElementById('templatePresets').addEventListener('click', () => {
  const options = Object.entries(CALCULATION_PRESETS)
    .map(([key, preset]) => `${preset.name} (หัก ${preset.whtRate}%, VAT ${preset.vatRate}%)`)
    .join('\n');
  
  const choice = prompt(`เลือกเทมเพลต:\n${options}\n\nพิมพ์ชื่อเทมเพลต:`);
  if (choice) {
    const presetKey = Object.keys(CALCULATION_PRESETS)
      .find(key => CALCULATION_PRESETS[key].name.includes(choice.trim()));
    if (presetKey) {
      applyPreset(presetKey);
    } else {
      showAlert('ไม่พบเทมเพลตที่เลือก', 'warning');
    }
  }
});

// Enhanced form validation on input
document.getElementById('totalBeforeVAT').addEventListener('input', () => {
  setTimeout(() => {
    const validation = validateInputs();
    if (validation.errors.length > 0 || validation.warnings.length > 0) {
      showValidationStatus(validation);
    } else {
      document.getElementById('validationStatus').classList.add('hidden');
    }
  }, 500);
});