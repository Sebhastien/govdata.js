import { FPDSRequest, ContractProcessor } from '../src/index.js';

// Example 1: Single contract search
async function singleContractSearch() {
  console.log('=== Single Contract Search ===');
  
  const request = new FPDSRequest({
    PIID: 'HT001525D9012',
    LAST_MOD_DATE: '[2022/01/01, 2024/12/31]'
  });
  
  try {
    console.log(`Search URL: ${request.searchUrl}`);
    const contracts = await request.getData();
    console.log(`Found ${contracts.length} contracts`);
    
    if (contracts.length > 0) {
      console.log('First contract:', {
        contract_number: contracts[0].contract_number,
        vendor_name: contracts[0].vendor_name,
        award_amount: contracts[0].award_amount,
        contract_hash: contracts[0].contract_hash
      });
      
      // Show JSON output (default)
      const json = ContractProcessor.formatAsJSON(contracts.slice(0, 1));
      console.log('JSON output sample:', json.substring(0, 200) + '...');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 2: Multiple contract search
async function multipleContractSearch() {
  console.log('\n=== Multiple Contract Search ===');
  
  const contractNumbers = [
    'HT001525D9012',
    'HT001525D9013', 
    'HT001525D9014'
  ];
  
  try {
    console.log(`Searching ${contractNumbers.length} contracts concurrently...`);
    const contracts = await FPDSRequest.searchContracts({
      contracts: contractNumbers,
      dateRange: '[2022/01/01, 2024/12/31]',
      metadata: { source: 'example_application', batch_id: 'batch_001' }
    });
    
    console.log(`Found ${contracts.length} total contract records`);
    
    if (contracts.length > 0) {
      console.log('Sample contract with metadata:', {
        contract_number: contracts[0].contract_number,
        vendor_name: contracts[0].vendor_name,
        source_metadata: contracts[0].source_metadata
      });
      
      // Convert to CSV for export
      const csv = ContractProcessor.convertToCSV(contracts.slice(0, 2));
      console.log('CSV output sample:');
      console.log(csv.split('\n').slice(0, 3).join('\n') + '...');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 3: Advanced search with filters
async function advancedSearch() {
  console.log('\n=== Advanced Search with Filters ===');
  
  const request = new FPDSRequest({
    LAST_MOD_DATE: '[2023/01/01, 2024/12/31]',
    NAICS_CODE: '541511',
    CONTRACTING_AGENCY: 'HEALTH AND HUMAN SERVICES'
  }, {
    threadCount: 5,
    timeout: 45000
  });
  
  try {
    console.log(`Search URL: ${request.searchUrl}`);
    console.log('Concurrency info:', request.concurrencyInfo);
    
    const contracts = await request.getData();
    console.log(`Found ${contracts.length} contracts`);
    console.log(`Total pages: ${request.totalPages}`);
    console.log(`Total records: ${request.totalRecords}`);
    
    // Show performance metadata
    const metadata = request.requestMetadata;
    console.log(`Request duration: ${metadata.duration}ms`);
    
    if (contracts.length > 0) {
      console.log('Sample contract:', {
        contract_number: contracts[0].contract_number,
        contracting_agency: contracts[0].contracting_agency,
        naics_code: contracts[0].naics_code,
        award_amount: contracts[0].award_amount
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 4: Data processing and formatting
async function dataProcessingExample() {
  console.log('\n=== Data Processing Example ===');
  
  try {
    // Search a couple contracts
    const contracts = await FPDSRequest.searchContracts({
      contracts: ['HT001525D9012', 'HT001525D9013'],
      dateRange: '[2022/01/01, 2024/12/31]'
    });
    
    if (contracts.length > 0) {
      console.log(`Processing ${contracts.length} contracts...`);
      
      // Format as JSON (default)
      const jsonOutput = ContractProcessor.formatAsJSON(contracts);
      console.log('JSON output size:', jsonOutput.length, 'characters');
      
      // Convert to CSV for export
      const csvOutput = ContractProcessor.convertToCSV(contracts);
      console.log('CSV output size:', csvOutput.length, 'characters');
      console.log('CSV headers:', csvOutput.split('\n')[0]);
      
      // Show data summary
      const totalValue = contracts.reduce((sum, contract) => sum + contract.award_amount, 0);
      console.log(`Total contract value: $${totalValue.toLocaleString()}`);
      
      const agencies = [...new Set(contracts.map(c => c.contracting_agency))];
      console.log(`Unique agencies: ${agencies.length}`);
      
      const vendors = [...new Set(contracts.map(c => c.vendor_name))];
      console.log(`Unique vendors: ${vendors.length}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 5: Streaming large datasets
async function streamingExample() {
  console.log('\n=== Streaming Example ===');
  
  const request = new FPDSRequest({
    LAST_MOD_DATE: '[2023/01/01, 2024/12/31]',
    NAICS_CODE: '541511'
  });
  
  try {
    console.log('Streaming large dataset...');
    let totalRecords = 0;
    let batchCount = 0;
    
    for await (const batch of request.getDataStream()) {
      batchCount++;
      totalRecords += batch.length;
      console.log(`Batch ${batchCount}: ${batch.length} records (Total: ${totalRecords})`);
      
      // Process batch (e.g., save to database)
      if (batch.length > 0) {
        console.log(`  Sample from batch: ${batch[0].contract_number}`);
      }
      
      // Limit for demo purposes
      if (batchCount >= 3) {
        console.log('  Stopping demo after 3 batches...');
        break;
      }
    }
    
    console.log(`Streaming completed. Total records processed: ${totalRecords}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run all examples
async function runExamples() {
  console.log('govdata.js Examples\n');
  
  await singleContractSearch();
  await multipleContractSearch();
  await advancedSearch();
  await dataProcessingExample();
  await streamingExample();
  
  console.log('\n=== Examples completed ===');
  console.log('\nCLI Usage Examples:');
  console.log('govdata fpds --contract "HT001525D9012"');
  console.log('govdata fpds --contract "HT001525D9012" "HT001525D9013" --output contracts.json');
  console.log('govdata fpds --contract "HT001525D9012" --output contract.csv');
  console.log('govdata fpds --naics "541511" --date-range "[2023/01/01, 2024/12/31]" --output it_contracts.csv');
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}

export { runExamples };