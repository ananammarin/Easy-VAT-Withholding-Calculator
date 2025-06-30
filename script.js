const installmentsInputs = document.getElementById('installmentsInputs');
const VAT_RATE = 0.07;
const WHT_RATE = 0.03;

function formatNumberWithComma(num) {
  return num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function formatNumberInput(value) {
  if (!value) return '';
  const parts = value.toString().split('.');
  let integerPart = parts[0].replace(/\D/g, '');
  if(integerPart === '') return '';
  let formatted = Number(integerPart).toLocaleString('en-US');
  if(parts.length > 1){
    let decimalPart = parts[1].replace(/\D/g, '').slice(0,2);
    formatted += '.' + decimalPart;
  }
  return formatted;
}

function parseNumberFromInput(value) {
  return parseFloat(value.replace(/,/g, ''));
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
    if (!isNaN(value)) {
      input.value = formatNumberInput(value);
    } else {
      input.value = '';
    }

    const newLength = input.value.length;
    const diff = newLength - originalLength;
    input.selectionEnd = cursorPos + diff;
  });
}

function createInstallmentInput(index) {
  const div = document.createElement('div');
  div.className = 'flex items-center space-x-3';

  const label = document.createElement('label');
  label.textContent = `งวดที่ ${index + 1} (%)`;
  label.className = 'flex-shrink-0 w-32 font-medium';

  const input = document.createElement('input');
  input.type = 'text';
  input.required = true;
  input.value = index === 0 ? '30' : (index === 1 ? '70' : '0');
  input.className = 'flex-grow p-2 border border-gray-300 rounded';

  addCommaInputListener(input);

  div.appendChild(label);
  div.appendChild(input);

  return div;
}

function initializeInstallments() {
  installmentsInputs.innerHTML = '';
  installmentsInputs.appendChild(createInstallmentInput(0));
  installmentsInputs.appendChild(createInstallmentInput(1));
}

document.getElementById('addInstallment').addEventListener('click', () => {
  const count = installmentsInputs.children.length;
  if(count >= 10){
    alert('เพิ่มงวดได้สูงสุด 10 งวด');
    return;
  }
  installmentsInputs.appendChild(createInstallmentInput(count));
});

document.getElementById('removeInstallment').addEventListener('click', () => {
  const count = installmentsInputs.children.length;
  if(count <= 1){
    alert('ต้องมีอย่างน้อย 1 งวด');
    return;
  }
  installmentsInputs.removeChild(installmentsInputs.lastChild);
});

const totalBeforeVATInput = document.getElementById('totalBeforeVAT');
addCommaInputListener(totalBeforeVATInput);

document.getElementById('calcForm').addEventListener('submit', e => {
  e.preventDefault();

  const totalBeforeVAT = parseNumberFromInput(totalBeforeVATInput.value);
  if(isNaN(totalBeforeVAT) || totalBeforeVAT <= 0){
    alert('กรุณาใส่ยอดรวมก่อน VAT ให้ถูกต้อง');
    return;
  }

  const calculationMethod = document.getElementById('calculationMethod').value;

  const inputs = installmentsInputs.querySelectorAll('input');
  const portions = Array.from(inputs).map(input => parseNumberFromInput(input.value));

  if(portions.some(p => isNaN(p) || p < 0 || p > 100)){
    alert('กรุณาใส่สัดส่วนงวดเป็นตัวเลข 0-100');
    return;
  }

  const totalPortion = portions.reduce((a,b) => a+b, 0);
  if(Math.abs(totalPortion - 100) > 0.01){
    alert(`สัดส่วนงวดรวมต้องเท่ากับ 100% (ตอนนี้รวม ${totalPortion.toFixed(2)}%)`);
    return;
  }

  const results = portions.map((portion, i) => {
    const P = totalBeforeVAT * portion / 100;
    const V = P * VAT_RATE;
    const T = P + V;
    let WHT = 0;
    let net = 0;

    switch(calculationMethod) {
      case 'A':
        WHT = P * WHT_RATE;
        net = T - WHT;
        break;
      case 'B':
        WHT = T * WHT_RATE;
        net = T - WHT;
        break;
      case 'C':
        WHT = T * WHT_RATE;
        net = T - WHT;
        break;
      case 'D':
        WHT = 0;
        net = T;
        break;
      case 'E':
        WHT = T * WHT_RATE;
        net = T - WHT;
        break;
      default:
        WHT = P * WHT_RATE;
        net = T - WHT;
    }

    return { installment: i+1, beforeVAT: P, vat: V, withholding: WHT, net };
  });

  const resultBody = document.getElementById('resultBody');
  resultBody.innerHTML = results.map(r => `
    <tr class="even:bg-gray-50">
      <td class="py-2 px-4 border-b border-gray-300 font-medium">ครั้งที่ ${r.installment}</td>
      <td class="py-2 px-4 border-b border-gray-300 text-right">${formatNumberWithComma(r.beforeVAT)}</td>
      <td class="py-2 px-4 border-b border-gray-300 text-right">${formatNumberWithComma(r.vat)}</td>
      <td class="py-2 px-4 border-b border-gray-300 text-right">${formatNumberWithComma(r.withholding)}</td>
      <td class="py-2 px-4 border-b border-gray-300 text-right font-semibold">${formatNumberWithComma(r.net)}</td>
    </tr>
  `).join('');

  const sumBeforeVAT = results.reduce((a,b) => a + b.beforeVAT, 0);
  const sumVAT = results.reduce((a,b) => a + b.vat, 0);
  const sumWithholding = results.reduce((a,b) => a + b.withholding, 0);
  const sumNet = results.reduce((a,b) => a + b.net, 0);

  document.getElementById('sumBeforeVAT').textContent = formatNumberWithComma(sumBeforeVAT);
  document.getElementById('sumVAT').textContent = formatNumberWithComma(sumVAT);
  document.getElementById('sumWithholding').textContent = formatNumberWithComma(sumWithholding);
  document.getElementById('sumNet').textContent = formatNumberWithComma(sumNet);

  document.getElementById('result').classList.remove('hidden');
});

initializeInstallments();