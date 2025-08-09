export interface HistoryEntry {
  id: string;
  timestamp: Date;
  modifier: string;
  action: 'created' | 'modified' | 'merged' | 'star' | 'unstared';
  field?: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  version?: string;
  changeType?: 'criteria_name' | 'criteria_description' | 'add_criteria' | 'delete_criteria' | 'change_category' | 'add_category' | 'merge_versions';
  parentId?: string; // 前继节点的ID，用于构建分支结构
  summary?: string; // AI生成的版本摘要
  differenceSummary?: string; // 客观的变化描述
}

export interface RubricItem {
  id: string;
  criteria: string;
  description: string;
  category: string;
}

export interface TestCase {
  id: string;
  input: string;
  context: string;
  useCaseId?: string; // 关联到特定的用例
}

export interface UseCase {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[]; // 改为TestCases数组而不是字符串
}

export interface RubricVersion {
  id: string;
  version: string;
  name: string;
  systemPrompt: string;
  evaluationPrompt: string;
  rubricItems: RubricItem[];
  testCases: TestCase[];
  useCases?: UseCase[];
  createdAt: Date;
  history: HistoryEntry[];
}

export interface VersionData {
  versionId: string;
  version: string;
  timestamp: Date;
  modifier: string;
  action: string;
  field?: string;
  comment?: string;
}