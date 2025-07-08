# govdata.js

A modern TypeScript package for accessing U.S. government data systems. Provides clean, structured data from FPDS (Federal Procurement Data System) with exact compatibility to existing Python scripts.

## Features

- **FPDS Integration**: Access historical contract award data with full field mapping
- **TypeScript Support**: Full type definitions and IntelliSense support
- **Platform Agnostic**: Works in Node.js, Deno, and browser environments
- **Zero Dependencies**: Minimal external dependencies for better security
- **Data-Only Philosophy**: Returns clean data without built-in persistence
- **Multiple Contract Support**: Search multiple contracts in a single request
- **Concurrent Processing**: Configurable concurrency with custom semaphore
- **CLI Interface**: Simple command-line interface for contract lookup
- **JSON by Default**: Returns JSON by default, CSV optional

## Installation

```bash
npm install @bidstream/govdata.js
```

## Quick Start

```typescript
import { FPDSRequest, ContractProcessor } from '@bidstream/govdata.js';

// Get single contract data
const fpdsRequest = new FPDSRequest({
  PIID: 'HT001525D9012',
  LAST_MOD_DATE: '[2022/01/01, 2024/12/31]'
});
const contracts = await fpdsRequest.getData();

// Search multiple contracts at once
const multipleContracts = await FPDSRequest.searchContracts({
  contracts: ['HT001525D9012', 'HT001525D9013', 'HT001525D9014'],
  dateRange: '[2022/01/01, 2024/12/31]'
});

// Convert to JSON (default) or CSV
const json = ContractProcessor.formatAsJSON(contracts);
const csv = ContractProcessor.convertToCSV(contracts);
```

## API Reference

### FPDSRequest

```typescript
class FPDSRequest {
  constructor(params: FPDSSearchParams, config?: FPDSRequestConfig);
  
  async getData(): Promise<FPDSRecord[]>;
  async getPage(pageNumber: number): Promise<FPDSRecord[]>;
  async *getDataStream(): AsyncGenerator<FPDSRecord[]>;
  
  // Static method for multiple contracts
  static async searchContracts(request: ContractSearchRequest, config?: FPDSRequestConfig): Promise<FPDSRecord[]>;
  
  get totalPages(): number;
  get totalRecords(): number;
  get searchUrl(): string;
}
```

### Search Parameters

```typescript
interface FPDSSearchParams {
  PIID?: string | string[];         // Contract number(s) - can be single or array
  LAST_MOD_DATE?: string;          // Date range "[2022/01/01, 2024/12/31]"
  NAICS_CODE?: string;             // NAICS code filter
  PSC_CODE?: string;               // PSC code filter
  CONTRACTING_AGENCY?: string;     // Agency filter
  VENDOR_NAME?: string;            // Vendor name search
  // ... and 100+ additional FPDS parameters
}

interface ContractSearchRequest {
  contracts: string[];             // Array of contract numbers
  dateRange?: string;              // Optional date range filter
  metadata?: Record<string, any>;  // Optional metadata to attach to results
}
```

### FPDSRecord Interface

```typescript
interface FPDSRecord {
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
  contracting_agency: string;
  vendor_name: string;
  vendor_uei: string;
  business_size: string;
  vendor_city: string;
  vendor_state: string;
  sdvosb_status: string;           // "Yes"/"No"
  small_business_status: string;   // "Yes"/"No"
  women_owned_status: string;      // "Yes"/"No"
  // ... 47+ total fields matching Python scripts exactly
  source_metadata?: Record<string, any>; // Optional metadata from source
}
```

## Examples

### Single Contract Search

```typescript
import { FPDSRequest } from '@bidstream/govdata.js';

// Simple contract lookup
const request = new FPDSRequest({ PIID: 'HT001525D9012' });
const contracts = await request.getData();
console.log(`Found ${contracts.length} contracts`);
```

### Multiple Contract Search

```typescript
import { FPDSRequest } from '@bidstream/govdata.js';

// Search multiple contracts concurrently
const contracts = await FPDSRequest.searchContracts({
  contracts: ['HT001525D9012', 'HT001525D9013', 'HT001525D9014'],
  dateRange: '[2022/01/01, 2024/12/31]',
  metadata: { source: 'my_application', batch_id: '123' }
});

console.log(`Found ${contracts.length} total contracts across all searches`);
```

### Advanced FPDS Search

```typescript
import { FPDSRequest } from '@bidstream/govdata.js';

// Complex search with multiple parameters
const request = new FPDSRequest({
  LAST_MOD_DATE: '[2023/01/01, 2024/12/31]',
  NAICS_CODE: '541511',
  CONTRACTING_AGENCY: 'HEALTH AND HUMAN SERVICES'
}, {
  threadCount: 15,
  timeout: 45000
});

const contracts = await request.getData();
console.log(`Found ${contracts.length} contracts across ${request.totalPages} pages`);
```

