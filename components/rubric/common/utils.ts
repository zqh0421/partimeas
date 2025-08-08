export const parseInputContent = (input: string) => {
  const useContextMatch = input.match(/Use Context: (.+?)(?:\n\nScenario:|$)/);
  const scenarioMatch = input.match(/Scenario: (.+?)$/);
  
  return {
    useContext: useContextMatch ? useContextMatch[1].trim() : '',
    userInput: scenarioMatch ? scenarioMatch[1].trim() : input
  };
};

export const combineInputContent = (useContext: string, userInput: string) => {
  if (!useContext && !userInput) return '';
  if (!useContext) return userInput;
  if (!userInput) return `Use Context: ${useContext}`;
  return `Use Context: ${useContext}\n\nScenario: ${userInput}`;
}; 