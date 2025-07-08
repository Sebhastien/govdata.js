#!/usr/bin/env node

import { Command } from 'commander';
import { FPDSRequest } from '../index.js';
import { ContractProcessor } from '../core/fpds/contract-processor.js';
import { promises as fs } from 'fs';

const program = new Command();

program
  .name('govdata')
  .description('CLI for accessing U.S. government data systems')
  .version('1.0.0');

// FPDS command
program
  .command('fpds')
  .description('Search FPDS contracts')
  .option('-c, --contract <contracts...>', 'Contract number(s) (PIID). Can specify multiple contracts.')
  .option('-d, --date-range <date-range>', 'Date range [YYYY/MM/DD, YYYY/MM/DD]')
  .option('-o, --output <file>', 'Output file (.csv or .json). If not specified, outputs JSON to console.')
  .option('--threads <count>', 'Number of concurrent threads', '10')
  .option('--naics <naics>', 'NAICS code filter')
  .option('--psc <psc>', 'PSC code filter')
  .option('--agency <agency>', 'Contracting agency filter')
  .option('--vendor <vendor>', 'Vendor name filter')
  .action(async (options) => {
    try {
      // Build search parameters
      const params: any = {};
      
      if (options.contract) {
        // Handle multiple contract numbers
        params.PIID = options.contract.length === 1 ? options.contract[0] : options.contract;
      }
      if (options.dateRange) params.LAST_MOD_DATE = options.dateRange;
      if (options.naics) params.NAICS_CODE = options.naics;
      if (options.psc) params.PSC_CODE = options.psc;
      if (options.agency) params.CONTRACTING_AGENCY = options.agency;
      if (options.vendor) params.VENDOR_NAME = options.vendor;
      
      // Validate that we have either contract numbers or other search parameters
      if (!options.contract && !options.naics && !options.psc && !options.agency && !options.vendor) {
        console.error('Error: Must specify at least one search parameter (contract number, NAICS, PSC, agency, or vendor)');
        process.exit(1);
      }
      
      const config = {
        threadCount: parseInt(options.threads)
      };
      
      console.log('Searching FPDS contracts...');
      
      let records;
      
      if (options.contract && options.contract.length > 1) {
        // Use the static method for multiple contracts
        records = await FPDSRequest.searchContracts({
          contracts: options.contract,
          dateRange: options.dateRange
        }, config);
      } else {
        // Use regular single request
        const request = new FPDSRequest(params, config);
        console.log(`Search URL: ${request.searchUrl}`);
        records = await request.getData();
        console.log(`Total pages: ${request.totalPages}`);
        console.log(`Total records from API: ${request.totalRecords}`);
      }
      
      console.log(`Found ${records.length} contract records`);
      
      if (options.output) {
        const outputPath = options.output;
        const isCSV = outputPath.toLowerCase().endsWith('.csv');
        
        if (isCSV) {
          const csv = ContractProcessor.convertToCSV(records);
          await fs.writeFile(outputPath, csv, 'utf-8');
          console.log(`CSV file created: ${outputPath}`);
        } else {
          // Default to JSON for any other extension
          const json = ContractProcessor.formatAsJSON(records);
          await fs.writeFile(outputPath, json, 'utf-8');
          console.log(`JSON file created: ${outputPath}`);
        }
      } else {
        // Output JSON to console by default
        console.log('\\nResults:');
        console.log(ContractProcessor.formatAsJSON(records));
      }
      
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(`
govdata.js CLI Examples:

# Search for a single contract and output JSON to console
govdata fpds --contract "HT001525D9012"

# Search for multiple contracts and save as JSON
govdata fpds --contract "HT001525D9012" "HT001525D9013" --output contracts.json

# Search for a single contract with date range and save as CSV
govdata fpds --contract "HT001525D9012" --date-range "[2022/01/01, 2024/12/31]" --output contract.csv

# Search by NAICS code and save as CSV
govdata fpds --naics "541511" --date-range "[2023/01/01, 2024/12/31]" --output it_contracts.csv

# Search by agency with multiple filters
govdata fpds --agency "HEALTH AND HUMAN SERVICES" --naics "541511" --output hhs_it.json

# Search with high concurrency
govdata fpds --contract "HT001525D9012" "HT001525D9013" "HT001525D9014" --threads 15 --output multiple.csv

Notes:
- Default output is JSON to console
- Use .csv extension for CSV output, anything else defaults to JSON
- Date ranges must be in format [YYYY/MM/DD, YYYY/MM/DD]
- Multiple contract numbers can be specified for batch processing
    `);
  });

program.parse();