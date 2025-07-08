export interface FPDSRecord {
  // Essential Contract Information
  contract_hash: string;           // SHA256: contract_number:award_date
  contract_number: string;         // PIID
  title: string;
  link: string;
  award_date: string;
  award_amount: number;
  total_potential_value: number;
  contract_type: string;
  project_description: string;
  naics_code: string;
  naics_description: string;
  psc_code: string;
  psc_description: string;
  
  // Contracting Agency Information
  contracting_agency: string;
  contracting_office_code: string;
  contracting_office_name: string;
  
  // Vendor Information
  vendor_name: string;
  vendor_uei: string;
  business_size: string;
  vendor_city: string;
  vendor_state: string;
  sdvosb_status: string;           // "Yes"/"No"
  small_business_status: string;   // "Yes"/"No"
  women_owned_status: string;      // "Yes"/"No"
  
  // Competition Information
  competition_extent: string;
  set_aside_type: string;
  number_of_offers: number;
  solicitation_procedure: string;
  
  // Performance Information
  start_date: string;
  end_date: string;
  performance_state: string;
  performance_city: string;
  
  // Reference Information for IDVs
  parent_contract_id: string;
  parent_contract_type: string;
  
  // Source Metadata
  source_metadata?: Record<string, any>; // Additional metadata from source
}

export interface FPDSSearchParams {
  // Common search parameters
  LAST_MOD_DATE?: string;          // "[2022/01/01, 2024/12/31]"
  PIID?: string | string[];        // Specific contract number(s)
  REF_IDV_PIID?: string;          // Parent IDV contract
  NAICS_CODE?: string;             // NAICS code filter
  PSC_CODE?: string;               // PSC code filter
  CONTRACTING_AGENCY?: string;     // Agency filter
  VENDOR_NAME?: string;            // Vendor name search
  SET_ASIDE_TYPE?: string;         // Set-aside type filter
  
  // Additional FPDS parameters
  AGENCY_CODE?: string;
  CONTRACTING_OFFICE_ID?: string;
  FUNDING_AGENCY_ID?: string;
  VENDOR_UEI?: string;
  PRODUCT_OR_SERVICE_CODE?: string;
  PRINCIPAL_NAICS_CODE?: string;
  EXTENT_COMPETED_DESCRIPTION?: string;
  TYPE_OF_SET_ASIDE_DESCRIPTION?: string;
  SIGNED_DATE?: string;
  EFFECTIVE_DATE?: string;
  CURRENT_CONTRACT_VALUE?: string;
  OBLIGATED_AMOUNT?: string;
  TOTAL_CURRENT_CONTRACT_VALUE?: string;
  [key: string]: string | string[] | undefined;
}

export interface FPDSRequestConfig {
  threadCount?: number;        // Default: 10
  timeout?: number;            // Default: 30000ms
  retryAttempts?: number;      // Default: 3
  retryDelay?: number;         // Default: 1000ms
  baseUrl?: string;            // FPDS API base URL
  userAgent?: string;          // Custom user agent
}

export interface OpportunityRecord {
  // Essential Opportunity Information
  opportunity_id: string;
  title: string;
  description: string;
  link: string;
  response_deadline: string;
  posted_date: string;
  classification_code: string;
  classification_description: string;
  
  // Agency Information
  contracting_agency: string;
  contracting_office: string;
  contracting_officer: string;
  
  // Location Information
  state: string;
  city: string;
  zip_code: string;
  
  // Business Information
  set_aside_type: string;
  small_business_eligible: boolean;
  naics_code: string;
  naics_description: string;
  
  // Contract Information
  contract_type: string;
  estimated_value: number;
  period_of_performance: string;
  
  // Source Metadata
  company_name?: string;
  search_keywords?: string[];
  source_opportunity_id?: string;
}

export interface OpportunitySearchParams {
  keywords?: string;
  location?: string;
  naics?: string;
  setAside?: string;
  responseDeadLine?: string;
  classificationCode?: string;
  limit?: number;
  offset?: number;
  [key: string]: string | number | string[] | undefined;
}

export interface OpportunityRequestConfig {
  threadCount?: number;        // Default: 5
  timeout?: number;            // Default: 30000ms
  retryAttempts?: number;      // Default: 3
  retryDelay?: number;         // Default: 1000ms
  baseUrl?: string;            // SAM.gov API base URL
  apiKey?: string;             // SAM.gov API key
}

export interface WageDeterminationRecord {
  // Essential Wage Information
  wage_determination_id: string;
  state: string;
  county: string;
  effective_date: string;
  expiration_date: string;
  
  // Work Classification
  construction_type: string;
  service_type: string;
  classification_code: string;
  
  // Wage Rates
  base_wage_rate: number;
  fringe_benefits: number;
  total_wage_rate: number;
  currency: string;
  
  // Additional Information
  notes: string;
  source_contract_id?: string;
  company_name?: string;
}

export interface WageDeterminationParams {
  state?: string;
  county?: string;
  constructionType?: string;
  serviceType?: string;
  contractId?: string;
  [key: string]: string | undefined;
}

export interface WageRequestConfig {
  timeout?: number;            // Default: 30000ms
  retryAttempts?: number;      // Default: 3
  retryDelay?: number;         // Default: 1000ms
  baseUrl?: string;            // Wage determination API base URL
}

// Shared interfaces
export interface BaseRequestConfig {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  userAgent?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
}

export interface RequestMetadata {
  searchUrl: string;
  requestTime: Date;
  responseTime?: Date;
  duration?: number;
  pagination?: PaginationInfo;
}

// Contract processing interfaces
export interface ContractSearchRequest {
  contracts: string[];            // Array of contract numbers
  dateRange?: string;            // Optional date range filter
  metadata?: Record<string, any>; // Optional metadata to attach to results
}