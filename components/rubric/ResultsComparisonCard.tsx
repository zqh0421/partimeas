"use client";

import { useState, useMemo } from "react";
import { RubricVersion } from "@/types/rubric";

interface ResultsComparisonCardProps {
  currentVersion: RubricVersion;
  setCurrentVersion: (version: RubricVersion | ((prev: RubricVersion) => RubricVersion)) => void;
}

interface EvaluationResult {
  id: string;
  testCaseInput: string;
  llmResponse: string;
  scores: Record<string, number>;
  overallScore: number;
  feedback: string;
  evaluatedAt: Date;
  evaluator: string;
  modelName?: string; // Add model name for comparison
  criteriaVersion?: string; // Add criteria version for comparison
}

export default function ResultsComparisonCard({
  currentVersion,
  setCurrentVersion,
}: ResultsComparisonCardProps) {
  const [isComparisonCardExpanded, setIsComparisonCardExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    analysis: false,
    directMode: false,
    sideBySide: false,
    qualityAssessment: false,
    consistencyCheck: false,
  });

  // Filtering and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCriteria, setSelectedCriteria] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedCriteriaVersion, setSelectedCriteriaVersion] = useState<string>('');
  const [showFilteredResults, setShowFilteredResults] = useState(false);
  
  // Comparison mode state
  const [comparisonMode, setComparisonMode] = useState<'models' | 'criteria'>('models');
  const [selectedComparisonType, setSelectedComparisonType] = useState<string>('');
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Mock evaluation results for demonstration
  const mockEvaluationResults: EvaluationResult[] = [
    {
      id: 'eval-4',
      testCaseInput: 'I wanted reflective questions because I was feeling a disconnect between the way that I was framing our conversations and the teachers\' understanding (of my words and of the child). I don\'t want to include observations that don\'t directly involve M, but I\'d like some reflective questions to explore. I want them to tie in with M and his history and experiences while also addressing the classroom environment and social and emotional supports.',
      llmResponse: `Reflective Questions: Exploring the Environment & Emotional Supports

Co-Regulation & Trauma Sensitivity:

How can we continue using co-regulating adult presence to help Messiah sustain attention and manage transitions, especially during less structured times like centers?

Given Messiah's history of trauma and the potential for hypervigilance, how can we create a classroom rhythm that balances stimulation and calm moments, helping him feel safe without needing to be "on alert"?

Social Problem-Solving & Peer Dynamics:

How can we strengthen peer problem-solving skills in ways that reduce "policing" behaviors and instead foster empathy and collaboration?

What language or modeling can help peers support Messiah in moments of dysregulation without triggering feelings of shame or exclusion?

Emotional Expression & Repair:

When Messiah expresses frustration (e.g., "Lunch is boring!"), how can we validate his emotions while guiding him toward alternative ways of expressing them?

How can we use everyday moments to model emotional repair (e.g., "It looks like you didn't mean to splash me. What could we do to fix it?") instead of relying on scripted apologies?

Classroom Regulation Spaces:

Does Messiah view spaces like the sensory table or cozy corner as tools for regulation?

How might we adjust the use of these spaces to ensure they are always framed as supportive, not punitive, especially for children with trauma histories who may be sensitive to perceived exclusion?

Supporting Autonomy & Boundaries:

In moments of dysregulation, how can we offer Messiah choices that give him a sense of control while still maintaining classroom boundaries?

Are there opportunities to shift from directive language ("Don't do that") to reflective or choice-based prompts ("I see you want to splash—what's another way we can play with the water?")?`,
      scores: {
        '1': 5, // Theoretical Accuracy
        '2': 5, // Safety & Ethics
        '3': 5, // Practical Application
        '4': 5, // Assessment & Observation
        '5': 4, // Communication & Collaboration
        '6': 5, // Professional Development
      },
      overallScore: 5.0,
      feedback: 'Exceptional response that demonstrates deep understanding of trauma-informed practices, co-regulation strategies, and child-centered approaches. The questions are comprehensive, practical, and address the specific needs mentioned in the context.',
      evaluatedAt: new Date('2024-01-23T11:45:00'),
      evaluator: 'LLM-as-a-Judge',
      modelName: 'GPT-4',
      criteriaVersion: 'v2.1'
    },
    {
      id: 'eval-5',
      testCaseInput: 'Please ground my report in the lenses of the polyvagal theory and neuroequential model to better understand the child\'s worldview: Ever since K, a four-year-old child, moved from his previous classroom, Ms. S. has provided a more structured environment that seems to offer him a greater sense of safety...',
      llmResponse: `Absolutely. Here's a simplified, classroom-appropriate version of the report that retains the insights from the **Polyvagal Theory** and **Neurosequential Model**, but uses clear and practical language for teachers, aides, or school staff:

---

**Simplified Report on K — Understanding Through a Brain-Based Lens**

Since K moved into Ms. S.'s classroom, he seems to feel safer and more at ease. The daily routines and clear structure help him know what to expect, which is very important for his sense of safety and ability to learn. When the classroom feels calm and predictable, it helps K stay in a "ready to learn" state. This idea comes from something called the **Polyvagal Theory**, which teaches us that kids need to feel safe and connected before they can focus, play, or learn.

K has big feelings that can lead to long tantrums—sometimes up to 30 minutes. Even though Ms. S. has nine other students, she gives K the time and calm presence he needs when he's upset. This is what we call **co-regulation**—when an adult stays calm and helps a child calm down by being a steady, comforting presence. This is especially helpful when a child's brain and body are stuck in a "fight or flight" or overwhelmed state.

K has speech delays, which makes it hard for him to say how he feels or what he needs. This can be frustrating for him and sometimes leads to meltdowns. He's not doing this on purpose—his brain is still learning how to express and handle big emotions. His home life is a bit unpredictable too. He moves between two homes, and his family is dealing with financial stress. These types of stress can affect how a child's brain develops, especially when it comes to emotional regulation and problem-solving. That's part of what the **Neurosequential Model** helps us understand: the brain develops from the bottom up, and some kids need extra support building those early blocks of safety and regulation before they can move on to higher-level thinking.

K does really well when things go as expected, but any change in routine can be very upsetting. He thrives when he knows what's coming next. His mom shared that he enjoys being outside and she's working on helping him become more independent at home.

When I observed him in class, K looked more engaged and happy than before. He smiled and followed along with what his peers were doing, even if he didn't always take the lead himself. He loves to help out in the classroom and seems to feel proud when he gets to play that role. Ms. S. often reminds him gently to "use your words" to express his needs. Even though he struggles with this, it's helping him learn. During meltdowns, he seeks connection—he wants someone to be there with him.

K loves coloring (and he stays inside the lines!), enjoys letters and numbers, and lights up during music and movement activities like dancing and singing. These kinds of rhythmic, sensory activities are great for his brain and body—they help him stay regulated and engaged.

He's still learning to use the potty, but doesn't always tell someone when he needs to go or when he's had an accident. Ms. S. handles this with kindness, using natural consequences like having him sit next to her to think about what happened. This gives him structure without shame.

K often repeats back what's said to him, especially if he doesn't fully understand. This repetition is actually one of the ways he's trying to make sense of what's happening. Ms. S. is very consistent in how she responds to his behavior. She stays calm, clear, and warm—which is exactly what he needs. Her use of humor and encouragement helps him feel connected and safe.

K does well in play centers, has strong fine motor skills, and is able to entertain himself in solo play. Sometimes it seems like he's in his own little world, but he can rejoin the group when gently invited. That's a good sign that he's developing trust and connection.

---

**What We're Working On:**

1. **Helping K Calm Down Faster:** Support him with routines, calming activities (like music, movement, or helping roles), and stay near during dysregulation.
2. **Building Language Skills:** Use simple language, visual supports, and repetition. Encourage him to label his feelings and ask for help.
3. **Fostering Independence:** Give him chances to make choices and take on responsibilities (like helping jobs or picking activities).
4. **Staying Consistent:** Predictability helps K feel safe. Clear transitions and routines help reduce meltdowns.

---

**Final Thoughts**

K is not trying to be difficult—his brain is still learning how to manage big feelings and communicate effectively. With consistent structure, warmth, and patience, he is making progress. Ms. S. is doing a wonderful job creating a classroom environment that supports his nervous system and emotional needs. Over time, with continued support and speech therapy, we expect to see more independence, shorter tantrums, and stronger communication from K.

---

Let me know if you'd like this turned into a one-page handout or visuals to share with staff!`,
      scores: {
        '1': 5, // Theoretical Accuracy
        '2': 4, // Safety & Ethics
        '3': 5, // Practical Application
        '4': 4, // Assessment & Observation
        '5': 5, // Communication & Collaboration
        '6': 4, // Professional Development
      },
      overallScore: 4.7,
      feedback: 'Excellent application of theoretical frameworks to real-world scenarios. The response demonstrates sophisticated understanding of neurodevelopmental principles and their practical application in educational settings.',
      evaluatedAt: new Date('2024-01-24T09:30:00'),
      evaluator: 'LLM-as-a-Judge',
      modelName: 'Claude-3',
      criteriaVersion: 'v2.0'
    },
    {
      id: 'eval-6',
      testCaseInput: 'Please simplify the language of the report into practical and classroom appropriate language',
      llmResponse: `Absolutely. Here's a simplified, classroom-appropriate version of the report that retains the insights from the **Polyvagal Theory** and **Neurosequential Model**, but uses clear and practical language for teachers, aides, or school staff:

---

**Simplified Report on K — Understanding Through a Brain-Based Lens**

Since K moved into Ms. S.'s classroom, he seems to feel safer and more at ease. The daily routines and clear structure help him know what to expect, which is very important for his sense of safety and ability to learn. When the classroom feels calm and predictable, it helps K stay in a "ready to learn" state. This idea comes from something called the **Polyvagal Theory**, which teaches us that kids need to feel safe and connected before they can focus, play, or learn.

K has big feelings that can lead to long tantrums—sometimes up to 30 minutes. Even though Ms. S. has nine other students, she gives K the time and calm presence he needs when he's upset. This is what we call **co-regulation**—when an adult stays calm and helps a child calm down by being a steady, comforting presence. This is especially helpful when a child's brain and body are stuck in a "fight or flight" or overwhelmed state.

K has speech delays, which makes it hard for him to say how he feels or what he needs. This can be frustrating for him and sometimes leads to meltdowns. He's not doing this on purpose—his brain is still learning how to express and handle big emotions. His home life is a bit unpredictable too. He moves between two homes, and his family is dealing with financial stress. These types of stress can affect how a child's brain develops, especially when it comes to emotional regulation and problem-solving. That's part of what the **Neurosequential Model** helps us understand: the brain develops from the bottom up, and some kids need extra support building those early blocks of safety and regulation before they can move on to higher-level thinking.

K does really well when things go as expected, but any change in routine can be very upsetting. He thrives when he knows what's coming next. His mom shared that he enjoys being outside and she's working on helping him become more independent at home.

When I observed him in class, K looked more engaged and happy than before. He smiled and followed along with what his peers were doing, even if he didn't always take the lead himself. He loves to help out in the classroom and seems to feel proud when he gets to play that role. Ms. S. often reminds him gently to "use your words" to express his needs. Even though he struggles with this, it's helping him learn. During meltdowns, he seeks connection—he wants someone to be there with him.

K loves coloring (and he stays inside the lines!), enjoys letters and numbers, and lights up during music and movement activities like dancing and singing. These kinds of rhythmic, sensory activities are great for his brain and body—they help him stay regulated and engaged.

He's still learning to use the potty, but doesn't always tell someone when he needs to go or when he's had an accident. Ms. S. handles this with kindness, using natural consequences like having him sit next to her to think about what happened. This gives him structure without shame.

K often repeats back what's said to him, especially if he doesn't fully understand. This repetition is actually one of the ways he's trying to make sense of what's happening. Ms. S. is very consistent in how she responds to his behavior. She stays calm, clear, and warm—which is exactly what he needs. Her use of humor and encouragement helps him feel connected and safe.

K does well in play centers, has strong fine motor skills, and is able to entertain himself in solo play. Sometimes it seems like he's in his own little world, but he can rejoin the group when gently invited. That's a good sign that he's developing trust and connection.

---

**What We're Working On:**

1. **Helping K Calm Down Faster:** Support him with routines, calming activities (like music, movement, or helping roles), and stay near during dysregulation.
2. **Building Language Skills:** Use simple language, visual supports, and repetition. Encourage him to label his feelings and ask for help.
3. **Fostering Independence:** Give him chances to make choices and take on responsibilities (like helping jobs or picking activities).
4. **Staying Consistent:** Predictability helps K feel safe. Clear transitions and routines help reduce meltdowns.

---

**Final Thoughts**

K is not trying to be difficult—his brain is still learning how to manage big feelings and communicate effectively. With consistent structure, warmth, and patience, he is making progress. Ms. S. is doing a wonderful job creating a classroom environment that supports his nervous system and emotional needs. Over time, with continued support and speech therapy, we expect to see more independence, shorter tantrums, and stronger communication from K.

---

Let me know if you'd like this turned into a one-page handout or visuals to share with staff!`,
      scores: {
        '1': 4, // Theoretical Accuracy
        '2': 5, // Safety & Ethics
        '3': 5, // Practical Application
        '4': 5, // Assessment & Observation
        '5': 4, // Communication & Collaboration
        '6': 5, // Professional Development
      },
      overallScore: 4.7,
      feedback: 'Outstanding translation of complex theoretical concepts into accessible, practical language. The response maintains theoretical accuracy while being highly accessible to classroom practitioners.',
      evaluatedAt: new Date('2024-01-25T14:15:00'),
      evaluator: 'LLM-as-a-Judge',
      modelName: 'GPT-4',
      criteriaVersion: 'v1.8'
    }
  ];

  // Filter results based on search and criteria
  const filteredResults = useMemo(() => {
    return mockEvaluationResults.filter(result => {
      const matchesSearch = searchTerm === '' || 
        result.testCaseInput.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.llmResponse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.feedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (result.modelName && result.modelName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCriteria = selectedCriteria === '' || 
        (result.scores && result.scores[selectedCriteria] !== undefined);
      
      const matchesModel = selectedModel === '' || 
        (result.modelName && result.modelName === selectedModel);
      
      const matchesCriteriaVersion = selectedCriteriaVersion === '' || 
        (result.criteriaVersion && result.criteriaVersion === selectedCriteriaVersion);
      
      return matchesSearch && matchesCriteria && matchesModel && matchesCriteriaVersion;
    });
  }, [mockEvaluationResults, searchTerm, selectedCriteria, selectedModel, selectedCriteriaVersion]);

  // Get available models and criteria versions for filtering
  const availableModels = useMemo(() => {
    const models = new Set<string>();
    mockEvaluationResults.forEach(result => {
      if (result.modelName) models.add(result.modelName);
    });
    return Array.from(models);
  }, [mockEvaluationResults]);

  const availableCriteriaVersions = useMemo(() => {
    const versions = new Set<string>();
    mockEvaluationResults.forEach(result => {
      if (result.criteriaVersion) versions.add(result.criteriaVersion);
    });
    return Array.from(versions);
  }, [mockEvaluationResults]);

  // Get available criteria for filtering
  const availableCriteria = useMemo(() => {
    const criteria = new Set<string>();
    mockEvaluationResults.forEach(result => {
      Object.keys(result.scores).forEach(criterion => criteria.add(criterion));
    });
    return Array.from(criteria);
  }, [mockEvaluationResults]);

  // Calculate summary statistics for filtered results
  const summaryStats = useMemo(() => {
    const totalEvaluations = filteredResults.length;
    const averageScore = totalEvaluations > 0 
      ? filteredResults.reduce((sum, result) => sum + result.overallScore, 0) / totalEvaluations 
      : 0;
    const highScores = filteredResults.filter(result => result.overallScore >= 4).length;

    return { totalEvaluations, averageScore, highScores };
  }, [filteredResults]);

  // Mock reasoning for criteria scores
  const getCriteriaReasoning = (criteriaId: string, score: number) => {
    switch (criteriaId) {
      case '1':
        return 'The LLM accurately identifies the theoretical foundation of the request (Polyvagal Theory, Neurosequential Model).';
      case '2':
        return 'The LLM demonstrates a strong understanding of safety and ethics, particularly in relation to trauma sensitivity and child-centered approaches.';
      case '3':
        return 'The LLM provides practical, classroom-appropriate strategies for application, such as co-regulation, peer problem-solving, and emotional repair.';
      case '4':
        return 'The LLM effectively assesses and observes the child\'s needs and behaviors, including their history and current context.';
      case '5':
        return 'The LLM communicates clearly and collaboratively, using language that is both professional and accessible.';
      case '6':
        return 'The LLM demonstrates ongoing professional development and a commitment to continuous learning in trauma-informed practices.';
      default:
        return 'No specific reasoning provided.';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              📊 Results Comparison
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsComparisonCardExpanded(!isComparisonCardExpanded)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isComparisonCardExpanded ? "▼" : "▶"}
            </button>
          </div>
        </div>
      </div>

      {isComparisonCardExpanded && (
        <div className="p-4 sm:p-6">
          <div className="space-y-6">

            {/* Output Analysis Tools Section */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200">
                  <button
                    onClick={() => toggleSection("analysis")}
                    className="flex justify-between items-center w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      🔍 Output Analysis Tools
                    </h3>
                    <span className="text-gray-500">
                      {expandedSections.analysis ? "▼" : "▶"}
                    </span>
                  </button>
                </div>
                {expandedSections.analysis && (
                  <div className="p-4">
                    {/* Direct Mode Selection */}
                    <div className="mb-6">
                      <div className="bg-gray-50 rounded-lg border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <button
                            onClick={() => toggleSection("directMode")}
                            className="flex justify-between items-center w-full text-left"
                          >
                            <h4 className="font-semibold text-gray-900">🎯 Direct Mode</h4>
                            <span className="text-gray-500">
                              {expandedSections.directMode ? "▼" : "▶"}
                            </span>
                          </button>
                        </div>
                        {expandedSections.directMode && (
                          <div className="p-4">
                            <p className="text-sm text-gray-600 mb-4">
                              Run analysis tools directly on selected test cases for immediate results.
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="select-all"
                                  className="rounded"
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTestCases(filteredResults.map(result => result.id));
                                    } else {
                                      setSelectedTestCases([]);
                                    }
                                  }}
                                />
                                <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                                  Select All ({filteredResults.length})
                                </label>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {filteredResults.map((result, index) => (
                                  <div key={result.id} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`test-case-${result.id}`}
                                      className="rounded"
                                      checked={selectedTestCases.includes(result.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedTestCases(prev => [...prev, result.id]);
                                        } else {
                                          setSelectedTestCases(prev => prev.filter(id => id !== result.id));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`test-case-${result.id}`} className="text-sm text-gray-700">
                                      Test Case {index + 1} ({result.overallScore.toFixed(1)})
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 flex space-x-2">
                                <button 
                                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                  disabled={selectedTestCases.length === 0}
                                >
                                  Run Analysis ({selectedTestCases.length})
                                </button>
                                <button 
                                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                                  onClick={() => setSelectedTestCases([])}
                                >
                                  Clear Selection
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comparison Mode Selection */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">🔄 Comparison Mode</h4>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setComparisonMode('models')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            comparisonMode === 'models'
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          📊 Model Comparison
                        </button>
                        
                        <button
                          onClick={() => setComparisonMode('criteria')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            comparisonMode === 'criteria'
                              ? 'bg-green-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-600'
                          }`}
                        >
                          📋 Criteria Comparison
                        </button>
                      </div>
                    </div>

                    {/* Output Filtering & Search */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">🔍 Output Filtering & Search</h4>
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Search outputs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <select 
                            value={selectedCriteria}
                            onChange={(e) => setSelectedCriteria(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">All Criteria</option>
                            {availableCriteria.map(criterion => (
                              <option key={criterion} value={criterion}>Criteria {criterion}</option>
                            ))}
                          </select>
                          <select 
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">All Models</option>
                            {availableModels.map(model => (
                              <option key={model} value={model}>{model}</option>
                            ))}
                          </select>
                          <select 
                            value={selectedCriteriaVersion}
                            onChange={(e) => setSelectedCriteriaVersion(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">All Versions</option>
                            {availableCriteriaVersions.map(version => (
                              <option key={version} value={version}>{version}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => setShowFilteredResults(!showFilteredResults)}
                            className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                          >
                            {showFilteredResults ? 'Hide' : 'Show'} Results
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Summary Statistics */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">📊 Summary Statistics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{summaryStats.totalEvaluations}</div>
                          <div className="text-sm text-blue-700">Total Evaluations</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{summaryStats.averageScore.toFixed(1)}</div>
                          <div className="text-sm text-green-700">Average Score</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{summaryStats.highScores}</div>
                          <div className="text-sm text-purple-700">High Scores (≥4)</div>
                        </div>
                      </div>
                    </div>

                    {/* Side-by-Side Comparison Tool */}
                    <div className="mb-6">
                      <div className="bg-gray-50 rounded-lg border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <button
                            onClick={() => toggleSection("sideBySide")}
                            className="flex justify-between items-center w-full text-left"
                          >
                            <h4 className="font-semibold text-gray-900">📊 Side-by-Side Comparison</h4>
                            <span className="text-gray-500">
                              {expandedSections.sideBySide ? "▼" : "▶"}
                            </span>
                          </button>
                        </div>
                        {expandedSections.sideBySide && (
                          <div className="p-4">
                            <p className="text-sm text-gray-600 mb-4">
                              Compare multiple model outputs side by side for detailed analysis.
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="select-all-comparison"
                                  className="rounded"
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTestCases(filteredResults.map(result => result.id));
                                    } else {
                                      setSelectedTestCases([]);
                                    }
                                  }}
                                />
                                <label htmlFor="select-all-comparison" className="text-sm font-medium text-gray-700">
                                  Select All for Comparison ({filteredResults.length})
                                </label>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {filteredResults.map((result, index) => (
                                  <div key={result.id} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`comparison-${result.id}`}
                                      className="rounded"
                                      checked={selectedTestCases.includes(result.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedTestCases(prev => [...prev, result.id]);
                                        } else {
                                          setSelectedTestCases(prev => prev.filter(id => id !== result.id));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`comparison-${result.id}`} className="text-sm text-gray-700">
                                      {result.modelName || 'Unknown'} - Test Case {index + 1}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4">
                                <button 
                                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                  disabled={selectedTestCases.length < 2}
                                >
                                  Start Comparison ({selectedTestCases.length} selected)
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quality Assessment Tool */}
                    <div className="mb-6">
                      <div className="bg-gray-50 rounded-lg border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <button
                            onClick={() => toggleSection("qualityAssessment")}
                            className="flex justify-between items-center w-full text-left"
                          >
                            <h4 className="font-semibold text-gray-900">📈 Quality Assessment</h4>
                            <span className="text-gray-500">
                              {expandedSections.qualityAssessment ? "▼" : "▶"}
                            </span>
                          </button>
                        </div>
                        {expandedSections.qualityAssessment && (
                          <div className="p-4">
                            <p className="text-sm text-gray-600 mb-4">
                              Assess output quality based on predefined criteria and metrics.
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="select-all-quality"
                                  className="rounded"
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTestCases(filteredResults.map(result => result.id));
                                    } else {
                                      setSelectedTestCases([]);
                                    }
                                  }}
                                />
                                <label htmlFor="select-all-quality" className="text-sm font-medium text-gray-700">
                                  Select All for Assessment ({filteredResults.length})
                                </label>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {filteredResults.map((result, index) => (
                                  <div key={result.id} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`quality-${result.id}`}
                                      className="rounded"
                                      checked={selectedTestCases.includes(result.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedTestCases(prev => [...prev, result.id]);
                                        } else {
                                          setSelectedTestCases(prev => prev.filter(id => id !== result.id));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`quality-${result.id}`} className="text-sm text-gray-700">
                                      Test Case {index + 1} (Score: {result.overallScore.toFixed(1)})
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4">
                                <button 
                                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                  disabled={selectedTestCases.length === 0}
                                >
                                  Run Assessment ({selectedTestCases.length} selected)
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Consistency Check Tool */}
                    <div className="mb-6">
                      <div className="bg-gray-50 rounded-lg border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <button
                            onClick={() => toggleSection("consistencyCheck")}
                            className="flex justify-between items-center w-full text-left"
                          >
                            <h4 className="font-semibold text-gray-900">🔄 Consistency Check</h4>
                            <span className="text-gray-500">
                              {expandedSections.consistencyCheck ? "▼" : "▶"}
                            </span>
                          </button>
                        </div>
                        {expandedSections.consistencyCheck && (
                          <div className="p-4">
                            <p className="text-sm text-gray-600 mb-4">
                              Check for consistency across multiple outputs and responses.
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="select-all-consistency"
                                  className="rounded"
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTestCases(filteredResults.map(result => result.id));
                                    } else {
                                      setSelectedTestCases([]);
                                    }
                                  }}
                                />
                                <label htmlFor="select-all-consistency" className="text-sm font-medium text-gray-700">
                                  Select All for Consistency Check ({filteredResults.length})
                                </label>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {filteredResults.map((result, index) => (
                                  <div key={result.id} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`consistency-${result.id}`}
                                      className="rounded"
                                      checked={selectedTestCases.includes(result.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedTestCases(prev => [...prev, result.id]);
                                        } else {
                                          setSelectedTestCases(prev => prev.filter(id => id !== result.id));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`consistency-${result.id}`} className="text-sm text-gray-700">
                                      {result.modelName || 'Unknown'} - Test Case {index + 1}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4">
                                <button 
                                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                                  disabled={selectedTestCases.length < 2}
                                >
                                  Check Consistency ({selectedTestCases.length} selected)
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Test Case Results */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">📋 Test Case Results</h4>
                      <div className="space-y-4">
                        {filteredResults.map((result, index) => (
                          <div key={result.id} className="bg-white border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="font-medium text-gray-900">Test Case {index + 1}</h5>
                                <p className="text-sm text-gray-500">
                                  {new Date(result.evaluatedAt).toLocaleDateString()} • {result.evaluator}
                                  {result.modelName && ` • ${result.modelName}`}
                                  {result.criteriaVersion && ` • ${result.criteriaVersion}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">{result.overallScore.toFixed(1)}</div>
                                <div className="text-xs text-gray-500">Overall Score</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <h6 className="font-medium text-gray-700 mb-2">Input</h6>
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                  {result.testCaseInput}
                                </div>
                              </div>
                              <div>
                                <h6 className="font-medium text-gray-700 mb-2">LLM Response</h6>
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                  {result.llmResponse}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h6 className="font-medium text-gray-700 mb-2">Evaluation Summary</h6>
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                  {result.feedback}
                                </div>
                              </div>
                              <div>
                                <h6 className="font-medium text-gray-700 mb-2">Criteria Scores</h6>
                                <div className="bg-white border rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Criteria</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Score</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(result.scores).map(([criteriaId, score]) => (
                                        <tr 
                                          key={criteriaId} 
                                          className="border-t border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer group"
                                          title={`Criteria ${criteriaId}: ${getCriteriaReasoning(criteriaId, score)}`}
                                        >
                                          <td className="px-3 py-2 text-sm text-gray-900">
                                            Criteria {criteriaId}
                                          </td>
                                          <td className="px-3 py-2 text-sm font-medium text-right">
                                            {score}/5
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 