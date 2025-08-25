/**
 * Criteria Reader
 *
 * Simple utility for reading criteria data from Google Sheets
 */
import { CriteriaData, CriteriaConfig, ValidationResult } from "@/app/types";

// Build Google Sheets API URL
function buildSheetsUrl(spreadsheetId: string, sheetName: string): string {
  const encodedSheetName = encodeURIComponent(sheetName);
  return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheetName}`;
}

// Build Google Sheets API URL for getting spreadsheet metadata
function buildSpreadsheetUrl(spreadsheetId: string): string {
  return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
}

// Get all sheet names from a spreadsheet
async function getSheetNames(
  spreadsheetId: string,
  accessToken: string
): Promise<string[]> {
  const url = buildSpreadsheetUrl(spreadsheetId);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Sheets API error: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();

  if (!data.sheets || data.sheets.length === 0) {
    throw new Error("No sheets found in spreadsheet");
  }

  return data.sheets.map((sheet: any) => sheet.properties.title);
}

// Fetch data from Google Sheets with new format
async function fetchSheetData(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<{
  criterionName: string;
  criterionDescription: string;
  headers: string[];
  rows: string[][];
} | null> {
  const url = buildSheetsUrl(spreadsheetId, sheetName);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Sheets API error: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();

  if (!data.values || data.values.length < 4) {
    console.warn(
      `[CriteriaReader] Skipping sheet - insufficient data (need at least 4 rows): ${
        data.values?.length || 0
      } rows found`
    );
    return null;
  }

  // Extract criterion name from A1 (format: "Criterion: [name]")
  const criterionCell =
    data.values[0] && data.values[0][0] ? data.values[0][0] : "";
  const criterionName = criterionCell.replace(/^Criterion:\s*/i, "").trim();

  // Extract description from A2 (format: "Description: [description]")
  const descriptionCell =
    data.values[1] && data.values[1][0] ? data.values[1][0] : "";
  const criterionDescription = descriptionCell
    .replace(/^Description:\s*/i, "")
    .trim();

  return {
    criterionName,
    criterionDescription,
    headers: data.values[2], // A3-E3: table headers
    rows: data.values.slice(3), // A4+ onwards: data rows
  };
}

// Field mapping based on new Google Sheets structure
// A3-E3: Category (if needed) | Requirement | # Points to Award | Positive Examples | Negative Examples
const FIELD_MAP = {
  category: ["category (if needed)", "category"],
  requirement: ["requirement"],
  points: ["# points to award", "points to award", "points"],
  positiveExamples: ["positive examples"],
  negativeExamples: ["negative examples"],
};

// List of sheet names to ignore when reading criteria
export const IGNORED_SHEET_NAMES = [
  "Rubric Info Card",
  "Rubric",
  "Copy of Sample Criterion",
];

// Find field value from headers and row
function findFieldValue(
  headers: string[],
  row: string[],
  fieldNames: string[]
): string {
  const headerLower = headers.map((h) => h.toLowerCase().trim());
  for (const fieldName of fieldNames) {
    const searchName = fieldName.toLowerCase().trim();
    const index = headerLower.indexOf(searchName);
    if (index >= 0) {
      const value = row[index] || "";
      return value;
    }
  }

  return "";
}

// New criteria structure interfaces
export interface CriteriaRequirement {
  category?: string;
  requirement: string;
  points: string;
  positiveExamples: string;
  negativeExamples: string;
}

export interface CriterionVersion {
  sheetName: string;
  criterionName: string;
  criterionDescription: string;
  requirements: CriteriaRequirement[];
}

// Raw row data interface for internal processing
interface RawRequirementItem {
  id: string;
  rowNumber: number;
  category?: string;
  requirement: string;
  points: string;
  positiveExamples: string;
  negativeExamples: string;
}

// Export the new criteria item type
export interface NewCriteriaItem extends CriterionVersion {}

// Convert sheet data to raw requirements format (internal function)
function convertToRawRequirements(
  headers: string[],
  rows: string[][]
): RawRequirementItem[] {
  const result = rows
    .map((row, index) => {
      // Create the raw data structure
      const requirementItem: RawRequirementItem = {
        id: `row-${index + 4}`, // Row numbering starts from A4 (index 0 = row 4)
        rowNumber: index + 4,
        category: findFieldValue(headers, row, FIELD_MAP.category),
        requirement: findFieldValue(headers, row, FIELD_MAP.requirement),
        points: findFieldValue(headers, row, FIELD_MAP.points),
        positiveExamples: findFieldValue(
          headers,
          row,
          FIELD_MAP.positiveExamples
        ),
        negativeExamples: findFieldValue(
          headers,
          row,
          FIELD_MAP.negativeExamples
        ),
      };

      return requirementItem;
    })
    .filter((requirementItem) => {
      // Keep rows that have both requirement and points (as per requirement)
      const hasValidRequirement = requirementItem.requirement?.trim() !== "";
      const hasValidPoints = requirementItem.points?.trim() !== "";
      return hasValidRequirement && hasValidPoints;
    });

  return result;
}

// Convert raw requirements data to structured format
function organizeRequirementsData(
  rawData: RawRequirementItem[],
  criterionName: string,
  criterionDescription: string,
  sheetName: string
): CriterionVersion {
  const requirements: CriteriaRequirement[] = rawData.map((item) => ({
    category: item.category?.trim() || undefined,
    requirement: item.requirement?.trim() || "",
    points: item.points?.trim() || "",
    positiveExamples: item.positiveExamples?.trim() || "",
    negativeExamples: item.negativeExamples?.trim() || "",
  }));

  return {
    sheetName,
    criterionName,
    criterionDescription,
    requirements,
  };
}

// Convert sheet data to criteria format
function convertToCriteria(
  headers: string[],
  rows: string[][],
  criterionName: string,
  criterionDescription: string,
  sheetName: string
): CriterionVersion {
  const rawData = convertToRawRequirements(headers, rows);
  const criterionVersion = organizeRequirementsData(
    rawData,
    criterionName,
    criterionDescription,
    sheetName
  );
  return criterionVersion;
}

// Validate criteria data
export function validateCriteria(
  criterionVersions: NewCriteriaItem[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (criterionVersions.length === 0) {
    errors.push("No criterion versions found");
    return { isValid: false, errors, warnings };
  }

  criterionVersions.forEach((version, versionIndex) => {
    const versionNumber = versionIndex + 1;

    // Validate version
    if (!version.criterionName?.trim()) {
      warnings.push(
        `Version ${versionNumber} (${version.sheetName}): Empty criterion name`
      );
    }

    if (!version.criterionDescription?.trim()) {
      warnings.push(
        `Version ${versionNumber} (${version.sheetName}): Empty criterion description`
      );
    }

    if (version.requirements.length === 0) {
      warnings.push(
        `Version ${versionNumber} (${version.sheetName}): No requirements found`
      );
    }

    // Validate each requirement
    version.requirements.forEach((requirement, reqIndex) => {
      const reqNumber = reqIndex + 1;

      if (!requirement.requirement?.trim()) {
        warnings.push(
          `Version ${versionNumber}, Requirement ${reqNumber}: Empty requirement`
        );
      }

      if (!requirement.points?.trim()) {
        warnings.push(
          `Version ${versionNumber}, Requirement ${reqNumber}: Empty points`
        );
      }
    });
  });

  // Accept data even with warnings for debugging
  return {
    isValid: true,
    errors,
    warnings,
  };
}

// Main function to load criteria - now loads all sheets dynamically
export async function loadCriteria(
  criteriaConfigs: CriteriaConfig[],
  criteriaId: string,
  accessToken: string,
  additionalIgnoredSheets?: string[]
): Promise<NewCriteriaItem[]> {
  const config = criteriaConfigs.find((c) => c.id === criteriaId);
  if (!config) {
    throw new Error(`Criteria config not found: ${criteriaId}`);
  }

  try {
    // Get all sheet names from the spreadsheet
    const allSheetNames = await getSheetNames(
      config.spreadsheetId,
      accessToken
    );

    // Combine default ignored sheets with additional ones
    const ignoredSheets = [
      ...IGNORED_SHEET_NAMES,
      ...(additionalIgnoredSheets || []),
    ];

    // Filter out ignored sheet names (case-insensitive)
    const sheetNames = allSheetNames.filter((sheetName) => {
      return !shouldIgnoreSheet(sheetName, additionalIgnoredSheets);
    });

    console.log(
      `[CriteriaReader] Found ${
        allSheetNames.length
      } total sheets, processing ${sheetNames.length} sheets (ignoring: ${
        allSheetNames.length - sheetNames.length
      })`
    );

    const allCriterionVersions: NewCriteriaItem[] = [];

    // Load data from each sheet
    for (const sheetName of sheetNames) {
      try {
        const sheetData = await fetchSheetData(
          config.spreadsheetId,
          sheetName,
          accessToken
        );

        // Skip if sheet has insufficient data
        if (sheetData === null) {
          console.log(
            `[CriteriaReader] Skipped sheet "${sheetName}" due to insufficient data`
          );
          continue;
        }

        const { criterionName, criterionDescription, headers, rows } =
          sheetData;
        const criterionVersion = convertToCriteria(
          headers,
          rows,
          criterionName,
          criterionDescription,
          sheetName
        );
        allCriterionVersions.push(criterionVersion);
      } catch (error) {
        console.warn(
          `[CriteriaReader] Warning: Failed to load sheet "${sheetName}":`,
          error
        );
        // Continue with other sheets even if one fails
      }
    }

    return allCriterionVersions;
  } catch (error) {
    console.error(`[CriteriaReader] Error loading criteria:`, error);
    throw new Error(
      `Failed to load criteria: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Load criteria automatically (for when no specific criteria ID is provided)