### Data Processing

```typescript
import { FPDSRequest, ContractProcessor } from '@bidstream/govdata.js';

const request = new FPDSRequest({ PIID: 'HT001525D9012' });
const contracts = await request.getData();

// Get as JSON (default)
const jsonOutput = ContractProcessor.formatAsJSON(contracts);
console.log('JSON Output:', jsonOutput);

// Convert to CSV for export
const csvOutput = ContractProcessor.convertToCSV(contracts);
console.log('CSV Output:', csvOutput);

// Save to database (your choice of database)
await saveToDatabase(contracts);
```

### Error Handling

```typescript
import { FPDSRequest, GovDataError } from '@bidstream/govdata.js';

try {
  const contracts = await FPDSRequest.searchContracts({
    contracts: ['invalid-contract-1', 'invalid-contract-2']
  });
  console.log('Results:', contracts);
} catch (error) {
  if (error instanceof GovDataError) {
    console.error(`GovData Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    if (error.suggestions) {
      console.error(`Suggestions: ${error.suggestions.join(', ')}`);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## CLI Usage

```bash
# Install globally
npm install -g @bidstream/govdata.js

# Search single contract (outputs JSON to console by default)
govdata fpds --contract "HT001525D9012"

# Search multiple contracts and save as JSON
govdata fpds --contract "HT001525D9012" "HT001525D9013" --output contracts.json

# Search single contract with date range and save as CSV
govdata fpds --contract "HT001525D9012" --date-range "[2022/01/01, 2024/12/31]" --output contract.csv

# Search by NAICS code and save as CSV
govdata fpds --naics "541511" --date-range "[2023/01/01, 2024/12/31]" --output it_contracts.csv

# Search by agency with filters
govdata fpds --agency "HEALTH AND HUMAN SERVICES" --naics "541511" --output hhs_it.json

# Batch process multiple contracts with high concurrency
govdata fpds --contract "HT001525D9012" "HT001525D9013" "HT001525D9014" --threads 15 --output batch.csv
```

### CLI Options

- `--contract <contracts...>`: One or more contract numbers (PIID)
- `--date-range <range>`: Date range in format `[YYYY/MM/DD, YYYY/MM/DD]`
- `--output <file>`: Output file (.csv for CSV, anything else for JSON)
- `--threads <count>`: Number of concurrent threads (default: 10)
- `--naics <code>`: NAICS code filter
- `--psc <code>`: PSC code filter
- `--agency <name>`: Contracting agency filter
- `--vendor <name>`: Vendor name filter

## Use in Your Application

### Node.js API Route (Next.js)

```typescript
// pages/api/contracts.ts
import { FPDSRequest } from '@bidstream/govdata.js';

export default async function handler(req, res) {
  const { contracts, dateRange } = req.body;
  
  try {
    const results = await FPDSRequest.searchContracts({
      contracts,
      dateRange,
      metadata: { request_id: req.headers['x-request-id'] }
    });
    
    // Save to your database
    await saveContractsToDatabase(results);
    
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Supabase Edge Function

```typescript
// supabase/functions/fetch-contracts/index.ts
import { FPDSRequest } from '@bidstream/govdata.js';

Deno.serve(async (req) => {
  const { contracts, dateRange } = await req.json();
  
  const results = await FPDSRequest.searchContracts({
    contracts,
    dateRange
  });
  
  // Insert into Supabase
  const { data, error } = await supabase
    .from('contracts')
    .insert(results);
  
  return new Response(JSON.stringify({ 
    success: !error, 
    count: results.length 
  }));
});
```

## Configuration

```typescript
interface FPDSRequestConfig {
  threadCount?: number;        // Default: 10
  timeout?: number;            // Default: 30000ms
  retryAttempts?: number;      // Default: 3
  retryDelay?: number;         // Default: 1000ms
}
```

## Performance

- **Concurrent Processing**: Configurable thread count for parallel requests
- **Memory Efficient**: Streaming support for large datasets
- **Retry Logic**: Automatic retry with exponential backoff
- **Timeout Handling**: Configurable timeouts for all requests
- **Individual Failure Tolerance**: Single contract failures don't stop batch processing

## Browser Support

```typescript
// Works in modern browsers with fetch support
import { FPDSRequest } from '@bidstream/govdata.js';

const request = new FPDSRequest({ PIID: 'contract123' });
const contracts = await request.getData();
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [https://github.com/bidstream/govdata.js](https://github.com/bidstream/govdata.js)
- **Issues**: [https://github.com/bidstream/govdata.js/issues](https://github.com/bidstream/govdata.js/issues)