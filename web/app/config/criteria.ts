import { CriteriaConfig } from "@/app/types";

/**
 * Criteria Configuration
 *
 * This file contains the configuration for all criteria sources in the system.
 * Each criteria config defines a spreadsheet ID, sheet name, and other metadata
 * needed to load criteria data.
 */

export const CRITERIA_CONFIGS: CriteriaConfig[] = [
  {
    id: "rubric_criteria",
    name: "Dynamic Criteria from Spreadsheet",
    description:
      "Criteria loaded dynamically from all sheets in the spreadsheet",
    spreadsheetId: "1oUpPQLXfGQr8dlLNWiCiYXAlk-bny5EFV6MtaUkQxVE",
    sheetName: "", // Will be populated dynamically
    category: "evaluation",
  },
];

/**
 * Default criteria configuration
 * Used when no specific criteria is selected
 */
export const DEFAULT_CRITERIA: CriteriaConfig = CRITERIA_CONFIGS[0];
