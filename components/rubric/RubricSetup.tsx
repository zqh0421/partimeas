'use client';

import { useState } from 'react';

interface RubricSetupProps {
  rubricData: any;
  setRubricData: (data: any) => void;
}

export default function RubricSetup({ rubricData, setRubricData }: RubricSetupProps) {
  const [systemPrompt, setSystemPrompt] = useState(rubricData.systemPrompt);

  const handleSave = () => {
    setRubricData({
      ...rubricData,
      systemPrompt
    });
  };

  const examplePrompts = [
    {
      title: "Code Review Rubric",
      prompt: "You are an expert code reviewer. Evaluate the following code based on:\n- Code quality and readability\n- Performance considerations\n- Security best practices\n- Documentation and comments\n- Test coverage"
    },
    {
      title: "Essay Evaluation Rubric",
      prompt: "You are an academic evaluator. Assess the following essay based on:\n- Thesis clarity and argument strength\n- Evidence and support\n- Organization and flow\n- Writing style and grammar\n- Originality and insight"
    },
    {
      title: "Business Analysis Rubric",
      prompt: "You are a business analyst. Evaluate the following analysis based on:\n- Problem identification\n- Data quality and relevance\n- Methodology appropriateness\n- Conclusions and recommendations\n- Presentation clarity"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Prompt Setup</h2>
        <p className="text-gray-600 mb-6">
          Define the system prompt that will guide the LLM evaluation. This should establish the context and criteria for assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-2">
            System Prompt
          </label>
          <textarea
            id="systemPrompt"
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your system prompt here..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {systemPrompt.length} characters
            </span>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Prompt
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Example Prompts</h3>
          <div className="space-y-3">
            {examplePrompts.map((example, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-md hover:border-blue-300 cursor-pointer"
                onClick={() => setSystemPrompt(example.prompt)}
              >
                <h4 className="font-medium text-gray-900 mb-1">{example.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-3">{example.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {systemPrompt && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Preview</h3>
          <div className="text-sm text-blue-800 whitespace-pre-wrap">{systemPrompt}</div>
        </div>
      )}
    </div>
  );
} 