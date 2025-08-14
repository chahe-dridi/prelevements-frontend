// Function to convert numbers to French text
export const numberToFrenchText = (number) => {
  if (isNaN(number) || number < 0) return '';
  
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  
  const convertHundreds = (num) => {
    let result = '';
    
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    
    if (hundreds > 0) {
      if (hundreds === 1) {
        result += 'cent';
      } else {
        result += units[hundreds] + ' cent';
      }
      if (hundreds > 1 && remainder === 0) {
        result += 's';
      }
    }
    
    if (remainder > 0) {
      if (result) result += ' ';
      
      if (remainder < 10) {
        result += units[remainder];
      } else if (remainder < 20) {
        result += teens[remainder - 10];
      } else {
        const tensDigit = Math.floor(remainder / 10);
        const unitsDigit = remainder % 10;
        
        if (tensDigit === 7) {
          result += 'soixante';
          if (unitsDigit === 0) {
            result += '-dix';
          } else {
            result += '-' + teens[unitsDigit - 1];
          }
        } else if (tensDigit === 9) {
          result += 'quatre-vingt';
          if (unitsDigit === 0) {
            result += '-dix';
          } else {
            result += '-' + teens[unitsDigit - 1];
          }
        } else {
          result += tens[tensDigit];
          if (unitsDigit > 0) {
            if (tensDigit === 8 && unitsDigit === 0) {
              result += 's';
            } else {
              if (unitsDigit === 1 && (tensDigit === 2 || tensDigit === 3 || tensDigit === 4 || tensDigit === 5 || tensDigit === 6)) {
                result += ' et un';
              } else {
                result += '-' + units[unitsDigit];
              }
            }
          } else if (tensDigit === 8) {
            result += 's';
          }
        }
      }
    }
    
    return result;
  };
  
  const convertThousands = (num) => {
    if (num === 0) return '';
    
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    
    let result = '';
    
    if (thousands > 0) {
      if (thousands === 1) {
        result += 'mille';
      } else {
        result += convertHundreds(thousands) + ' mille';
      }
    }
    
    if (remainder > 0) {
      if (result) result += ' ';
      result += convertHundreds(remainder);
    }
    
    return result;
  };
  
  const convertMillions = (num) => {
    if (num === 0) return 'zéro';
    
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    
    let result = '';
    
    if (millions > 0) {
      if (millions === 1) {
        result += 'un million';
      } else {
        result += convertThousands(millions) + ' millions';
      }
    }
    
    if (remainder > 0) {
      if (result) result += ' ';
      result += convertThousands(remainder);
    }
    
    return result;
  };
  
  // Handle decimal part for currency
  const handleCurrency = (amount) => {
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 1000); // For millimes
    
    let result = convertMillions(integerPart);
    
    if (integerPart === 0) {
      result = 'zéro';
    }
    
    // Add currency unit
    if (integerPart <= 1) {
      result += ' dinar';
    } else {
      result += ' dinars';
    }
    
    // Add millimes if present
    if (decimalPart > 0) {
      result += ' et ';
      result += convertMillions(decimalPart);
      if (decimalPart <= 1) {
        result += ' millime';
      } else {
        result += ' millimes';
      }
    }
    
    return result.charAt(0).toUpperCase() + result.slice(1);
  };
  
  return handleCurrency(number);
};

// Alternative using a more comprehensive library approach
export const convertAmountToFrench = (amount) => {
  try {
    return numberToFrenchText(parseFloat(amount));
  } catch (error) {
    console.error('Error converting amount to French:', error);
    return '';
  }
};