export class GovDataError extends Error {
  constructor(
    public code: string,
    message: string,
    public parameter?: string,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = 'GovDataError';
  }
}

export class FPDSRequestError extends GovDataError {
  constructor(message: string, public statusCode?: number) {
    super('FPDS_REQUEST_ERROR', message);
  }
}

export class OpportunityRequestError extends GovDataError {
  constructor(message: string, public statusCode?: number) {
    super('OPPORTUNITY_REQUEST_ERROR', message);
  }
}

export class WageRequestError extends GovDataError {
  constructor(message: string, public statusCode?: number) {
    super('WAGE_REQUEST_ERROR', message);
  }
}

export class ValidationError extends GovDataError {
  constructor(parameter: string, value: string, suggestions?: string[]) {
    super('VALIDATION_ERROR', `Invalid value for ${parameter}: ${value}`, parameter, suggestions);
  }
}

export class NetworkError extends GovDataError {
  constructor(message: string, public originalError?: Error) {
    super('NETWORK_ERROR', message);
  }
}

export class ParseError extends GovDataError {
  constructor(message: string, public data?: any) {
    super('PARSE_ERROR', message);
  }
}