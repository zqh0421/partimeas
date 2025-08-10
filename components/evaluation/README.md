# EvaluationResultsTable Component

## Overview
The `EvaluationResultsTable` is a sophisticated evaluation results display component that provides a multi-level, foldable criteria structure for comparing model performance across different evaluation dimensions. It's designed to handle complex rubric evaluations with subcriteria and detailed scoring explanations.

## Key Features

### 🎯 **Multi-Level Criteria Structure**
- **Main Criteria**: Top-level evaluation categories (e.g., Content Quality, Language Quality)
- **Subcriteria**: Detailed evaluation points under each main criteria
- **Score Levels**: Expandable explanations for 0/1/2 scoring system

### 📊 **Model Comparison**
- **Horizontal Layout**: Each column represents a different model
- **Score Visualization**: Color-coded scores with progress bars
- **Performance Tracking**: Easy comparison across multiple models

### 🔍 **Interactive Elements**
- **Expandable Rows**: Click arrows to expand criteria and subcriteria
- **Score Explanations**: View detailed descriptions for each score level (0/1/2)
- **Hover Effects**: Visual feedback for better user experience

## Design Consistency
The component follows the established visual design patterns used throughout the evaluation system:
- **Color Scheme**: Consistent with existing evaluation components
- **Typography**: Matches the established font hierarchy
- **Spacing**: Uses the standard spacing system (px-4, py-3, etc.)
- **Borders**: Consistent border styling (border-slate-200, rounded-lg)

## Interface

### Props
```typescript
interface EvaluationResultsTableProps {
  criteria: Criteria[];           // Array of evaluation criteria with subcriteria
  modelScores: ModelScore[];      // Array of model scores for each criteria
  title?: string;                 // Optional table title
}
```

### Data Structures

#### Criteria Structure
```typescript
interface Criteria {
  id: string;                     // Unique identifier
  name: string;                   // Display name
  description: string;            // Detailed description
  subcriteria: Subcriteria[];    // Array of subcriteria
}

interface Subcriteria {
  id: string;                     // Unique identifier
  name: string;                   // Display name
  description: string;            // Detailed description
  scoreLevels: {                  // Score level explanations
    0: string;                    // Score 0 description
    1: string;                    // Score 1 description
    2: string;                    // Score 2 description
  };
}
```

#### Model Scores Structure
```typescript
interface ModelScore {
  modelId: string;                // Unique model identifier
  modelName: string;              // Display name for the model
  scores: Record<string, number>; // Mapping of subcriteria ID to score (0-2)
}
```

## Usage Examples

### Basic Usage
```tsx
import { EvaluationResultsTable } from '@/components/evaluation';

<EvaluationResultsTable
  criteria={evaluationCriteria}
  modelScores={modelScores}
  title="Model Response Evaluation"
/>
```

### Complete Example
```tsx
const criteria = [
  {
    id: 'content_quality',
    name: 'Content Quality',
    description: 'Evaluation of response content and substance',
    subcriteria: [
      {
        id: 'relevance',
        name: 'Relevance to Question',
        description: 'How well the response addresses the question',
        scoreLevels: {
          0: 'Completely irrelevant',
          1: 'Partially relevant',
          2: 'Highly relevant'
        }
      }
    ]
  }
];

const modelScores = [
  {
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    scores: {
      relevance: 2
    }
  }
];

<EvaluationResultsTable
  criteria={criteria}
  modelScores={modelScores}
  title="Response Evaluation"
/>
```

## Design Patterns

### Color Coding System
- **Green (Score 2)**: Excellent performance (≥80%)
- **Yellow (Score 1)**: Moderate performance (40-79%)
- **Orange (Score 1)**: Below average (20-39%)
- **Red (Score 0)**: Poor performance (<20%)

### Visual Hierarchy
1. **Main Criteria**: Gray background with hover effects
2. **Subcriteria**: Blue background to distinguish from main criteria
3. **Score Explanations**: Color-coded boxes for each score level
4. **Interactive Elements**: Clear visual indicators for expandable content

### Responsive Design
- **Horizontal Scrolling**: Handles many models gracefully
- **Minimum Widths**: Ensures readability on all screen sizes
- **Flexible Layout**: Adapts to different content lengths

## Integration Points

### With ModelOutputsGrid
The component is integrated into the main evaluation interface as an alternative view to the card-based layout, providing users with a choice between detailed card views and comprehensive table views.

### With Rubric System
Designed to work with the existing rubric evaluation system, automatically calculating scores and displaying detailed feedback for each evaluation dimension.

## Accessibility Features
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and semantic structure
- **Color Contrast**: Meets accessibility standards for text readability
- **Focus Indicators**: Clear visual focus states for all interactive elements

## Performance Considerations
- **Efficient Rendering**: Uses React.Fragment to avoid unnecessary DOM nodes
- **State Management**: Optimized state updates for expandable sections
- **Memoization Ready**: Component structure supports React.memo optimization
- **Minimal Re-renders**: State changes only affect relevant sections

## Future Enhancements
- **Export Functionality**: PDF/Excel export capabilities
- **Advanced Filtering**: Filter by score ranges or criteria
- **Sorting Options**: Sort models by overall performance or specific criteria
- **Custom Scoring**: Support for different scoring scales beyond 0-2
- **Batch Operations**: Bulk actions for multiple criteria or models 