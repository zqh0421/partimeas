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
// A3-E3: Name | ACTUAL PROMPT | # Points to Award | Weight of Points
const FIELD_MAP = {
  num: ["Num", "num"],
  category: ["Name", "name"],
  requirement: ["ACTUAL PROMPT"],
  points: ["# Points to Award", "points to award"],
  weight: ["Weight of Points", "weight of points"],
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
  num: number;
  category: string;
  requirement: string;
  points: string;
  weight?: string;
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
  num: number;
  category: string;
  requirement: string;
  points: string;
  weight?: string;
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
        num: Number(findFieldValue(headers, row, FIELD_MAP.num).trim()),
        category: findFieldValue(headers, row, FIELD_MAP.category),
        requirement: findFieldValue(headers, row, FIELD_MAP.requirement),
        points: findFieldValue(headers, row, FIELD_MAP.points),
        weight: findFieldValue(headers, row, FIELD_MAP.weight),
      };

      return requirementItem;
    })
    .filter((requirementItem) => {
      // Only keep rows where Num field is not empty and is a valid number
      const hasValidNum =
        !isNaN(requirementItem.num) && requirementItem.num > 0;

      // Also check that requirement and points are valid
      const hasValidRequirement = requirementItem.requirement?.trim() !== "";
      const hasValidPoints = requirementItem.points?.trim() !== "";

      // Only include rows that have valid Num, requirement, and points
      return hasValidNum && hasValidRequirement && hasValidPoints;
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
    num: item.num,
    category: item.category.trim() || "",
    requirement: item.requirement.trim() || "",
    points: item.points?.trim() || "",
    weight: item.weight?.trim() || "",
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

    // Filter out ignored sheet names (case-insensitive)
    const sheetNames = allSheetNames.filter((sheetName) => {
      return !shouldIgnoreSheet(sheetName, additionalIgnoredSheets);
    });

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
