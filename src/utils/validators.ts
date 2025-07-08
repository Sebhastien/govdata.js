import { ValidationError } from './errors.js';

export function parseFloatSafe(value: any): number {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseIntSafe(value: any): number {
  if (!value) return 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function convertBooleanToString(value: any): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return value === 'true' ? 'Yes' : 'No';
}

export function validateDateRange(dateRange: string): boolean {
  const dateRangePattern = /^\[\d{4}\/\d{2}\/\d{2}\s*,\s*\d{4}\/\d{2}\/\d{2}\]$/;
  return dateRangePattern.test(dateRange);
}

export function validatePIID(piid: string): boolean {
  return Boolean(piid && piid.trim().length > 0);
}

export function validateNAICSCode(naics: string): boolean {
  const naicsPattern = /^\d{6}$/;
  return naicsPattern.test(naics);
}

export function validatePSCCode(psc: string): boolean {
  const pscPattern = /^[A-Z]\d{3}$/;
  return pscPattern.test(psc);
}

export function validateAgencyCode(agencyCode: string): boolean {
  const agencyPattern = /^\d{4}$/;
  return agencyPattern.test(agencyCode);
}

export function validateStateCode(stateCode: string): boolean {
  const statePattern = /^[A-Z]{2}$/;
  return statePattern.test(stateCode);
}

export function validateZipCode(zipCode: string): boolean {
  const zipPattern = /^\d{5}(-\d{4})?$/;
  return zipPattern.test(zipCode);
}

export function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[<>]/g, '');
}

export function validateSearchParams(params: Record<string, any>): void {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    switch (key) {
      case 'LAST_MOD_DATE':
        if (typeof value === 'string' && !validateDateRange(value)) {
          throw new ValidationError(key, value, [
            'Use format: [YYYY/MM/DD, YYYY/MM/DD]',
            'Example: [2022/01/01, 2024/12/31]'
          ]);
        }
        break;

      case 'PIID':
      case 'REF_IDV_PIID':
        if (typeof value === 'string' && !validatePIID(value)) {
          throw new ValidationError(key, value, [
            'Contract ID cannot be empty',
            'Remove any leading/trailing whitespace'
          ]);
        }
        break;

      case 'PRINCIPAL_NAICS_CODE':
      case 'NAICS_CODE':
        if (typeof value === 'string' && !validateNAICSCode(value)) {
          throw new ValidationError(key, value, [
            'NAICS code must be exactly 6 digits',
            'Example: 541511'
          ]);
        }
        break;

      case 'PRODUCT_OR_SERVICE_CODE':
      case 'PSC_CODE':
        if (typeof value === 'string' && !validatePSCCode(value)) {
          throw new ValidationError(key, value, [
            'PSC code must be 1 letter followed by 3 digits',
            'Example: R425'
          ]);
        }
        break;

      case 'AGENCY_CODE':
      case 'CONTRACTING_AGENCY_ID':
      case 'FUNDING_AGENCY_ID':
        if (typeof value === 'string' && !validateAgencyCode(value)) {
          throw new ValidationError(key, value, [
            'Agency code must be exactly 4 digits',
            'Example: 9700'
          ]);
        }
        break;
    }
  }
}

export function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  }
  
  return queryParams.toString();
}