// Calculation formulas for VAT and withholding tax

function calculateFromPriceBeforeVAT(priceBeforeVAT) {
  const vat = priceBeforeVAT * 0.07;
  const priceWithVAT = priceBeforeVAT + vat;
  const withholdingTax = priceBeforeVAT * 0.03;
  const totalAfterWithholdingTax = priceWithVAT - withholdingTax;

  return {
    priceBeforeVAT,
    vat,
    priceWithVAT,
    withholdingTax,
    totalAfterWithholdingTax,
  };
}

function calculateFromPriceWithVAT(priceWithVAT) {
  const priceBeforeVAT = priceWithVAT / 1.07;
  const vat = priceWithVAT - priceBeforeVAT;
  const withholdingTax = priceBeforeVAT * 0.03;
  const totalAfterWithholdingTax = priceWithVAT - withholdingTax;

  return {
    priceBeforeVAT,
    vat,
    priceWithVAT,
    withholdingTax,
    totalAfterWithholdingTax,
  };
}

function calculateFromNetTotal(netTotal) {
  const priceWithVAT = netTotal / 0.97;
  const priceBeforeVAT = priceWithVAT / 1.07;
  const vat = priceWithVAT - priceBeforeVAT;
  const withholdingTax = priceWithVAT - netTotal;

  return {
    priceBeforeVAT,
    vat,
    priceWithVAT,
    withholdingTax,
    totalAfterWithholdingTax: netTotal,
  };
}

export { calculateFromPriceBeforeVAT, calculateFromPriceWithVAT, calculateFromNetTotal };
