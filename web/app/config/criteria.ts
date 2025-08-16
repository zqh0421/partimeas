import { CriteriaConfig } from '@/app/types';

/**
 * Criteria Configuration
 * 
 * This file contains the configuration for all criteria sources in the system.
 * Each criteria config defines a spreadsheet ID, sheet name, and other metadata
 * needed to load criteria data.
 */

export const CRITERIA_CONFIGS: CriteriaConfig[] = [
  {
    id: 'rubric_criteria',
    name: 'Assessment Rubric Criteria',
    description: 'Main assessment criteria and scoring rubric from Google Sheets',
    spreadsheetId: '1oUpPQLXfGQr8dlLNWiCiYXAlk-bny5EFV6MtaUkQxVE',
    sheetName: 'Rubric',
    category: 'evaluation'
  }
];

/**
 * Default criteria configuration
 * Used when no specific criteria is selected
 */
export const DEFAULT_CRITERIA: CriteriaConfig = CRITERIA_CONFIGS[0];

/**
 * Get criteria config by ID
 */
export const getCriteriaById = (id: string): CriteriaConfig | undefined => {
  return CRITERIA_CONFIGS.find(criteria => criteria.id === id);
};

/**
 * Get all criteria by category
 */
export const getCriteriaByCategory = (category: string): CriteriaConfig[] => {
  return CRITERIA_CONFIGS.filter(criteria => criteria.category === category);
};

/**
 * Validate criteria configuration
 */
export const validateCriteriaConfig = (config: CriteriaConfig): boolean => {
  return !!(
    config.id &&
    config.name &&
    config.spreadsheetId &&
    config.sheetName &&
    config.spreadsheetId !== '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' // Check if it's not the placeholder
  );
};

/**
 * Check if all criteria configurations are valid
 */
export const areCriteriaConfigsValid = (): boolean => {
  return CRITERIA_CONFIGS.every(validateCriteriaConfig);
};