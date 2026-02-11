import { NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/utils/googleAuth";
import { IdealModelResponse } from "@/types";

// Configuration for the ideal responses spreadsheet
const IDEAL_RESPONSES_CONFIG = {
  spreadsheetId: "1GAKpJzbIWEIi2RxwrKcJVe0fLj2glpuDu1rDC_UkSAs",
  sheetName: "test cases",
};

const FIELD_MAP = {
  name: ["Test Case Name/Group"], // A1
  modelResponse: ["Ideal Response"], // B1
  testCaseInput: ["Prompt"], // C1 (required)
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

  console.log(`[ideal-responses] Fetching from URL: ${url}`);

  const response = await fetch(url, { headers });

  console.log(
    `[ideal-responses] Google Sheets API response received. Status: ${response.status}, OK: ${response.ok}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[ideal-responses] Google Sheets API error response:`,
      errorText
    );
    throw new Error(
      `Google Sheets API error: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();

  console.log(
    `[ideal-responses] Google Sheets API returned ${
      data.values?.length || 0
    } total rows`
  );
  if (data.values && data.values.length > 0) {
    console.log(`[ideal-responses] Headers: ${data.values[0].join(", ")}`);
    // console.log(`[ideal-responses] Data rows: ${data.values.length - 1}`);
  }

  return {
    title: "Ideal Model Responses",
    headers: data.values?.[0] || [], // First row contains the column headers
    rows: data.values?.slice(1) || [], // Second row onwards contains the data
  };
}

// Convert sheet data to ideal model responses
function convertToIdealResponses(
  headers: string[],
  rows: string[][]
): IdealModelResponse[] {
  const idealResponses: IdealModelResponse[] = [];
  let skippedCount = 0;

  rows.forEach((row, index) => {
    const name = findFieldValue(headers, row, FIELD_MAP.name);
    if (!name || !name.trim()) {
      // console.log(
      //   `[ideal-responses] Row ${
      //     index + 1
      //   } - Skipping row with empty name. Name field value: "${name}"`
      // );
      skippedCount++;
      return;
    }

    const modelResponse = findFieldValue(headers, row, FIELD_MAP.modelResponse);
    if (!modelResponse || !modelResponse.trim()) {
      // console.log(
      //   `[ideal-responses] Row ${
      //     index + 1
      //   } - Skipping row with empty model response. Name: "${name}"`
      // );
      skippedCount++;
      return;
    }

    const testCaseInput = findFieldValue(headers, row, FIELD_MAP.testCaseInput);
    if (!testCaseInput || !testCaseInput.trim()) {
      // console.log(
      //   `[ideal-responses] Row ${
      //     index + 1
      //   } - Skipping row with empty test case input. Name: "${name}"`
      // );
      skippedCount++;
      return;
    }

    const idealResponse: IdealModelResponse = {
      id: name.trim(), // Use name as primary key/ID as requested
      name: name.trim(),
      modelResponse: modelResponse.trim(),
      testCaseInput: testCaseInput.trim(), // Always include test case input
    };

    idealResponses.push(idealResponse);
  });

  console.log(
    `[ideal-responses] Conversion completed: ${idealResponses.length} valid ideal responses, ${skippedCount} rows skipped`
  );
  return idealResponses;
}

export async function GET() {
  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) {
      throw new Error("Failed to obtain Google access token");
    }

    const { headers, rows } = await fetchSheetData(
      IDEAL_RESPONSES_CONFIG.spreadsheetId,
      IDEAL_RESPONSES_CONFIG.sheetName,
      accessToken
    );

    const idealResponses = convertToIdealResponses(headers, rows);

    console.log(
      `[ideal-responses] Loaded ${idealResponses.length} ideal responses from spreadsheet`
    );

    const responseData = {
      success: true,
      idealResponses: idealResponses,
      totalIdealResponses: idealResponses.length,
    };

    // console.log("[ideal-responses] Request completed successfully");
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[ideal-responses] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to load ideal response data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
