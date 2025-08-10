/**
 * Criteria Reader
 * 
 * Simple utility for reading criteria data from Google Sheets
 */
import { CriteriaData, CriteriaConfig, ValidationResult } from '@/types';

// Build Google Sheets API URL
function buildSheetsUrl(spreadsheetId: string, sheetName: string): string {
  const encodedSheetName = encodeURIComponent(sheetName);
  return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheetName}`;
}

// Fetch data from Google Sheets
async function fetchSheetData(
  spreadsheetId: string, 
  sheetName: string, 
  accessToken: string
): Promise<{ headers: string[]; rows: string[][] }> {
  const url = buildSheetsUrl(spreadsheetId, sheetName);
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  
  console.log(`[CriteriaReader] Fetching: ${url}`);

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.values || data.values.length < 2) {
    throw new Error('Insufficient data in spreadsheet - need at least 2 rows (header in row 2)');
  }

  return {
    headers: data.values[1], // 第二行是表头
    rows: data.values.slice(2) // 第三行开始是数据
  };
}

// Field mapping based on actual Google Sheets structure
const FIELD_MAP = {
  category: ['response component'],
  criteria: ['criterion'],
  description: ['criterion description (i.e., what to look for)'],
  subcriteria: ['subcriteria'],
  subcriteriaDescription: ['subcriteria descriptions (i.e., what to look for)'],
  score: ['score'],
  scoreMeaning: ['score meaning'],
  example: ['brief concrete example(s) to illustrate what each score level actually means']
};

// Find field value from headers and row
function findFieldValue(headers: string[], row: string[], fieldNames: string[]): string {
  const headerLower = headers.map(h => h.toLowerCase().trim());
  for (const fieldName of fieldNames) {
    const searchName = fieldName.toLowerCase().trim();
    const index = headerLower.indexOf(searchName);
    if (index >= 0) {
      const value = row[index] || '';
      // Debug log for criteria field specifically
      if (fieldNames.includes('criterion')) {
        console.log(`[CriteriaReader] Looking for '${searchName}' in headers: [${headerLower.join(', ')}]`);
        console.log(`[CriteriaReader] Found at index ${index}, value: '${value}'`);
      }
      return value;
    }
  }
  
  // If not found, log for debugging
  if (fieldNames.includes('criterion')) {
    console.log(`[CriteriaReader] FAILED to find '${fieldNames.join(', ')}' in headers: [${headerLower.join(', ')}]`);
  }
  
  return '';
}

// 层级结构接口
export interface ScoreLevel {
  score: string;
  scoreMeaning: string;
  example: string;
}

export interface SubcriteriaItem {
  name: string;
  description: string;
  scoreLevels: ScoreLevel[];
}

export interface CriterionItem {
  name: string;
  description: string;
  subcriteria: SubcriteriaItem[];
}

export interface CategoryItem {
  name: string;
  criteria: CriterionItem[];
}

// 原始行数据接口（用于内部处理）
interface RawCriteriaItem {
  id: string;
  rowNumber: number;
  category: string;
  criterion: string;
  criterionDescription: string;
  subcriteria: string;
  subcriteriaDescription: string;
  score: string;
  scoreMeaning: string;
  example: string;
}

// 对外暴露的接口保持兼容
export interface NewCriteriaItem extends CategoryItem {}

// Convert sheet data to raw criteria format (internal function)
function convertToRawCriteria(headers: string[], rows: string[][]): RawCriteriaItem[] {
  console.log(`[CriteriaReader] Converting ${rows.length} rows to criteria`);
  console.log(`[CriteriaReader] Headers: [${headers.join(', ')}]`);
  
  const result = rows.map((row, index) => {
    // Create the raw data structure
    const criteriaItem: RawCriteriaItem = {
      id: `row-${index + 3}`, // 使用行号作为ID（从第3行开始）
      rowNumber: index + 3, // 添加实际行号
      category: findFieldValue(headers, row, FIELD_MAP.category),
      criterion: findFieldValue(headers, row, FIELD_MAP.criteria),
      criterionDescription: findFieldValue(headers, row, FIELD_MAP.description),
      subcriteria: findFieldValue(headers, row, FIELD_MAP.subcriteria),
      subcriteriaDescription: findFieldValue(headers, row, FIELD_MAP.subcriteriaDescription),
      score: findFieldValue(headers, row, FIELD_MAP.score),
      scoreMeaning: findFieldValue(headers, row, FIELD_MAP.scoreMeaning),
      example: findFieldValue(headers, row, FIELD_MAP.example)
    };

    if (index < 3) {
      console.log(`[CriteriaReader] Row ${index} converted to:`, criteriaItem);
    }

    return criteriaItem;
  }).filter(criteriaItem => {
    // 对于层级结构，保留所有有任何内容的行
    const hasValidCategory = criteriaItem.category?.trim() !== '';
    const hasValidCriterion = criteriaItem.criterion?.trim() !== '';
    const hasValidDescription = criteriaItem.criterionDescription?.trim() !== '';
    const hasValidSubcriteria = criteriaItem.subcriteria?.trim() !== '';
    const hasValidScore = criteriaItem.score?.trim() !== '';
    const hasValidScoreMeaning = criteriaItem.scoreMeaning?.trim() !== '';
    
    // 如果任何字段有内容就保留这一行
    const isValid = hasValidCategory || hasValidCriterion || hasValidDescription || 
                   hasValidSubcriteria || hasValidScore || hasValidScoreMeaning;
    
    if (!isValid) {
      console.log(`[CriteriaReader] Filtered out completely empty row ${criteriaItem.rowNumber}:`, criteriaItem);
    } else {
      console.log(`[CriteriaReader] Keeping row ${criteriaItem.rowNumber}:`, {
        category: criteriaItem.category || '[empty]',
        criterion: criteriaItem.criterion || '[empty]',
        subcriteria: criteriaItem.subcriteria || '[empty]',
        score: criteriaItem.score || '[empty]'
      });
    }
    
    return isValid;
  });
  
  console.log(`[CriteriaReader] After filtering: ${result.length} criteria remain`);
  return result;
}

// 将平面数据组织为层级结构
function organizeHierarchicalData(rawData: RawCriteriaItem[]): NewCriteriaItem[] {
  const categories = new Map<string, CategoryItem>();
  
  // 用于跟踪当前上下文的变量
  let currentCategory = '';
  let currentCriterion = '';
  let currentSubcriteria = '';
  
  // 遍历每一行数据
  rawData.forEach((item, index) => {
    console.log(`[CriteriaReader] Processing row ${item.rowNumber}:`, {
      category: item.category || '[empty]',
      criterion: item.criterion || '[empty]',
      subcriteria: item.subcriteria || '[empty]',
      score: item.score || '[empty]',
      scoreMeaning: item.scoreMeaning || '[empty]'
    });
    
    const categoryName = item.category?.trim();
    const criterionName = item.criterion?.trim();
    const subcriteriaName = item.subcriteria?.trim();
    const score = item.score?.trim();
    
    // 更新当前上下文
    if (categoryName) {
      currentCategory = categoryName;
    }
    if (criterionName) {
      currentCriterion = criterionName;
    }
    if (subcriteriaName) {
      currentSubcriteria = subcriteriaName;
    }
    
    // 如果有category信息，确保category存在
    if (currentCategory) {
      if (!categories.has(currentCategory)) {
        categories.set(currentCategory, {
          name: currentCategory,
          criteria: []
        });
        console.log(`[CriteriaReader] Created category: ${currentCategory}`);
      }
    }
    
    // 如果有criterion信息，确保criterion存在
    if (currentCriterion && currentCategory) {
      const category = categories.get(currentCategory)!;
      let criterion = category.criteria.find(c => c.name === currentCriterion);
      
      if (!criterion) {
        criterion = {
          name: currentCriterion,
          description: item.criterionDescription?.trim() || '',
          subcriteria: []
        };
        category.criteria.push(criterion);
        console.log(`[CriteriaReader] Created criterion: ${currentCriterion} in category: ${currentCategory}`);
      }
      
      // 更新description如果当前行有新的描述
      if (item.criterionDescription?.trim()) {
        criterion.description = item.criterionDescription.trim();
      }
    }
    
    // 如果有subcriteria信息，确保subcriteria存在
    if (currentSubcriteria && currentCriterion && currentCategory) {
      const category = categories.get(currentCategory)!;
      const criterion = category.criteria.find(c => c.name === currentCriterion)!;
      let subcriteria = criterion.subcriteria.find(s => s.name === currentSubcriteria);
      
      if (!subcriteria) {
        subcriteria = {
          name: currentSubcriteria,
          description: item.subcriteriaDescription?.trim() || '',
          scoreLevels: []
        };
        criterion.subcriteria.push(subcriteria);
        console.log(`[CriteriaReader] Created subcriteria: ${currentSubcriteria} in criterion: ${currentCriterion}`);
      }
      
      // 更新description如果当前行有新的描述
      if (item.subcriteriaDescription?.trim()) {
        subcriteria.description = item.subcriteriaDescription.trim();
      }
    }
    
    // 如果有score信息，添加到当前的subcriteria
    if (score && currentSubcriteria && currentCriterion && currentCategory) {
      const category = categories.get(currentCategory)!;
      const criterion = category.criteria.find(c => c.name === currentCriterion)!;
      const subcriteria = criterion.subcriteria.find(s => s.name === currentSubcriteria)!;
      
      // 检查是否已存在相同分数的ScoreLevel
      const existingScore = subcriteria.scoreLevels.find(sl => sl.score === score);
      if (!existingScore) {
        subcriteria.scoreLevels.push({
          score: score,
          scoreMeaning: item.scoreMeaning?.trim() || '',
          example: item.example?.trim() || ''
        });
        console.log(`[CriteriaReader] Added score ${score} to subcriteria: ${currentSubcriteria}`);
      }
    }
  });
  
  // 转换为数组并排序
  const result = Array.from(categories.values()).map(category => ({
    ...category,
    criteria: category.criteria.map(criterion => ({
      ...criterion,
      subcriteria: criterion.subcriteria.map(sub => ({
        ...sub,
        scoreLevels: sub.scoreLevels.sort((a, b) => parseInt(a.score) - parseInt(b.score))
      }))
    }))
  }));
  
  console.log(`[CriteriaReader] Organized data structure:`, JSON.stringify(result, null, 2));
  return result;
}

// Convert sheet data to hierarchical criteria format
function convertToCriteria(headers: string[], rows: string[][]): NewCriteriaItem[] {
  const rawData = convertToRawCriteria(headers, rows);
  const hierarchicalData = organizeHierarchicalData(rawData);
  console.log(`[CriteriaReader] Organized into ${hierarchicalData.length} categories`);
  return hierarchicalData;
}

// Validate hierarchical criteria data
export function validateCriteria(categories: NewCriteriaItem[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (categories.length === 0) {
    errors.push('No categories found');
    return { isValid: false, errors, warnings };
  }

  console.log(`[CriteriaReader] Validating ${categories.length} categories`);

  categories.forEach((category, categoryIndex) => {
    const categoryNumber = categoryIndex + 1;
    
    // Log the actual data we're validating
    console.log(`[CriteriaReader] Validating category ${categoryNumber}:`, {
      name: category.name,
      criteriaCount: category.criteria.length
    });
    
    // Validate category
    if (!category.name?.trim()) {
      warnings.push(`Category ${categoryNumber}: Empty category name`);
    }
    
    if (category.criteria.length === 0) {
      warnings.push(`Category ${categoryNumber} (${category.name}): No criteria found`);
    }
    
    // Validate each criterion
    category.criteria.forEach((criterion, criterionIndex) => {
      const criterionNumber = criterionIndex + 1;
      
      if (!criterion.name?.trim()) {
        warnings.push(`Category ${categoryNumber}, Criterion ${criterionNumber}: Empty criterion name`);
      }
      
      if (criterion.subcriteria.length === 0) {
        warnings.push(`Category ${categoryNumber}, Criterion ${criterionNumber} (${criterion.name}): No subcriteria found`);
      }
      
      // Validate each subcriteria
      criterion.subcriteria.forEach((subcriteria, subIndex) => {
        const subNumber = subIndex + 1;
        
        if (!subcriteria.name?.trim()) {
          warnings.push(`Category ${categoryNumber}, Criterion ${criterionNumber}, Subcriteria ${subNumber}: Empty subcriteria name`);
        }
        
        if (subcriteria.scoreLevels.length === 0) {
          warnings.push(`Category ${categoryNumber}, Criterion ${criterionNumber}, Subcriteria ${subNumber} (${subcriteria.name}): No score levels found`);
        }
        
        // Validate score levels
        subcriteria.scoreLevels.forEach((scoreLevel, scoreIndex) => {
          if (!scoreLevel.score?.trim()) {
            warnings.push(`Category ${categoryNumber}, Criterion ${criterionNumber}, Subcriteria ${subNumber}, Score ${scoreIndex + 1}: Empty score`);
          }
          if (!scoreLevel.scoreMeaning?.trim()) {
            warnings.push(`Category ${categoryNumber}, Criterion ${criterionNumber}, Subcriteria ${subNumber}, Score ${scoreLevel.score}: Empty score meaning`);
          }
        });
      });
    });
  });

  // For debugging, let's accept data even with warnings
  return {
    isValid: true,
    errors,
    warnings
  };
}

// Main function to load criteria
export async function loadCriteria(
  criteriaConfigs: CriteriaConfig[], 
  criteriaId: string, 
  accessToken: string
): Promise<NewCriteriaItem[]> {
  const config = criteriaConfigs.find(c => c.id === criteriaId);
  if (!config) {
    throw new Error(`Criteria config not found: ${criteriaId}`);
  }

  console.log(`[CriteriaReader] Loading criteria for: ${criteriaId}`);
  console.log(`[CriteriaReader] Spreadsheet: ${config.spreadsheetId}, Sheet: ${config.sheetName}`);

  try {
    const { headers, rows } = await fetchSheetData(
      config.spreadsheetId,
      config.sheetName,
      accessToken
    );

    console.log(`[CriteriaReader] Raw headers:`, headers);
    console.log(`[CriteriaReader] Total rows found:`, rows.length);
    console.log(`[CriteriaReader] First few rows:`, rows.slice(0, 3));

    const criteria = convertToCriteria(headers, rows);
    console.log(`[CriteriaReader] Loaded ${criteria.length} criteria`);
    
    if (criteria.length === 0) {
      console.log(`[CriteriaReader] No criteria found. Headers were:`, headers);
      console.log(`[CriteriaReader] Sample row data:`, rows[0]);
    }
    
    return criteria;
  } catch (error) {
    console.error(`[CriteriaReader] Error loading criteria:`, error);
    throw new Error(`Failed to load criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Load criteria automatically (for when no specific criteria ID is provided)
