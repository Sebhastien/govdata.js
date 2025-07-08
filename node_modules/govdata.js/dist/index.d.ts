interface FPDSRecord {
    contract_hash: string;
    contract_number: string;
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
    contracting_agency: string;
    contracting_office_code: string;
    contracting_office_name: string;
    vendor_name: string;
    vendor_uei: string;
    business_size: string;
    vendor_city: string;
    vendor_state: string;
    sdvosb_status: string;
    small_business_status: string;
    women_owned_status: string;
    competition_extent: string;
    set_aside_type: string;
    number_of_offers: number;
    solicitation_procedure: string;
    start_date: string;
    end_date: string;
    performance_state: string;
    performance_city: string;
    parent_contract_id: string;
    parent_contract_type: string;
    source_metadata?: Record<string, any>;
}
interface FPDSSearchParams {
    LAST_MOD_DATE?: string;
    PIID?: string | string[];
    REF_IDV_PIID?: string;
    NAICS_CODE?: string;
    PSC_CODE?: string;
    CONTRACTING_AGENCY?: string;
    VENDOR_NAME?: string;
    SET_ASIDE_TYPE?: string;
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
interface FPDSRequestConfig {
    threadCount?: number;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    baseUrl?: string;
    userAgent?: string;
}
interface BaseRequestConfig {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    userAgent?: string;
}
interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    recordsPerPage: number;
}
interface RequestMetadata {
    searchUrl: string;
    requestTime: Date;
    responseTime?: Date;
    duration?: number;
    pagination?: PaginationInfo;
}
interface ContractSearchRequest {
    contracts: string[];
    dateRange?: string;
    metadata?: Record<string, any>;
}

declare class FPDSRequest {
    private params;
    private config;
    private xmlProcessor;
    private metadata;
    private semaphore;
    private static readonly DEFAULT_CONFIG;
    constructor(params: FPDSSearchParams, config?: FPDSRequestConfig);
    private buildSearchUrl;
    private makeRequest;
    private makeRequestWithRetry;
    private fetchPage;
    private getFirstPage;
    getData(): Promise<FPDSRecord[]>;
    getPage(pageNumber: number): Promise<FPDSRecord[]>;
    getDataStream(): AsyncGenerator<FPDSRecord[]>;
    get totalPages(): number;
    get totalRecords(): number;
    get searchUrl(): string;
    get requestMetadata(): RequestMetadata;
    get concurrencyInfo(): {
        available: number;
        waiting: number;
    };
    static searchContracts(request: ContractSearchRequest, config?: FPDSRequestConfig): Promise<FPDSRecord[]>;
}

declare class FPDSFieldMapper {
    static mapRecord(rawRecord: any, sourceMetadata?: any): FPDSRecord;
    static generateContractHash(contractNumber: string, awardDate: string): string;
    static mapRecords(rawRecords: any[], sourceMetadata?: any): FPDSRecord[];
    static getFieldMappings(): Record<string, string>;
}

declare class ContractProcessor {
    static processRecordsForCSV(records: FPDSRecord[]): FPDSRecord[];
    static convertToCSV(records: FPDSRecord[]): string;
    static generateContractHash(contractNumber: string, awardDate: string): string;
    static formatAsJSON(records: FPDSRecord[]): string;
}

declare class Semaphore {
    private permits;
    private queue;
    constructor(permits: number);
    acquire(): Promise<void>;
    release(): void;
    get available(): number;
    get waiting(): number;
}

interface XMLProcessorOptions {
    ignoreAttributes: boolean;
    attributeNamePrefix: string;
    textNodeName: string;
    ignoreNameSpace: boolean;
    removeNSPrefix: boolean;
    parseAttributeValue: boolean;
    parseTrueNumberOnly: boolean;
    arrayMode: boolean;
    trimValues: boolean;
}
declare class XMLProcessor {
    private parser;
    constructor(options?: Partial<XMLProcessorOptions>);
    parseXML(xmlData: string): any;
    extractEntries(parsedData: any): any[];
    flattenXMLPaths(obj: any, prefix?: string, result?: Record<string, any>): Record<string, any>;
    processXMLResponse(xmlData: string): any[];
}

declare function parseFloatSafe(value: any): number;
declare function parseIntSafe(value: any): number;
declare function convertBooleanToString(value: any): string;
declare function validateDateRange(dateRange: string): boolean;
declare function validatePIID(piid: string): boolean;
declare function validateNAICSCode(naics: string): boolean;
declare function validatePSCCode(psc: string): boolean;
declare function validateAgencyCode(agencyCode: string): boolean;
declare function validateStateCode(stateCode: string): boolean;
declare function validateZipCode(zipCode: string): boolean;
declare function sanitizeSearchTerm(term: string): string;
declare function validateSearchParams(params: Record<string, any>): void;
declare function buildQueryString(params: Record<string, any>): string;

declare class GovDataError extends Error {
    code: string;
    parameter?: string | undefined;
    suggestions?: string[] | undefined;
    constructor(code: string, message: string, parameter?: string | undefined, suggestions?: string[] | undefined);
}
declare class FPDSRequestError extends GovDataError {
    statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
declare class OpportunityRequestError extends GovDataError {
    statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
declare class WageRequestError extends GovDataError {
    statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
declare class ValidationError extends GovDataError {
    constructor(parameter: string, value: string, suggestions?: string[]);
}
declare class NetworkError extends GovDataError {
    originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
declare class ParseError extends GovDataError {
    data?: any | undefined;
    constructor(message: string, data?: any | undefined);
}

declare const VERSION = "1.0.0";
declare const DEFAULT_FPDS_CONFIG: {
    threadCount: number;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    baseUrl: string;
    userAgent: string;
};

export { type BaseRequestConfig, ContractProcessor, type ContractSearchRequest, DEFAULT_FPDS_CONFIG, FPDSFieldMapper, type FPDSRecord, FPDSRequest, type FPDSRequestConfig, FPDSRequestError, type FPDSSearchParams, GovDataError, NetworkError, OpportunityRequestError, type PaginationInfo, ParseError, type RequestMetadata, Semaphore, VERSION, ValidationError, WageRequestError, XMLProcessor, buildQueryString, convertBooleanToString, parseFloatSafe, parseIntSafe, sanitizeSearchTerm, validateAgencyCode, validateDateRange, validateNAICSCode, validatePIID, validatePSCCode, validateSearchParams, validateStateCode, validateZipCode };
