'use strict';

var fastXmlParser = require('fast-xml-parser');
var crypto = require('crypto');

// src/utils/errors.ts
var GovDataError = class extends Error {
  constructor(code, message, parameter, suggestions) {
    super(message);
    this.code = code;
    this.parameter = parameter;
    this.suggestions = suggestions;
    this.name = "GovDataError";
  }
};
var FPDSRequestError = class extends GovDataError {
  constructor(message, statusCode) {
    super("FPDS_REQUEST_ERROR", message);
    this.statusCode = statusCode;
  }
};
var OpportunityRequestError = class extends GovDataError {
  constructor(message, statusCode) {
    super("OPPORTUNITY_REQUEST_ERROR", message);
    this.statusCode = statusCode;
  }
};
var WageRequestError = class extends GovDataError {
  constructor(message, statusCode) {
    super("WAGE_REQUEST_ERROR", message);
    this.statusCode = statusCode;
  }
};
var ValidationError = class extends GovDataError {
  constructor(parameter, value, suggestions) {
    super("VALIDATION_ERROR", `Invalid value for ${parameter}: ${value}`, parameter, suggestions);
  }
};
var NetworkError = class extends GovDataError {
  constructor(message, originalError) {
    super("NETWORK_ERROR", message);
    this.originalError = originalError;
  }
};
var ParseError = class extends GovDataError {
  constructor(message, data) {
    super("PARSE_ERROR", message);
    this.data = data;
  }
};