export async function loadCriteriaAuto(
  criteriaConfigs: CriteriaConfig[], 
  accessToken: string
): Promise<NewCriteriaItem[]> {
  if (criteriaConfigs.length === 0) {
    console.log('[CriteriaReader] No criteria configs found');
    return [];
  }

  // Use the first available criteria config
  const config = criteriaConfigs[0];
  console.log(`[CriteriaReader] Auto-loading criteria using: ${config.id}`);
  
  return loadCriteria(criteriaConfigs, config.id, accessToken);
}

// Get criteria configuration
export function getCriteriaConfig(criteriaConfigs: CriteriaConfig[], criteriaId: string): CriteriaConfig | undefined {
  return criteriaConfigs.find(config => config.id === criteriaId);
}

// Get all criteria configs
export function getAllCriteriaConfigs(criteriaConfigs: CriteriaConfig[]): CriteriaConfig[] {
  return criteriaConfigs;
}

// Get raw criteria data for debugging
export async function getRawCriteriaData(
  criteriaConfigs: CriteriaConfig[], 
  criteriaId: string, 
  accessToken: string
): Promise<{ headers: string[]; rows: string[][] }> {
  const config = criteriaConfigs.find(c => c.id === criteriaId);
  if (!config) {
    throw new Error(`Criteria config not found: ${criteriaId}`);
  }

  return fetchSheetData(config.spreadsheetId, config.sheetName, accessToken);
}