import { XMLParser } from 'fast-xml-parser';
import { ParseError } from './errors.js';

export interface XMLProcessorOptions {
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

export class XMLProcessor {
  private parser: XMLParser;
  
  constructor(options?: Partial<XMLProcessorOptions>) {
    const defaultOptions: XMLProcessorOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '#text',
      ignoreNameSpace: true,
      removeNSPrefix: true,
      parseAttributeValue: true,
      parseTrueNumberOnly: false,
      arrayMode: false,
      trimValues: true,
    };
    
    this.parser = new XMLParser({
      ...defaultOptions,
      ...options,
    });
  }
  
  parseXML(xmlData: string): any {
    try {
      if (!xmlData || xmlData.trim().length === 0) {
        throw new ParseError('XML data is empty or null');
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
  
  extractEntries(parsedData: any): any[] {
    try {
      // Navigate through the FPDS XML structure
      const feed = parsedData?.feed;
      if (!feed) {
        return [];
      }
      
      // Handle both single entry and multiple entries
      const entries = feed.entry;
      if (!entries) {
        return [];
      }
      
      // Ensure we always return an array
      return Array.isArray(entries) ? entries : [entries];
    } catch (error) {
      throw new ParseError(`Failed to extract entries from parsed XML: ${error}`);
    }
  }
  
  flattenXMLPaths(obj: any, prefix = '', result: Record<string, any> = {}): Record<string, any> {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}__${key}` : key;
        const value = obj[key];
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Recursively flatten nested objects
          this.flattenXMLPaths(value, newKey, result);
        } else {
          // Store the flattened path and value
          result[newKey] = value;
        }
      }
    }
    return result;
  }
  
  processXMLResponse(xmlData: string): any[] {
    const parsedData = this.parseXML(xmlData);
    const entries = this.extractEntries(parsedData);
    
    // Flatten each entry to match Python script structure
    return entries.map(entry => this.flattenXMLPaths(entry));
  }
}