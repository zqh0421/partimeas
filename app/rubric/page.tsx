'use client';

import { useState } from 'react';
import SettingsModal from '../../components/rubric/SettingsModal';

interface RubricItem {
  id: string;
  criteria: string;
  description: string;
  category: string;
}

interface RubricVersion {
  id: string;
  name: string;
  systemPrompt: string;
  evaluationPrompt: string;
  rubricItems: RubricItem[];
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
  }>;
  createdAt: Date;
}

export default function RubricPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    systemPrompt: false,
    evaluationPrompt: false,
    testCases: false,
  });
  
  // Define stable category order
  const stableCategoryOrder = [
    'Theory Application',
    'Safety & Ethics', 
    'Practical Application',
    'Assessment & Observation',
    'Communication & Collaboration',
    'Professional Development'
  ];

  const [currentVersion, setCurrentVersion] = useState<RubricVersion>({
    id: '1',
    name: 'Initial Version',
    systemPrompt: `Purpose: This GPT model is designed to act as an expert in understanding the needs of children and people supporting those children in relation to specific theories or approaches. The model's expertise is derived exclusively from Bruce Perry's Neurosequential Model, Dr. Steven Porges' Polyvagal Theory, Dr. Dan Siegel's Interpersonal Neurobiology, and Dr. Becky Bailey's Conscious Discipline. It will work collaboratively with the user to apply its expertise to scenarios or questions input by the user.

Core Instructions:
1. The model should have in-depth knowledge of the Neurosequential Model, Polyvagal Theory, Interpersonal Neurobiology, and Conscious Discipline, including their principals, applications, and limitations.
2. When presented with a scenario, the model will analyze it through the lens of one or more of these theories and provide possible interpretations or insights.
3. The model should draw its expertise only from highly reputable sources such as writings by the theory founders, peer-reviewed published articles, or other well-respected sources. It should prioritize accurate insights from and application of the specific theories.
4. When necessary or appropriate, ask the user for additional information about the scenario, such as the developmental or chronological age of the child, the routine of the setting, the strengths or perspectives of people who surround the child or children.
5. Start your initial output with the following texts. Please Bold the word reminder and put the rest in italics font, Reminder: Like a GPS, I aim to provide insights and information to support the journey. However, as the driver, you hold the ultimate responsibility for deciding if, when, and how to follow that guidance. Your contextual knowledge and relationships with the people you are supporting should guide your decisions.
6. The model will then provide initial output organized under the following sections.
- Connections to my knowledge base This section will include specific explanations of how one or more of the theories or approaches connect to specific information shared in the scenario.
- Curiosities I have about this situation This section will include 3 to 5 open-ended and/or reflective questions for the user to respond to or explore with the setting team that may help increase the accuracy of connections or support the development of things to considerations.

Behavioral Guidelines:
- Use precise professional language
- Be non-judgmental with a supportive, strength-focused, and optimistic tone
- Tend toward supporting the process over providing a prescription of what to do
- Avoid the use of diagnostic labels or suggesting other services – focus on helping the team's understanding, reflective capacity, and potential approaches.

Technical Details:
- Use a large language model, such as GPT-4o or o1, optimized for high-context understanding and nuanced responses.
- Include specialized training on the specific theories and models using fine-tuning or custom data if needed.

System Notes:
- When possible, please include citations and/or links to references and resources.
- Encourage the user to provide specific details if needed about the scenario for more tailored advice.
- Prompt the user to dig deeper into any part of the initial output for better understanding or application.
- Add disclaimers where appropriate, emphasizing that the tool is for educational purposes and not a substitute for professional supervision.`,
    evaluationPrompt: `You are an expert evaluator of AI responses in child development scenarios. Your task is to evaluate the quality of AI-generated responses based on the following criteria. For each criterion, provide a rating from 1-5 where:

1 = Poor/Inadequate
2 = Below Average
3 = Average/Adequate  
4 = Good/Above Average
5 = Excellent/Outstanding

Please evaluate the AI response for each criterion and provide your reasoning.`,
    rubricItems: [
      // Theory Application
      { id: '1', criteria: 'Theoretical Accuracy', description: 'How accurately the response applies child development theories (Neurosequential Model, Polyvagal Theory, etc.)', category: 'Theory Application' },
      { id: '2', criteria: 'Theory Integration', description: 'How well multiple theories are integrated and connected in the response', category: 'Theory Application' },
      { id: '3', criteria: 'Evidence-Based Practice', description: 'Use of research-based evidence and citations in the response', category: 'Theory Application' },
      
      // Safety & Ethics
      { id: '4', criteria: 'Safety Considerations', description: 'How well safety concerns and risk factors are addressed', category: 'Safety & Ethics' },
      { id: '5', criteria: 'Ethical Guidelines', description: 'Adherence to professional ethical standards and boundaries', category: 'Safety & Ethics' },
      { id: '6', criteria: 'Cultural Sensitivity', description: 'Recognition and respect for cultural differences and diversity', category: 'Safety & Ethics' },
      
      // Practical Application
      { id: '7', criteria: 'Actionable Guidance', description: 'How practical and implementable the suggestions are', category: 'Practical Application' },
      { id: '8', criteria: 'Resource Availability', description: 'Consideration of available resources and constraints', category: 'Practical Application' },
      { id: '9', criteria: 'Step-by-Step Process', description: 'Clear, sequential steps for implementation', category: 'Practical Application' },
      
      // Assessment & Observation
      { id: '10', criteria: 'Assessment Accuracy', description: 'Quality of developmental assessment and observation', category: 'Assessment & Observation' },
      { id: '11', criteria: 'Data Collection', description: 'Systematic approach to gathering relevant information', category: 'Assessment & Observation' },
      { id: '12', criteria: 'Progress Monitoring', description: 'Methods for tracking progress and outcomes', category: 'Assessment & Observation' },
      
      // Communication & Collaboration
      { id: '13', criteria: 'Family Communication', description: 'How well the response addresses family engagement and communication', category: 'Communication & Collaboration' },
      { id: '14', criteria: 'Team Collaboration', description: 'Promotion of interdisciplinary team collaboration', category: 'Communication & Collaboration' },
      { id: '15', criteria: 'Stakeholder Involvement', description: 'Inclusion of all relevant stakeholders in the process', category: 'Communication & Collaboration' },
      
      // Professional Development
      { id: '16', criteria: 'Professional Growth', description: 'Opportunities for professional learning and development', category: 'Professional Development' },
      { id: '17', criteria: 'Reflective Practice', description: 'Encouragement of self-reflection and continuous improvement', category: 'Professional Development' },
      { id: '18', criteria: 'Knowledge Sharing', description: 'Promotion of knowledge transfer and best practices', category: 'Professional Development' }
    ],
    testCases: [
      {
        id: '1',
        input: 'A 4-year-old child in preschool is having difficulty with transitions between activities. They become very upset and sometimes aggressive when asked to stop playing and move to the next activity.',
        expectedOutput: 'Theoretical Accuracy: 4, Safety Considerations: 4, Actionable Guidance: 5, Assessment Accuracy: 4, Family Communication: 4, Professional Growth: 3'
      },
      {
        id: '2', 
        input: 'A 7-year-old child with sensory processing difficulties is struggling in a traditional classroom setting. The teacher reports they are easily distracted and have difficulty sitting still.',
        expectedOutput: 'Theoretical Accuracy: 5, Safety Considerations: 3, Actionable Guidance: 4, Assessment Accuracy: 5, Family Communication: 4, Professional Growth: 4'
      },
      {
        id: '3',
        input: 'A family is experiencing significant stress due to financial difficulties and the child is showing signs of anxiety and behavioral regression.',
        expectedOutput: 'Theoretical Accuracy: 4, Safety Considerations: 5, Actionable Guidance: 4, Assessment Accuracy: 4, Family Communication: 5, Professional Growth: 3'
      }
    ],
    createdAt: new Date()
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('Theory Application');
  const [editingCriteria, setEditingCriteria] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [focusedItem, setFocusedItem] = useState<string | null>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const startEditing = (itemId: string, currentValue: string) => {
    setEditingCriteria(itemId);
    setEditingValue(currentValue);
  };

  const saveEditing = (itemId: string) => {
    if (editingValue.trim()) {
      updateRubricItem(itemId, 'criteria', editingValue.trim());
    }
    setEditingCriteria(null);
    setEditingValue('');
  };

  const cancelEditing = () => {
    setEditingCriteria(null);
    setEditingValue('');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, category?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (category) {
      setDragTarget(category);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    if (draggedItem) {
      setCurrentVersion(prev => ({
        ...prev,
        rubricItems: prev.rubricItems.map(item =>
          item.id === draggedItem ? { ...item, category: targetCategory } : item
        )
      }));
      
      // Switch to target category and focus the moved item
      setSelectedCategory(targetCategory);
      setFocusedItem(draggedItem);
      
      // Clear drag states
      setDraggedItem(null);
      setDragTarget(null);
      
      // Scroll to focused item after a short delay to ensure DOM update
      setTimeout(() => {
        const focusedElement = document.getElementById(`criteria-${draggedItem}`);
        if (focusedElement) {
          focusedElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      // Clear focus after a longer delay
      setTimeout(() => {
        setFocusedItem(null);
      }, 3000);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragTarget(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const categoryItems = currentVersion.rubricItems.filter(item => item.category === selectedCategory);
    if (direction === 'up' && index > 0) {
      const newItems = [...currentVersion.rubricItems];
      const itemToMove = newItems.find(item => item.id === categoryItems[index].id);
      const itemAbove = newItems.find(item => item.id === categoryItems[index - 1].id);
      if (itemToMove && itemAbove) {
        const temp = itemToMove.category;
        itemToMove.category = itemAbove.category;
        itemAbove.category = temp;
        setCurrentVersion(prev => ({ ...prev, rubricItems: newItems }));
      }
    } else if (direction === 'down' && index < categoryItems.length - 1) {
      const newItems = [...currentVersion.rubricItems];
      const itemToMove = newItems.find(item => item.id === categoryItems[index].id);
      const itemBelow = newItems.find(item => item.id === categoryItems[index + 1].id);
      if (itemToMove && itemBelow) {
        const temp = itemToMove.category;
        itemToMove.category = itemBelow.category;
        itemBelow.category = temp;
        setCurrentVersion(prev => ({ ...prev, rubricItems: newItems }));
      }
    }
  };

  const updateRubricItem = (itemId: string, field: keyof RubricItem, value: string) => {
    setCurrentVersion(prev => ({
      ...prev,
      rubricItems: prev.rubricItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const deleteRubricItem = (itemId: string) => {
    setCurrentVersion(prev => ({
      ...prev,
      rubricItems: prev.rubricItems.filter(item => item.id !== itemId)
    }));
  };

  const addRubricItem = (category: string) => {
    const newItem: RubricItem = {
      id: Date.now().toString(),
      criteria: 'New Criteria',
      description: 'Describe what this criterion evaluates...',
      category: category
    };
    setCurrentVersion(prev => ({
      ...prev,
      rubricItems: [...prev.rubricItems, newItem]
    }));
  };

  const addNewCategory = () => {
    const newCategory = prompt('Enter new category name:');
    if (newCategory && newCategory.trim()) {
      // Add to stable category order if not already present
      if (!stableCategoryOrder.includes(newCategory.trim())) {
        stableCategoryOrder.push(newCategory.trim());
      }
    }
  };

  const saveVersion = () => {
    const versionName = prompt('Enter version name:');
    if (versionName) {
      const newVersion: RubricVersion = {
        ...currentVersion,
        id: Date.now().toString(),
        name: versionName,
        createdAt: new Date()
      };
      // In a real app, you'd save this to a database or localStorage
      console.log('Saved version:', newVersion);
    }
  };

  const loadVersion = () => {
    // In a real app, you'd load from a database or localStorage
    console.log('Load version functionality would go here');
  };

  const exportVersion = () => {
    const dataStr = JSON.stringify(currentVersion, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rubric-version-${currentVersion.name}.json`;
    link.click();
  };

  // Get categories in stable order, including any new ones
  const getCategoriesInOrder = () => {
    const existingCategories = Array.from(new Set(currentVersion.rubricItems.map(item => item.category)));
    const orderedCategories = stableCategoryOrder.filter(cat => existingCategories.includes(cat));
    const newCategories = existingCategories.filter(cat => !stableCategoryOrder.includes(cat));
    return [...orderedCategories, ...newCategories];
  };

  const categories = getCategoriesInOrder();
  const categoryItems = currentVersion.rubricItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Child Development Rubric Refiner</h1>
            <p className="text-gray-600 mt-2">Refine evaluation criteria for AI responses in child development scenarios</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={saveVersion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              💾 Save Version
            </button>
            <button
              onClick={loadVersion}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📂 Load Version
            </button>
            <button
              onClick={exportVersion}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              📤 Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Prompts and Test Cases */}
          <div className="lg:col-span-1 space-y-6">
            {/* System Prompt Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <button
                  onClick={() => toggleSection('systemPrompt')}
                  className="flex justify-between items-center w-full text-left"
                >
                  <h2 className="text-lg font-semibold text-gray-900">Evaluation System Prompt</h2>
                  <span className="text-gray-500">{expandedSections.systemPrompt ? '▼' : '▶'}</span>
                </button>
              </div>
              {expandedSections.systemPrompt && (
                <div className="p-6">
                  <textarea
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the system prompt for evaluating LLM outputs..."
                    value={currentVersion.systemPrompt}
                    onChange={(e) => setCurrentVersion(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* Evaluation Prompt Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <button
                  onClick={() => toggleSection('evaluationPrompt')}
                  className="flex justify-between items-center w-full text-left"
                >
                  <h2 className="text-lg font-semibold text-gray-900">Evaluation Prompt</h2>
                  <span className="text-gray-500">{expandedSections.evaluationPrompt ? '▼' : '▶'}</span>
                </button>
              </div>
              {expandedSections.evaluationPrompt && (
                <div className="p-6">
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the evaluation prompt for assessing outputs..."
                    value={currentVersion.evaluationPrompt}
                    onChange={(e) => setCurrentVersion(prev => ({ ...prev, evaluationPrompt: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* Test Cases Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <button
                  onClick={() => toggleSection('testCases')}
                  className="flex justify-between items-center w-full text-left"
                >
                  <h2 className="text-lg font-semibold text-gray-900">Validation Test Cases</h2>
                  <span className="text-gray-500">{expandedSections.testCases ? '▼' : '▶'}</span>
                </button>
              </div>
              {expandedSections.testCases && (
                <div className="p-6">
                  <div className="space-y-4">
                    {currentVersion.testCases.map((testCase, index) => (
                      <div key={testCase.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900">Test Case {index + 1}</h4>
                          <button
                            onClick={() => {
                              setCurrentVersion(prev => ({
                                ...prev,
                                testCases: prev.testCases.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Input Scenario</label>
                            <textarea
                              rows={3}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="Enter a child development scenario..."
                              value={testCase.input}
                              onChange={(e) => {
                                setCurrentVersion(prev => ({
                                  ...prev,
                                  testCases: prev.testCases.map((tc, i) =>
                                    i === index ? { ...tc, input: e.target.value } : tc
                                  )
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Output</label>
                            <textarea
                              rows={2}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="Expected evaluation scores per criterion..."
                              value={testCase.expectedOutput}
                              onChange={(e) => {
                                setCurrentVersion(prev => ({
                                  ...prev,
                                  testCases: prev.testCases.map((tc, i) =>
                                    i === index ? { ...tc, expectedOutput: e.target.value } : tc
                                  )
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setCurrentVersion(prev => ({
                          ...prev,
                          testCases: [...prev.testCases, {
                            id: Date.now().toString(),
                            input: '',
                            expectedOutput: ''
                          }]
                        }));
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                    >
                      + Add Test Case
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Rubric Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Evaluation Criteria (Rate 1-5 Each)</h2>
                </div>
              </div>

              <div className="p-6">
                {/* Category Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((category) => (
                    <div
                      key={category}
                      onDragOver={(e) => handleDragOver(e, category)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                        selectedCategory === category
                          ? 'bg-green-600 text-white'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      } ${
                        dragTarget === category
                          ? 'ring-2 ring-green-500 ring-offset-2 bg-green-200 shadow-lg scale-105'
                          : ''
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </div>
                  ))}
                  <button
                    onClick={addNewCategory}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                  >
                    + Add Category
                  </button>
                </div>

                {/* Category Items */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{selectedCategory}</h3>
                    <button
                      onClick={() => addRubricItem(selectedCategory)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      + Add Criteria
                    </button>
                  </div>

                  {categoryItems.length > 0 && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-800">
                        💡 <strong>Tip:</strong> Drag criteria items to move them between categories. After dropping, you'll be taken to the target category and the moved item will be highlighted.
                      </p>
                    </div>
                  )}

                  {categoryItems.map((item, index) => (
                    <div
                      key={item.id}
                      id={`criteria-${item.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => handleDragOver(e, item.category)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, item.category)}
                      onDragEnd={handleDragEnd}
                      className={`border border-gray-200 rounded-lg p-3 ${draggedItem === item.id ? 'opacity-50' : ''} hover:shadow-md transition-all cursor-move ${
                        dragTarget === item.category && draggedItem !== item.id 
                          ? 'border-2 border-dashed border-green-400 bg-green-50' 
                          : ''
                      } ${
                        focusedItem === item.id 
                          ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50 border-blue-300 shadow-lg' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col space-y-0.5">
                            <button
                              onClick={() => moveItem(index, 'up')}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveItem(index, 'down')}
                              disabled={index === categoryItems.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                            >
                              ▼
                            </button>
                          </div>
                          <span className="text-gray-400 text-xs mr-1">⋮⋮</span>
                          <div className="flex items-center space-x-1">
                            {editingCriteria === item.id ? (
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => saveEditing(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    saveEditing(item.id);
                                  } else if (e.key === 'Escape') {
                                    cancelEditing();
                                  }
                                }}
                                className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base font-medium"
                                autoFocus
                              />
                            ) : (
                              <h4 className="text-base font-medium text-gray-900">{item.criteria}</h4>
                            )}
                            <button
                              onClick={() => {
                                if (editingCriteria === item.id) {
                                  saveEditing(item.id);
                                } else {
                                  startEditing(item.id, item.criteria);
                                }
                              }}
                              className="text-gray-400 hover:text-gray-600 text-xs"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteRubricItem(item.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="ml-6">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Describe what this criterion evaluates in child development AI responses..."
                          value={item.description}
                          onChange={(e) => updateRubricItem(item.id, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}

                  {categoryItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No criteria in this category yet.</p>
                      <p className="text-sm">Click "Add Criteria" to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
} 