import { FPDSRecord } from '../types.js';
import { FPDSFieldMapper } from './field-mapper.js';

export class ContractProcessor {
  static processRecordsForCSV(records: FPDSRecord[]): FPDSRecord[] {
    return records.map(record => {
      const processedRecord = { ...record };
      
      // Convert string values to appropriate types for better CSV formatting
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
      
      // Convert boolean fields to string "Yes"/"No" for better readability in CSV
      processedRecord.sdvosb_status = processedRecord.sdvosb_status === 'true' ? 'Yes' : 'No';
      processedRecord.small_business_status = processedRecord.small_business_status === 'true' ? 'Yes' : 'No';
      processedRecord.women_owned_status = processedRecord.women_owned_status === 'true' ? 'Yes' : 'No';
      
      return processedRecord;
    });
  }
  
  static convertToCSV(records: FPDSRecord[]): string {
    if (records.length === 0) {
      return '';
    }
    
    const processedRecords = this.processRecordsForCSV(records);
    const headers = Object.keys(processedRecords[0]);
    
    // Create CSV header
    const csvHeaders = headers.join(',');
    
    // Create CSV rows
    const csvRows = processedRecords.map(record => {
      return headers.map(header => {
        const value = record[header as keyof FPDSRecord];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
  }
  
  static generateContractHash(contractNumber: string, awardDate: string): string {
    return FPDSFieldMapper.generateContractHash(contractNumber, awardDate);
  }
  
  static formatAsJSON(records: FPDSRecord[]): string {
    return JSON.stringify(records, null, 2);
  }
}