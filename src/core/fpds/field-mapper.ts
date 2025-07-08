import { createHash } from 'crypto';
import { FPDSRecord } from '../types.js';
import { parseFloatSafe, parseIntSafe, convertBooleanToString } from '../../utils/validators.js';

export class FPDSFieldMapper {
  static mapRecord(rawRecord: any, sourceMetadata?: any): FPDSRecord {
    return {
      // Essential Contract Information
      contract_hash: this.generateContractHash(
        rawRecord['content__award__awardID__awardContractID__PIID'] || '',
        rawRecord['content__award__relevantContractDates__signedDate'] || ''
      ),
      contract_number: rawRecord['content__award__awardID__awardContractID__PIID'] || '',
      title: rawRecord['title'] || '',
      link: rawRecord['link__href'] || '',
      award_date: rawRecord['content__award__relevantContractDates__signedDate'] || '',
      award_amount: parseFloatSafe(rawRecord['content__award__dollarValues__obligatedAmount']),
      total_potential_value: parseFloatSafe(rawRecord['content__award__dollarValues__baseAndAllOptionsValue']),
      contract_type: rawRecord['content__award__contractData__contractActionType__description'] || '',
      project_description: rawRecord['content__award__contractData__descriptionOfContractRequirement'] || '',
      naics_code: rawRecord['content__award__productOrServiceInformation__principalNAICSCode'] || '',
      naics_description: rawRecord['content__award__productOrServiceInformation__principalNAICSCode__description'] || '',
      psc_code: rawRecord['content__award__productOrServiceInformation__productOrServiceCode'] || '',
      psc_description: rawRecord['content__award__productOrServiceInformation__productOrServiceCode__description'] || '',
      
      // Contracting Agency Information
      contracting_agency: rawRecord['content__award__purchaserInformation__contractingOfficeAgencyID__name'] || '',
      contracting_office_code: rawRecord['content__award__purchaserInformation__contractingOfficeID'] || '',
      contracting_office_name: rawRecord['content__award__purchaserInformation__contractingOfficeID__name'] || '',
      
      // Vendor Information
      vendor_name: rawRecord['content__award__vendor__vendorHeader__vendorName'] || '',
      vendor_uei: rawRecord['content__award__vendor__vendorSiteDetails__entityIdentifiers__vendorUEIInformation__UEI'] || '',
      business_size: rawRecord['content__award__vendor__contractingOfficerBusinessSizeDetermination__description'] || '',
      vendor_city: rawRecord['content__award__vendor__vendorSiteDetails__vendorLocation__city'] || '',
      vendor_state: rawRecord['content__award__vendor__vendorSiteDetails__vendorLocation__state'] || '',
      sdvosb_status: convertBooleanToString(rawRecord['content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isServiceRelatedDisabledVeteranOwnedBusiness']),
      small_business_status: convertBooleanToString(rawRecord['content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isSmallBusiness']),
      women_owned_status: convertBooleanToString(rawRecord['content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isWomenOwned']),
      
      // Competition Information
      competition_extent: rawRecord['content__award__competition__extentCompeted__description'] || '',
      set_aside_type: rawRecord['content__award__competition__idvTypeOfSetAside__description'] || '',
      number_of_offers: parseIntSafe(rawRecord['content__award__competition__numberOfOffersReceived']),
      solicitation_procedure: rawRecord['content__award__competition__solicitationProcedures__description'] || '',
      
      // Performance Information
      start_date: rawRecord['content__award__relevantContractDates__effectiveDate'] || '',
      end_date: rawRecord['content__award__relevantContractDates__currentCompletionDate'] || '',
      performance_state: rawRecord['content__award__placeOfPerformance__principalPlaceOfPerformance__stateCode'] || '',
      performance_city: rawRecord['content__award__placeOfPerformance__placeOfPerformanceZIPCode__city'] || '',
      
      // Reference Information for IDVs
      parent_contract_id: rawRecord['content__award__awardID__referencedIDVID__PIID'] || '',
      parent_contract_type: rawRecord['content__award__contractData__referencedIDVType__description'] || '',
      
      // Source Metadata
      source_metadata: sourceMetadata || undefined
    };
  }
  
  static generateContractHash(contractNumber: string, awardDate: string): string {
    const hashString = `${contractNumber}:${awardDate}`;
    return createHash('sha256').update(hashString).digest('hex');
  }
  
  static mapRecords(rawRecords: any[], sourceMetadata?: any): FPDSRecord[] {
    return rawRecords.map(record => this.mapRecord(record, sourceMetadata));
  }
  
  static getFieldMappings(): Record<string, string> {
    return {
      // Essential Contract Information
      'contract_hash': 'Generated from contract_number:award_date',
      'contract_number': 'content__award__awardID__awardContractID__PIID',
      'title': 'title',
      'link': 'link__href',
      'award_date': 'content__award__relevantContractDates__signedDate',
      'award_amount': 'content__award__dollarValues__obligatedAmount',
      'total_potential_value': 'content__award__dollarValues__baseAndAllOptionsValue',
      'contract_type': 'content__award__contractData__contractActionType__description',
      'project_description': 'content__award__contractData__descriptionOfContractRequirement',
      'naics_code': 'content__award__productOrServiceInformation__principalNAICSCode',
      'naics_description': 'content__award__productOrServiceInformation__principalNAICSCode__description',
      'psc_code': 'content__award__productOrServiceInformation__productOrServiceCode',
      'psc_description': 'content__award__productOrServiceInformation__productOrServiceCode__description',
      
      // Contracting Agency Information
      'contracting_agency': 'content__award__purchaserInformation__contractingOfficeAgencyID__name',
      'contracting_office_code': 'content__award__purchaserInformation__contractingOfficeID',
      'contracting_office_name': 'content__award__purchaserInformation__contractingOfficeID__name',
      
      // Vendor Information
      'vendor_name': 'content__award__vendor__vendorHeader__vendorName',
      'vendor_uei': 'content__award__vendor__vendorSiteDetails__entityIdentifiers__vendorUEIInformation__UEI',
      'business_size': 'content__award__vendor__contractingOfficerBusinessSizeDetermination__description',
      'vendor_city': 'content__award__vendor__vendorSiteDetails__vendorLocation__city',
      'vendor_state': 'content__award__vendor__vendorSiteDetails__vendorLocation__state',
      'sdvosb_status': 'content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isServiceRelatedDisabledVeteranOwnedBusiness',
      'small_business_status': 'content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isSmallBusiness',
      'women_owned_status': 'content__award__vendor__vendorSiteDetails__vendorSocioEconomicIndicators__isWomenOwned',
      
      // Competition Information
      'competition_extent': 'content__award__competition__extentCompeted__description',
      'set_aside_type': 'content__award__competition__idvTypeOfSetAside__description',
      'number_of_offers': 'content__award__competition__numberOfOffersReceived',
      'solicitation_procedure': 'content__award__competition__solicitationProcedures__description',
      
      // Performance Information
      'start_date': 'content__award__relevantContractDates__effectiveDate',
      'end_date': 'content__award__relevantContractDates__currentCompletionDate',
      'performance_state': 'content__award__placeOfPerformance__principalPlaceOfPerformance__stateCode',
      'performance_city': 'content__award__placeOfPerformance__placeOfPerformanceZIPCode__city',
      
      // Reference Information for IDVs
      'parent_contract_id': 'content__award__awardID__referencedIDVID__PIID',
      'parent_contract_type': 'content__award__contractData__referencedIDVType__description'
    };
  }
}