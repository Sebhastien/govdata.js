import { FPDSSearchParams, FPDSRequestConfig, FPDSRecord, PaginationInfo, RequestMetadata, ContractSearchRequest } from '../types.js';
import { FPDSRequestError, NetworkError } from '../../utils/errors.js';
import { validateSearchParams, buildQueryString } from '../../utils/validators.js';
import { XMLProcessor } from '../../utils/xml-processor.js';
import { FPDSFieldMapper } from './field-mapper.js';
import { Semaphore } from '../../utils/semaphore.js';

export class FPDSRequest {
  private params: FPDSSearchParams;
  private config: Required<FPDSRequestConfig>;
  private xmlProcessor: XMLProcessor;
  private metadata: RequestMetadata;
  private semaphore: Semaphore;
  
  private static readonly DEFAULT_CONFIG: Required<FPDSRequestConfig> = {
    threadCount: 10,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    baseUrl: 'https://api.sam.gov/prod/federalcontractopportunities/v1/search',
    userAgent: 'govdata.js/1.0.0'
  };
  
  constructor(params: FPDSSearchParams, config?: FPDSRequestConfig) {
    this.params = params;
    this.config = { ...FPDSRequest.DEFAULT_CONFIG, ...config };
    this.xmlProcessor = new XMLProcessor();
    this.semaphore = new Semaphore(this.config.threadCount);
    
    // Validate search parameters
    validateSearchParams(this.params);
    
    // Initialize metadata
    this.metadata = {
      searchUrl: this.buildSearchUrl(),
      requestTime: new Date()
    };
  }
  
  private buildSearchUrl(): string {
    const queryString = buildQueryString(this.params);
    return `${this.config.baseUrl}?${queryString}`;
  }
  
  private async makeRequest(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'application/xml',
          'Accept-Encoding': 'gzip, deflate'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new FPDSRequestError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }
      
      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof FPDSRequestError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${this.config.timeout}ms`);
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new NetworkError(`Network request failed: ${errorMessage}`, error instanceof Error ? error : undefined);
    }
  }
  
  private async makeRequestWithRetry(url: string): Promise<string> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await this.makeRequest(url);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === this.config.retryAttempts) {
          break;
        }
        
        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
  
  private async fetchPage(pageNumber: number = 1): Promise<FPDSRecord[]> {
    await this.semaphore.acquire();
    
    try {
      const pageParams = { ...this.params, page: pageNumber.toString() };
      const queryString = buildQueryString(pageParams);
      const url = `${this.config.baseUrl}?${queryString}`;
      
      const xmlData = await this.makeRequestWithRetry(url);
      const records = this.xmlProcessor.processXMLResponse(xmlData);
      
      return FPDSFieldMapper.mapRecords(records);
    } finally {
      this.semaphore.release();
    }
  }
  
  private async getFirstPage(): Promise<{ records: FPDSRecord[], pagination: PaginationInfo }> {
    const records = await this.fetchPage(1);
    
    // Extract pagination info from the first response
    // This would need to be implemented based on FPDS API response structure
    const pagination: PaginationInfo = {
      currentPage: 1,
      totalPages: 1, // This would be extracted from the XML response
      totalRecords: records.length, // This would be extracted from the XML response
      recordsPerPage: records.length
    };
    
    this.metadata.pagination = pagination;
    
    return { records, pagination };
  }
  
  public async getData(): Promise<FPDSRecord[]> {
    const startTime = new Date();
    this.metadata.requestTime = startTime;
    
    try {
      // Get the first page to determine pagination
      const { records: firstPageRecords, pagination } = await this.getFirstPage();
      
      // If only one page, return the results
      if (pagination.totalPages <= 1) {
        this.metadata.responseTime = new Date();
        this.metadata.duration = this.metadata.responseTime.getTime() - startTime.getTime();
        return firstPageRecords;
      }
      
      // Create tasks for remaining pages
      const pagePromises: Promise<FPDSRecord[]>[] = [];
      for (let page = 2; page <= pagination.totalPages; page++) {
        pagePromises.push(this.fetchPage(page));
      }
      
      // Wait for all pages to complete
      const remainingPages = await Promise.all(pagePromises);
      
      // Combine all results
      const allRecords = [firstPageRecords, ...remainingPages].flat();
      
      this.metadata.responseTime = new Date();
      this.metadata.duration = this.metadata.responseTime.getTime() - startTime.getTime();
      
      return allRecords;
    } catch (error) {
      this.metadata.responseTime = new Date();
      this.metadata.duration = this.metadata.responseTime.getTime() - startTime.getTime();
      throw error;
    }
  }
  
  public async getPage(pageNumber: number): Promise<FPDSRecord[]> {
    return await this.fetchPage(pageNumber);
  }
  
  public async *getDataStream(): AsyncGenerator<FPDSRecord[]> {
    // Get the first page to determine pagination
    const { records: firstPageRecords, pagination } = await this.getFirstPage();
    
    yield firstPageRecords;
    
    // Stream remaining pages
    for (let page = 2; page <= pagination.totalPages; page++) {
      yield await this.fetchPage(page);
    }
  }
  
  public get totalPages(): number {
    return this.metadata.pagination?.totalPages || 0;
  }
  
  public get totalRecords(): number {
    return this.metadata.pagination?.totalRecords || 0;
  }
  
  public get searchUrl(): string {
    return this.metadata.searchUrl;
  }
  
  public get requestMetadata(): RequestMetadata {
    return { ...this.metadata };
  }
  
  public get concurrencyInfo(): { available: number, waiting: number } {
    return {
      available: this.semaphore.available,
      waiting: this.semaphore.waiting
    };
  }
  
  // Static method for multiple contract searches
  public static async searchContracts(request: ContractSearchRequest, config?: FPDSRequestConfig): Promise<FPDSRecord[]> {
    const allRecords: FPDSRecord[] = [];
    
    // Create tasks for each contract number
    const tasks = request.contracts.map(async (contractNumber) => {
      const searchParams: FPDSSearchParams = {
        PIID: contractNumber,
        LAST_MOD_DATE: request.dateRange
      };
      
      const fpdsRequest = new FPDSRequest(searchParams, config);
      
      try {
        const records = await fpdsRequest.getData();
        
        // Add metadata if provided
        if (request.metadata) {
          return records.map(record => ({
            ...record,
            source_metadata: { ...request.metadata, source_contract_number: contractNumber }
          }));
        }
        
        return records;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error fetching data for contract ${contractNumber}: ${errorMessage}`);
        return [];
      }
    });
    
    // Execute all searches concurrently
    const results = await Promise.all(tasks);
    
    // Flatten results
    return results.flat();
  }
}