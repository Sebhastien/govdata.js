// Core FPDS exports
export { FPDSRequest } from './core/fpds/request.js';
export { FPDSFieldMapper } from './core/fpds/field-mapper.js';
export { ContractProcessor } from './core/fpds/contract-processor.js';

// Core types
export type {
  FPDSRecord,
  FPDSSearchParams,
  FPDSRequestConfig,
  ContractSearchRequest,
  PaginationInfo,
  RequestMetadata,
  BaseRequestConfig
} from './core/types.js';

// Utility exports
export { Semaphore } from './utils/semaphore.js';
export { XMLProcessor } from './utils/xml-processor.js';
export {
  parseFloatSafe,
  parseIntSafe,
  convertBooleanToString,
  validateDateRange,
  validatePIID,
  validateNAICSCode,
  validatePSCCode,
  validateAgencyCode,
  validateStateCode,
  validateZipCode,
  sanitizeSearchTerm,
  validateSearchParams,
  buildQueryString
} from './utils/validators.js';

// Error exports
export {
  GovDataError,
  FPDSRequestError,
  OpportunityRequestError,
  WageRequestError,
  ValidationError,
  NetworkError,
  ParseError
} from './utils/errors.js';

// Version info
export const VERSION = '1.0.0';

// Default configurations
export const DEFAULT_FPDS_CONFIG = {
  threadCount: 10,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  baseUrl: 'https://api.sam.gov/prod/federalcontractopportunities/v1/search',
  userAgent: 'govdata.js/1.0.0'
};