export async function loadCriteriaAuto(
  criteriaConfigs: CriteriaConfig[],
  accessToken: string
): Promise<NewCriteriaItem[]> {
  if (criteriaConfigs.length === 0) {
    return [];
  }

  // Use the first available criteria config
  const config = criteriaConfigs[0];

  return loadCriteria(criteriaConfigs, config.id, accessToken);
}

// Get criteria configuration
export function getCriteriaConfig(
  criteriaConfigs: CriteriaConfig[],
  criteriaId: string
): CriteriaConfig | undefined {
  return criteriaConfigs.find((config) => config.id === criteriaId);
}

// Get all criteria configs
export function getAllCriteriaConfigs(
  criteriaConfigs: CriteriaConfig[]
): CriteriaConfig[] {
  return criteriaConfigs;
}

// Get raw criteria data for debugging
export async function getRawCriteriaData(
  criteriaConfigs: CriteriaConfig[],
  criteriaId: string,
  accessToken: string,
  sheetName?: string
): Promise<{
  criterionName: string;
  criterionDescription: string;
  headers: string[];
  rows: string[][];
}> {
  const config = criteriaConfigs.find((c) => c.id === criteriaId);
  if (!config) {
    throw new Error(`Criteria config not found: ${criteriaId}`);
  }

  if (sheetName) {
    const result = await fetchSheetData(
      config.spreadsheetId,
      sheetName,
      accessToken
    );
    if (result === null) {
      throw new Error(`Sheet "${sheetName}" has insufficient data`);
    }
    return result;
  }

  // If no sheet name provided, get the first sheet
  const sheetNames = await getSheetNames(config.spreadsheetId, accessToken);
  if (sheetNames.length === 0) {
    throw new Error("No sheets found in spreadsheet");
  }

  const result = await fetchSheetData(
    config.spreadsheetId,
    sheetNames[0],
    accessToken
  );
  if (result === null) {
    throw new Error(`First sheet "${sheetNames[0]}" has insufficient data`);
  }
  return result;
}

// Utility functions for managing ignored sheets
export function getIgnoredSheetNames(): string[] {
  return [...IGNORED_SHEET_NAMES];
}

export function shouldIgnoreSheet(
  sheetName: string,
  additionalIgnoredSheets?: string[]
): boolean {
  const ignoredSheets = [
    ...IGNORED_SHEET_NAMES,
    ...(additionalIgnoredSheets || []),
  ];
  return ignoredSheets.some((ignored) =>
    sheetName.toLowerCase().includes(ignored.toLowerCase())
  );
}
