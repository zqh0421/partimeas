"use client";

import { useState } from "react";
import { RubricVersion } from "@/types/rubric";
import { getCaseData } from "@/data/caseData";
import { 
  TabNavigation, 
  CaseHeader, 
  TestCaseManager 
} from "./common";
import { parseInputContent, combineInputContent } from "./common/utils";

interface CaseTabProps {
  currentVersion: RubricVersion;
  setCurrentVersion: (version: RubricVersion | ((prev: RubricVersion) => RubricVersion)) => void;
}

export default function CaseTab({
  currentVersion,
  setCurrentVersion,
}: CaseTabProps) {
  const [activeTab, setActiveTab] = useState<'case1' | 'case2'>('case1');
  const [case1SubTab, setCase1SubTab] = useState<'concerning' | 'strengths'>('concerning');

  const handleAddTestCase = (useCaseId: string) => {
    const newTestCase = {
      id: `test-${useCaseId}-${Date.now()}`,
      input: '',
      expectedOutput: '',
      useCaseId: useCaseId
    };
    const updatedUseCases = [...(currentVersion.useCases || [])];
    const useCaseIndex = updatedUseCases.findIndex(uc => uc.id === useCaseId);
    if (useCaseIndex !== -1) {
      updatedUseCases[useCaseIndex] = {
        ...updatedUseCases[useCaseIndex],
        testCases: [...updatedUseCases[useCaseIndex].testCases, newTestCase]
      };
      setCurrentVersion((prev) => ({
        ...prev,
        useCases: updatedUseCases,
      }));
    }
  };

  const handleDeleteTestCase = (useCaseId: string, testIndex: number) => {
    const updatedUseCases = [...(currentVersion.useCases || [])];
    const useCaseIndex = updatedUseCases.findIndex(uc => uc.id === useCaseId);
    if (useCaseIndex !== -1) {
      updatedUseCases[useCaseIndex] = {
        ...updatedUseCases[useCaseIndex],
        testCases: updatedUseCases[useCaseIndex].testCases.filter((_, i) => i !== testIndex)
      };
      setCurrentVersion((prev) => ({
        ...prev,
        useCases: updatedUseCases,
      }));
    }
  };

  const handleUpdateTestCase = (useCaseId: string, testCaseId: string, field: 'input' | 'context', value: string) => {
    const updatedUseCases = [...(currentVersion.useCases || [])];
    const useCaseIndex = updatedUseCases.findIndex(uc => uc.id === useCaseId);
    if (useCaseIndex !== -1) {
      const testCaseIndex = updatedUseCases[useCaseIndex].testCases.findIndex(tc => tc.id === testCaseId);
      if (testCaseIndex !== -1) {
        updatedUseCases[useCaseIndex].testCases[testCaseIndex] = {
          ...updatedUseCases[useCaseIndex].testCases[testCaseIndex],
          [field]: value
        };
        setCurrentVersion((prev) => ({
          ...prev,
          useCases: updatedUseCases,
        }));
      }
    }
  };

  const renderCase1Content = () => {
    const caseData = getCaseData('case1');
    const useCase = (currentVersion.useCases || []).find(uc => uc.id === caseData.useCaseId);
    
    // Split test cases into concerning behaviors (first 5) and strengths (last 4)
    const concerningBehaviors = useCase?.testCases.slice(0, 5) || [];
    const teacherStrengths = useCase?.testCases.slice(5, 9) || [];

    const subTabs = [
      { id: 'concerning', label: 'Concerning Behaviors', color: 'red' as const },
      { id: 'strengths', label: 'Teacher Strengths', color: 'green' as const }
    ];

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <CaseHeader
            name={caseData.name}
            testCasesCount={caseData.testCasesCount}
            description={caseData.description}
          />
          
          {/* Sub-tab Navigation for Case 1 */}
          <TabNavigation
            tabs={subTabs}
            activeTab={case1SubTab}
            onTabChange={(tabId) => setCase1SubTab(tabId as 'concerning' | 'strengths')}
            className="mb-4"
          />
          
          {/* Test Cases Management */}
          <TestCaseManager
            testCases={case1SubTab === 'concerning' ? concerningBehaviors : teacherStrengths}
            title={case1SubTab === 'concerning' ? 'Concerning Behavior' : 'Teacher Strength'}
            onAddTestCase={() => handleAddTestCase(caseData.useCaseId)}
            onDeleteTestCase={(testIndex) => {
              const actualIndex = case1SubTab === 'concerning' ? testIndex : testIndex + 5;
              handleDeleteTestCase(caseData.useCaseId, actualIndex);
            }}
            onUpdateTestCase={(testCaseId, field, value) => 
              handleUpdateTestCase(caseData.useCaseId, testCaseId, field, value)
            }
            parseInput={parseInputContent}
            combineInput={combineInputContent}
            showUseContext={true}
          />
        </div>
      </div>
    );
  };

  const renderCase2Content = () => {
    const caseData = getCaseData('case2');
    const useCase = (currentVersion.useCases || []).find(uc => uc.id === caseData.useCaseId);

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <CaseHeader
            name={caseData.name}
            testCasesCount={caseData.testCasesCount}
            description={caseData.description}
          />
          
          {/* Test Cases Management */}
          <TestCaseManager
            testCases={useCase?.testCases || []}
            title="Test Case"
            onAddTestCase={() => handleAddTestCase(caseData.useCaseId)}
            onDeleteTestCase={(testIndex) => handleDeleteTestCase(caseData.useCaseId, testIndex)}
            onUpdateTestCase={(testCaseId, field, value) => 
              handleUpdateTestCase(caseData.useCaseId, testCaseId, field, value)
            }
          />
        </div>
      </div>
    );
  };

  const mainTabs = [
    { id: 'case1', label: 'Case 1', color: 'blue' as const },
    { id: 'case2', label: 'Case 2', color: 'blue' as const }
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-3">
        Select to activate a use case for evaluation.
      </div>
      
      {/* Tab Navigation */}
      <TabNavigation
        tabs={mainTabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'case1' | 'case2')}
      />
      
      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'case1' && renderCase1Content()}
        {activeTab === 'case2' && renderCase2Content()}
      </div>
    </div>
  );
} 