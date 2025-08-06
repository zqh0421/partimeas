export interface CaseData {
  useCaseId: string;
  name: string;
  description: string;
  testCasesCount: number;
}

export const caseData: Record<string, CaseData> = {
  case1: {
    useCaseId: 'usecase-5',
    name: 'Providing reflective questions for teacher meetings',
    description: 'For use case: Providing reflective questions (and explanations for why those questions may be helpful) that the worker could use to facilitate discussion in a future teacher meeting …. including questions that help reflect on the teacher\'s strengths and concerning behaviors. The goal here is to help the S123 worker work with the teacher to help the teacher reflect on their strengths and any concerning behaviors, so that they could collaboratively work together to understand how the teacher could best bring out their strengths.',
    testCasesCount: 9
  },
  case2: {
    useCaseId: 'usecase-6',
    name: 'Providing reflective questions for teacher meetings',
    description: 'Create reflective questions that help workers facilitate discussion in future teacher meetings, addressing disconnects between framing and understanding',
    testCasesCount: 3
  }
};

export const getCaseData = (tabId: string): CaseData => {
  return caseData[tabId] || caseData.case1;
}; 