// src/utils/validators.ts
function parseFloatSafe(value) {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
function parseIntSafe(value) {
  if (!value) return 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}
function convertBooleanToString(value) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return value === "true" ? "Yes" : "No";
}
function validateDateRange(dateRange) {
  const dateRangePattern = /^\[\d{4}\/\d{2}\/\d{2}\s*,\s*\d{4}\/\d{2}\/\d{2}\]$/;
  return dateRangePattern.test(dateRange);
}
function validatePIID(piid) {
  return Boolean(piid && piid.trim().length > 0);
}
function validateNAICSCode(naics) {
  const naicsPattern = /^\d{6}$/;
  return naicsPattern.test(naics);
}
function validatePSCCode(psc) {
  const pscPattern = /^[A-Z]\d{3}$/;
  return pscPattern.test(psc);
}
function validateAgencyCode(agencyCode) {
  const agencyPattern = /^\d{4}$/;
  return agencyPattern.test(agencyCode);
}
function validateStateCode(stateCode) {
  const statePattern = /^[A-Z]{2}$/;
  return statePattern.test(stateCode);
}
function validateZipCode(zipCode) {
  const zipPattern = /^\d{5}(-\d{4})?$/;
  return zipPattern.test(zipCode);
}
function sanitizeSearchTerm(term) {
  return term.trim().replace(/[<>]/g, "");
}
function validateSearchParams(params) {
  for (const [key, value] of Object.entries(params)) {
    if (value === void 0 || value === null) {
      continue;
    }
    switch (key) {
      case "LAST_MOD_DATE":
        if (typeof value === "string" && !validateDateRange(value)) {
          throw new ValidationError(key, value, [
            "Use format: [YYYY/MM/DD, YYYY/MM/DD]",
            "Example: [2022/01/01, 2024/12/31]"
          ]);
        }
        break;
      case "PIID":
      case "REF_IDV_PIID":
        if (typeof value === "string" && !validatePIID(value)) {
          throw new ValidationError(key, value, [
            "Contract ID cannot be empty",
            "Remove any leading/trailing whitespace"
          ]);
        }
        break;
      case "PRINCIPAL_NAICS_CODE":
      case "NAICS_CODE":
        if (typeof value === "string" && !validateNAICSCode(value)) {
          throw new ValidationError(key, value, [
            "NAICS code must be exactly 6 digits",
            "Example: 541511"
          ]);
        }
        break;
      case "PRODUCT_OR_SERVICE_CODE":
      case "PSC_CODE":
        if (typeof value === "string" && !validatePSCCode(value)) {
          throw new ValidationError(key, value, [
            "PSC code must be 1 letter followed by 3 digits",
            "Example: R425"
          ]);
        }
        break;
      case "AGENCY_CODE":
      case "CONTRACTING_AGENCY_ID":
      case "FUNDING_AGENCY_ID":
        if (typeof value === "string" && !validateAgencyCode(value)) {
          throw new ValidationError(key, value, [
            "Agency code must be exactly 4 digits",
            "Example: 9700"
          ]);
        }
        break;
    }
  }
}
function buildQueryString(params) {
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== void 0 && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  }
  return queryParams.toString();
}
var XMLProcessor = class {
  constructor(options) {
    const defaultOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: "",
      textNodeName: "#text",
      ignoreNameSpace: true,
      removeNSPrefix: true,
      parseAttributeValue: true,
      parseTrueNumberOnly: false,
      arrayMode: false,
      trimValues: true
    };
    this.parser = new fastXmlParser.XMLParser({
      ...defaultOptions,
      ...options
    });
  }
  parseXML(xmlData) {
    try {
      if (!xmlData || xmlData.trim().length === 0) {
        throw new ParseError("XML data is empty or null");
      }
      const result = this.parser.parse(xmlData);
      return result;
    } catch (error) {
      if (error instanceof ParseError) {
        throw error;
      }
      throw new ParseError(`Failed to parse XML: ${error}`);
    }
  }
  extractEntries(parsedData) {
    try {
      const feed = parsedData?.feed;
      if (!feed) {
        return [];
      }
      const entries = feed.entry;
      if (!entries) {
        return [];
      }
      return Array.isArray(entries) ? entries : [entries];
    } catch (error) {
      throw new ParseError(`Failed to extract entries from parsed XML: ${error}`);
    }
  }
  flattenXMLPaths(obj, prefix = "", result = {}) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}__${key}` : key;
        const value = obj[key];
        if (value && typeof value === "object" && !Array.isArray(value)) {
          this.flattenXMLPaths(value, newKey, result);
        } else {
          result[newKey] = value;
        }
      }
    }
    return result;
  }
  processXMLResponse(xmlData) {
    const parsedData = this.parseXML(xmlData);
    const entries = this.extractEntries(parsedData);
    return entries.map((entry) => this.flattenXMLPaths(entry));
  }
};
var FPDSFieldMapper = class {
  static mapRecord(rawRecord, sourceMetadata) {
    return {
      // Essential Contract Information
      contract_hash: this.generateContractHash(
        rawRecord["content__award__awardID__awardContractID__PIID"] || "",
        rawRecord["content__award__relevantContractDates__signedDate"] || ""
      ),
      contract_number: rawRecord["content__award__awardID__awardContractID__PIID"] || "",
      title: rawRecord["title"] || "",
      link: rawRecord["link__href"] || "",
      award_date: rawRecord["content__award__relevantContractDates__signedDate"] || "",
      award_amount: parseFloatSafe(rawRecord["content__award__dollarValues__obligatedAmount"]),
      total_potential_value: parseFloatSafe(rawRecord["content__award__dollarValues__baseAndAllOptionsValue"]),
      contract_type: rawRecord["content__award__contractData__contractActionType__description"] || "",
      project_description: rawRecord["content__award__contractData__descriptionOfContractRequirement"] || "",
      naics_code: rawRecord["content__award__productOrServiceInformation__principalNAICSCode"] || "",
      naics_description: rawRecord["content__award__productOrServiceInformation__principalNAICSCode__description"] || "",
      psc_code: rawRecord["content__award__productOrServiceInformation__productOrServiceCode"] || "",
      psc_description: rawRecord["content__award__productOrServiceInformation__productOrServiceCode__description"] || "",
      // Contracting Agency Information
      contracting_agency: rawRecord["content__award__purchaserInformation__contractingOfficeAgencyID__name"] || "",
      contracting_office_code: rawRecord["content__award__purchaserInformation__contractingOfficeID"] || "",
      contracting_office_name: rawRecord["content__award__purchaserInformation__contractingOfficeID__name"] || "",
      // Vendor Information
      vendor_name: rawRecord["content__award__vendor__vendorHeader__vendorName"] || "",
      vendor_uei: rawRecord["content__award__vendor__vendorSiteDetails__entityIdentifiers__vendorUEIInformation__UEI"] || "",
      business_size: rawRecord["content__award__vendor__contractingOfficerBusinessSizeDetermination__description"] || "",
      vendor_city: rawRecord["content__award__vendor__vendorSiteDetails__vendorLocation__city"] || "",
      vendor_state: rawRecord["content__award__vendor__vendorSiteDetails__vendorLocation__state"] || "",
      sdvosb_status: convertBooleanToString(rawRecord["content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isServiceRelatedDisabledVeteranOwnedBusiness"]),
      small_business_status: convertBooleanToString(rawRecord["content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isSmallBusiness"]),
      women_owned_status: convertBooleanToString(rawRecord["content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isWomenOwned"]),
      // Competition Information
      competition_extent: rawRecord["content__award__competition__extentCompeted__description"] || "",
      set_aside_type: rawRecord["content__award__competition__idvTypeOfSetAside__description"] || "",
      number_of_offers: parseIntSafe(rawRecord["content__award__competition__numberOfOffersReceived"]),
      solicitation_procedure: rawRecord["content__award__competition__solicitationProcedures__description"] || "",
      // Performance Information
      start_date: rawRecord["content__award__relevantContractDates__effectiveDate"] || "",
      end_date: rawRecord["content__award__relevantContractDates__currentCompletionDate"] || "",
      performance_state: rawRecord["content__award__placeOfPerformance__principalPlaceOfPerformance__stateCode"] || "",
      performance_city: rawRecord["content__award__placeOfPerformance__placeOfPerformanceZIPCode__city"] || "",
      // Reference Information for IDVs
      parent_contract_id: rawRecord["content__award__awardID__referencedIDVID__PIID"] || "",
      parent_contract_type: rawRecord["content__award__contractData__referencedIDVType__description"] || "",
      // Source Metadata
      source_metadata: sourceMetadata || void 0
    };
  }
  static generateContractHash(contractNumber, awardDate) {
    const hashString = `${contractNumber}:${awardDate}`;
    return crypto.createHash("sha256").update(hashString).digest("hex");
  }
  static mapRecords(rawRecords, sourceMetadata) {
    return rawRecords.map((record) => this.mapRecord(record, sourceMetadata));
  }
  static getFieldMappings() {
    return {
      // Essential Contract Information
      "contract_hash": "Generated from contract_number:award_date",
      "contract_number": "content__award__awardID__awardContractID__PIID",
      "title": "title",
      "link": "link__href",
      "award_date": "content__award__relevantContractDates__signedDate",
      "award_amount": "content__award__dollarValues__obligatedAmount",
      "total_potential_value": "content__award__dollarValues__baseAndAllOptionsValue",
      "contract_type": "content__award__contractData__contractActionType__description",
      "project_description": "content__award__contractData__descriptionOfContractRequirement",
      "naics_code": "content__award__productOrServiceInformation__principalNAICSCode",
      "naics_description": "content__award__productOrServiceInformation__principalNAICSCode__description",
      "psc_code": "content__award__productOrServiceInformation__productOrServiceCode",
      "psc_description": "content__award__productOrServiceInformation__productOrServiceCode__description",
      // Contracting Agency Information
      "contracting_agency": "content__award__purchaserInformation__contractingOfficeAgencyID__name",
      "contracting_office_code": "content__award__purchaserInformation__contractingOfficeID",
      "contracting_office_name": "content__award__purchaserInformation__contractingOfficeID__name",
      // Vendor Information
      "vendor_name": "content__award__vendor__vendorHeader__vendorName",
      "vendor_uei": "content__award__vendor__vendorSiteDetails__entityIdentifiers__vendorUEIInformation__UEI",
      "business_size": "content__award__vendor__contractingOfficerBusinessSizeDetermination__description",
      "vendor_city": "content__award__vendor__vendorSiteDetails__vendorLocation__city",
      "vendor_state": "content__award__vendor__vendorSiteDetails__vendorLocation__state",
      "sdvosb_status": "content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isServiceRelatedDisabledVeteranOwnedBusiness",
      "small_business_status": "content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isSmallBusiness",
      "women_owned_status": "content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isWomenOwned",
      // Competition Information
      "competition_extent": "content__award__competition__extentCompeted__description",
      "set_aside_type": "content__award__competition__idvTypeOfSetAside__description",
      "number_of_offers": "content__award__competition__numberOfOffersReceived",
      "solicitation_procedure": "content__award__competition__solicitationProcedures__description",
      // Performance Information
      "start_date": "content__award__relevantContractDates__effectiveDate",
      "end_date": "content__award__relevantContractDates__currentCompletionDate",
      "performance_state": "content__award__placeOfPerformance__principalPlaceOfPerformance__stateCode",
      "performance_city": "content__award__placeOfPerformance__placeOfPerformanceZIPCode__city",
      // Reference Information for IDVs
      "parent_contract_id": "content__award__awardID__referencedIDVID__PIID",
      "parent_contract_type": "content__award__contractData__referencedIDVType__description"
    };
  }
};

// src/utils/semaphore.ts
var Semaphore = class {
  constructor(permits) {
    this.queue = [];
    this.permits = permits;
  }
  async acquire() {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }
  release() {
    this.permits++;
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      this.permits--;
      resolve();
    }
  }
  get available() {
    return this.permits;
  }
  get waiting() {
    return this.queue.length;
  }
};

// src/core/fpds/request.ts
var FPDSRequest = class _FPDSRequest {
  static {
    this.DEFAULT_CONFIG = {
      threadCount: 10,
      timeout: 3e4,
      retryAttempts: 3,
      retryDelay: 1e3,
      baseUrl: "https://api.sam.gov/prod/federalcontractopportunities/v1/search",
      userAgent: "govdata.js/1.0.0"
    };
  }
  constructor(params, config) {
    this.params = params;
    this.config = { ..._FPDSRequest.DEFAULT_CONFIG, ...config };
    this.xmlProcessor = new XMLProcessor();
    this.semaphore = new Semaphore(this.config.threadCount);
    validateSearchParams(this.params);
    this.metadata = {
      searchUrl: this.buildSearchUrl(),
      requestTime: /* @__PURE__ */ new Date()
    };
  }
  buildSearchUrl() {
    const queryString = buildQueryString(this.params);
    return `${this.config.baseUrl}?${queryString}`;
  }
  async makeRequest(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": this.config.userAgent,
          "Accept": "application/xml",
          "Accept-Encoding": "gzip, deflate"
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
      if (error instanceof Error && error.name === "AbortError") {
        throw new NetworkError(`Request timeout after ${this.config.timeout}ms`);
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new NetworkError(`Network request failed: ${errorMessage}`, error instanceof Error ? error : void 0);
    }
  }
  async makeRequestWithRetry(url) {
    let lastError;
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await this.makeRequest(url);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === this.config.retryAttempts) {
          break;
        }
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }
  async fetchPage(pageNumber = 1) {
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
  async getFirstPage() {
    const records = await this.fetchPage(1);
    const pagination = {
      currentPage: 1,
      totalPages: 1,
      // This would be extracted from the XML response
      totalRecords: records.length,
      // This would be extracted from the XML response
      recordsPerPage: records.length
    };
    this.metadata.pagination = pagination;
    return { records, pagination };
  }
  async getData() {
    const startTime = /* @__PURE__ */ new Date();
    this.metadata.requestTime = startTime;
    try {
      const { records: firstPageRecords, pagination } = await this.getFirstPage();
      if (pagination.totalPages <= 1) {
        this.metadata.responseTime = /* @__PURE__ */ new Date();
        this.metadata.duration = this.metadata.responseTime.getTime() - startTime.getTime();
        return firstPageRecords;
      }
      const pagePromises = [];
      for (let page = 2; page <= pagination.totalPages; page++) {
        pagePromises.push(this.fetchPage(page));
      }
      const remainingPages = await Promise.all(pagePromises);
      const allRecords = [firstPageRecords, ...remainingPages].flat();
      this.metadata.responseTime = /* @__PURE__ */ new Date();
      this.metadata.duration = this.metadata.responseTime.getTime() - startTime.getTime();
      return allRecords;
    } catch (error) {
      this.metadata.responseTime = /* @__PURE__ */ new Date();
      this.metadata.duration = this.metadata.responseTime.getTime() - startTime.getTime();
      throw error;
    }
  }
  async getPage(pageNumber) {
    return await this.fetchPage(pageNumber);
  }
  async *getDataStream() {
    const { records: firstPageRecords, pagination } = await this.getFirstPage();
    yield firstPageRecords;
    for (let page = 2; page <= pagination.totalPages; page++) {
      yield await this.fetchPage(page);
    }
  }
  get totalPages() {
    return this.metadata.pagination?.totalPages || 0;
  }
  get totalRecords() {
    return this.metadata.pagination?.totalRecords || 0;
  }
  get searchUrl() {
    return this.metadata.searchUrl;
  }
  get requestMetadata() {
    return { ...this.metadata };
  }
  get concurrencyInfo() {
    return {
      available: this.semaphore.available,
      waiting: this.semaphore.waiting
    };
  }
  // Static method for multiple contract searches
  static async searchContracts(request, config) {
    const tasks = request.contracts.map(async (contractNumber) => {
      const searchParams = {
        PIID: contractNumber,
        LAST_MOD_DATE: request.dateRange
      };
      const fpdsRequest = new _FPDSRequest(searchParams, config);
      try {
        const records = await fpdsRequest.getData();
        if (request.metadata) {
          return records.map((record) => ({
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
    const results = await Promise.all(tasks);
    return results.flat();
  }
};

// src/core/fpds/contract-processor.ts
var ContractProcessor = class {
  static processRecordsForCSV(records) {
    return records.map((record) => {
      const processedRecord = { ...record };
      if (processedRecord.award_amount) {
        processedRecord.award_amount = parseFloat(processedRecord.award_amount.toString());
      } else {
        processedRecord.award_amount = 0;
      }
      if (processedRecord.total_potential_value) {
        processedRecord.total_potential_value = parseFloat(processedRecord.total_potential_value.toString());
      } else {
        processedRecord.total_potential_value = 0;
      }
      if (processedRecord.number_of_offers) {
        try {
          processedRecord.number_of_offers = parseInt(processedRecord.number_of_offers.toString(), 10);
        } catch {
          processedRecord.number_of_offers = 0;
        }
      } else {
        processedRecord.number_of_offers = 0;
      }
      processedRecord.sdvosb_status = processedRecord.sdvosb_status === "true" ? "Yes" : "No";
      processedRecord.small_business_status = processedRecord.small_business_status === "true" ? "Yes" : "No";
      processedRecord.women_owned_status = processedRecord.women_owned_status === "true" ? "Yes" : "No";
      return processedRecord;
    });
  }
  static convertToCSV(records) {
    if (records.length === 0) {
      return "";
    }
    const processedRecords = this.processRecordsForCSV(records);
    const headers = Object.keys(processedRecords[0]);
    const csvHeaders = headers.join(",");
    const csvRows = processedRecords.map((record) => {
      return headers.map((header) => {
        const value = record[header];
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",");
    });
    return [csvHeaders, ...csvRows].join("\n");
  }
  static generateContractHash(contractNumber, awardDate) {
    return FPDSFieldMapper.generateContractHash(contractNumber, awardDate);
  }
  static formatAsJSON(records) {
    return JSON.stringify(records, null, 2);
  }
};

// src/index.ts
var VERSION = "1.0.0";
var DEFAULT_FPDS_CONFIG = {
  threadCount: 10,
  timeout: 3e4,
  retryAttempts: 3,
  retryDelay: 1e3,
  baseUrl: "https://api.sam.gov/prod/federalcontractopportunities/v1/search",
  userAgent: "govdata.js/1.0.0"
};

exports.ContractProcessor = ContractProcessor;
exports.DEFAULT_FPDS_CONFIG = DEFAULT_FPDS_CONFIG;
exports.FPDSFieldMapper = FPDSFieldMapper;
exports.FPDSRequest = FPDSRequest;
exports.FPDSRequestError = FPDSRequestError;
exports.GovDataError = GovDataError;
exports.NetworkError = NetworkError;
exports.OpportunityRequestError = OpportunityRequestError;
exports.ParseError = ParseError;
exports.Semaphore = Semaphore;
exports.VERSION = VERSION;
exports.ValidationError = ValidationError;
exports.WageRequestError = WageRequestError;
exports.XMLProcessor = XMLProcessor;
exports.buildQueryString = buildQueryString;
exports.convertBooleanToString = convertBooleanToString;
exports.parseFloatSafe = parseFloatSafe;
exports.parseIntSafe = parseIntSafe;
exports.sanitizeSearchTerm = sanitizeSearchTerm;
exports.validateAgencyCode = validateAgencyCode;
exports.validateDateRange = validateDateRange;
exports.validateNAICSCode = validateNAICSCode;
exports.validatePIID = validatePIID;
exports.validatePSCCode = validatePSCCode;
exports.validateSearchParams = validateSearchParams;
exports.validateStateCode = validateStateCode;
exports.validateZipCode = validateZipCode;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map