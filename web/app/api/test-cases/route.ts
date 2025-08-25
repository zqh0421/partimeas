import { NextRequest, NextResponse } from "next/server";
import { TEST_CASE_CONFIG } from "@/app/config/useCases";
import { getGoogleAccessToken } from "@/app/utils/googleAuth";

const FIELD_MAP = {
  input: ["Prompt"],
  context: ["Test Case Name/Group"],
  category: ["Category"],
};

function findFieldValue(
  headers: string[],
  row: string[],
  fieldNames: string[]
): string {
  const headerLower = headers.map((h) => h.toLowerCase().trim());

  for (const fieldName of fieldNames) {
    const index = headerLower.indexOf(fieldName.toLowerCase().trim());
    if (index >= 0) {
      const value = row[index] || "";
      return value;
    }
  }

  return "";
}

async function fetchSheetData(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<{ headers: string[]; rows: string[][]; title: string }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  console.log(`[test-cases] Fetching from URL: ${url}`);

  const response = await fetch(url, { headers });

  console.log(
    `[test-cases] Google Sheets API response received. Status: ${response.status}, OK: ${response.ok}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[test-cases] Google Sheets API error response:`, errorText);
    throw new Error(
      `Google Sheets API error: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();

  console.log(
    `[test-cases] Google Sheets API returned ${data.values.length} total rows`
  );
  console.log(`[test-cases] Headers: ${data.values[0].join(", ")}`);
  console.log(`[test-cases] Data rows: ${data.values.length - 1}`);

  return {
    title: "Test Cases", // No separate title row in this format
    headers: data.values[0], // First row (index 0) contains the column headers
    rows: data.values.slice(1), // Second row (index 1) onwards contains the data
  };
}

// Convert sheet data to test cases
function convertToTestCases(headers: string[], rows: string[][]): any[] {
  const testCases: any[] = [];
  let skippedCount = 0;

  rows.forEach((row, index) => {
    const input = findFieldValue(headers, row, FIELD_MAP.input);
    if (!input || !input.trim()) {
      console.log(
        `[test-cases] Row ${
          index + 1
        } - Skipping row with empty prompt. Input field value: "${input}"`
      );
      skippedCount++;
      return;
    }

    const testCase: any = {
      id: `tc-${testCases.length + 1}`,
      input: input.trim(),
      context: "",
      category: "",
      useCaseId: TEST_CASE_CONFIG.name.toLowerCase().replace(/\s+/g, "-"),
      useCaseTitle: TEST_CASE_CONFIG.name,
      useCaseDescription: TEST_CASE_CONFIG.description,
    };

    const context = findFieldValue(headers, row, FIELD_MAP.context);
    if (context) {
      testCase.context = context;
      testCase.scenarioCategory = context; // For backward compatibility
    }

    const category = findFieldValue(headers, row, FIELD_MAP.category);
    if (category) {
      testCase.category = category;
      testCase.scenarioCategory = category; // Use category as the main grouping
    }

    testCases.push(testCase);
  });

  console.log(
    `[test-cases] Conversion completed: ${testCases.length} valid test cases, ${skippedCount} rows skipped`
  );
  return testCases;
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) {
      throw new Error("Failed to obtain Google access token");
    }

    const { headers, rows } = await fetchSheetData(
      TEST_CASE_CONFIG.spreadsheetId,
      TEST_CASE_CONFIG.sheetName,
      accessToken
    );

    const testCases = convertToTestCases(headers, rows);

    console.log(
      `[test-cases] Loaded ${testCases.length} test cases from spreadsheet`
    );

    // Create the use case from TEST_CASE_CONFIG
    const useCase = {
      id: TEST_CASE_CONFIG.name.toLowerCase().replace(/\s+/g, "-"),
      title: TEST_CASE_CONFIG.name,
      description: TEST_CASE_CONFIG.description,
      index: "1",
    };

    const responseData = {
      success: true,
      useCases: [useCase], // Single use case from config
      testCases: testCases,
      totalUseCases: 1,
      totalTestCases: testCases.length,
    };

    console.log("[test-cases] Request completed successfully");
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[test-cases] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to load test case data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
