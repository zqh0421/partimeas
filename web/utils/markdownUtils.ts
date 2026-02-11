// Utility functions for prettifying model output with markdown formatting

// Function to create prettified markdown output
export const createPrettifiedMarkdown = (content: string): string => {
  if (!content) return '';
  
  let formatted = content;

  // Format ##### headings (H5)
  formatted = formatted.replace(/^#####\s+(.+)$/gm, 
    `<div class="mt-4 mb-2">
      <h5 class="text-xs font-bold text-gray-800">$1</h5>
    </div>`
  );

  // Format #### headings (H4)
  formatted = formatted.replace(/^####\s+(.+)$/gm, 
    `<div class="mt-4 mb-2">
      <h4 class="text-sm font-bold text-gray-800">$1</h4>
    </div>`
  );
  
  
  // Format ### headings (H3)
  formatted = formatted.replace(/^###\s+(.+)$/gm, 
    `<div class="mt-4 mb-2">
      <h3 class="text-base font-bold text-gray-800">$1</h3>
    </div>`
  );
  
  // Format ## headings (H2) 
  formatted = formatted.replace(/^##\s+(.+)$/gm,
    `<div class="mt-4 mb-2">
      <h2 class="text-lg font-bold text-gray-800">$1</h2>
    </div>`
  );
  
  // Format # headings (H1)
  formatted = formatted.replace(/^#\s+(.+)$/gm,
    `<div class="mt-6 mb-3">
      <h1 class="text-xl font-bold text-gray-800">$1</h1>
    </div>`
  );

  // Format horizontal rules - lines with only dashes (at least 3)
  formatted = formatted.replace(/^[-]{3,}$/gm, '<hr class="my-6 border-gray-300">');

  // Format bold and italic text with better styling
  // Triple emphasis (bold + italic) - move trailing punctuation outside the styled span
  formatted = formatted.replace(/___([^_]+?)([:：;；])?___/g, 
    `<span class="font-bold italic text-gray-800">$1</span>$2`);
  formatted = formatted.replace(/\*\*\*([^*]+?)([:：;；])?\*\*\*/g, 
    `<span class="font-bold italic text-gray-800">$1</span>$2`);
  
  // Format bold text with better styling - move trailing punctuation outside the styled span
  formatted = formatted.replace(/__([^_]+?)([:：;；])?__/g, 
    `<span class="font-bold text-gray-800">$1</span>$2`);
  formatted = formatted.replace(/\*\*([^*]+?)([:：;；])?\*\*/g, 
    `<span class="font-bold text-gray-800">$1</span>$2`);
  
  // Format italic text
  // Move trailing punctuation outside the styled span
  formatted = formatted.replace(/\*([^*]+?)([:：;；])?\*/g, 
    `<span class="italic text-gray-800">$1</span>$2`);
  formatted = formatted.replace(/_([^_]+?)([:：;；])?_/g, 
    `<span class="italic text-gray-800">$1</span>$2`);
  
  // Process content line by line for better list handling with indentation support
  const lines = formatted.split('\n');
  const processedLines = lines.map(line => {
    // Preserve original spacing to detect indentation
    const leadingSpaces = line.match(/^(\s*)/)?.[1] || '';
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) return line;
    
    // Calculate indentation level (every 2 spaces = 1 level)
    const indentLevel = Math.floor(leadingSpaces.length / 2);
    const marginLeft = indentLevel > 0 ? `ml-${indentLevel * 4}` : '';
    
    // Define different bullet styles for different levels
    const getBulletStyle = (level: number) => {
      const bullets = ['•', '◦', '▪'];
      return bullets[level % bullets.length];
    };
    
    // Define different number styles for different levels
    const getNumberStyle = (level: number, number: string) => {
      const num = parseInt(number.replace('.', ''));
      switch (level % 3) {
        case 0: return number; // 1., 2., 3.
        case 1: return `${String.fromCharCode(96 + num)}.`; // a., b., c.
        case 2: return `${toRoman(num).toLowerCase()}.`; // i., ii., iii.
        default: return number;
      }
    };
    
    // Helper function to convert number to Roman numerals
    const toRoman = (num: number): string => {
      const romanNumerals = [
        { value: 10, symbol: 'X' },
        { value: 9, symbol: 'IX' },
        { value: 5, symbol: 'V' },
        { value: 4, symbol: 'IV' },
        { value: 1, symbol: 'I' }
      ];
      
      let result = '';
      for (const { value, symbol } of romanNumerals) {
        while (num >= value) {
          result += symbol;
          num -= value;
        }
      }
      return result;
    };
    
    // Check for numbered lists first (1., 2., etc.)
    const numberedMatch = trimmedLine.match(/^(\d+\.)\s*(.+)$/);
    if (numberedMatch) {
      const styledNumber = getNumberStyle(indentLevel, numberedMatch[1]);
      return `<div class="flex items-start mb-2 ${marginLeft}">
      <span class="font-bold text-gray-600 mr-3 min-w-fit">${styledNumber}</span>
      <span class="text-gray-800 leading-relaxed">${numberedMatch[2]}</span>
    </div>`;
    }
    
    // Check for bullet points (-, *, •, +)
    const bulletMatch = trimmedLine.match(/^[-*•+]\s*(.+)$/);
    if (bulletMatch) {
      const bulletSymbol = getBulletStyle(indentLevel);
      return `<div class="flex items-start mb-2 ${marginLeft}">
      <span class="font-bold text-gray-600 mr-3 min-w-fit">${bulletSymbol}</span>
      <span class="text-gray-800 leading-relaxed">${bulletMatch[1]}</span>
    </div>`;
    }
    
    // Return original line if no matches
    return line;
  });
  
  formatted = processedLines.join('\n');
  
  // Process all content to ensure proper formatting
  // First, handle multi-line paragraphs (separated by double newlines)
  const sections = formatted.split(/\n\s*\n/);
  const processedSections = sections.map(section => {
    const trimmed = section.trim();
    if (!trimmed) return '';
    
    // Skip if already formatted as special content (including our list items)
    if (trimmed.includes('<div class="bg-') || 
        trimmed.includes('<h1 class=') || trimmed.includes('<h2 class=') || trimmed.includes('<h3 class=') ||
        trimmed.includes('<h4 class=') || trimmed.includes('<h5 class=') || trimmed.includes('<h6 class=') ||
        trimmed.includes('<div class="flex') ||
        trimmed.includes('<div class="mt-') ||
        trimmed.includes('<hr class=') ||
        trimmed.startsWith('<span class=')) {
      return trimmed;
    }
    
    // Check if this section contains multiple lines that need individual processing
    const lines = trimmed.split('\n');
    if (lines.length > 1) {
      // Multi-line section - process each line individually
      const processedLines = lines.map(line => {
        const lineTrimmed = line.trim();
        if (!lineTrimmed) return '';
        
        // Skip if already formatted
        if (lineTrimmed.startsWith('<div') || lineTrimmed.startsWith('<h') || 
            lineTrimmed.startsWith('<span') || lineTrimmed.startsWith('<hr')) {
          return lineTrimmed;
        }
        
        // Wrap unformatted text
        return `<div class="mt-4 mb-2 text-gray-800 text-sm leading-relaxed">${lineTrimmed}</div>`;
      }).filter(line => line);
      
      return processedLines.join('\n');
    } else {
      // Single line section - wrap as paragraph
      return `<div class=" text-gray-800 text-sm leading-relaxed">${trimmed}</div>`;
    }
  }).filter(section => section).join('\n\n');
  
  return `
  <div class="prose max-w-none text-sm text-gray-800">
    ${processedSections}
  </div>`;
};

// Note: createEnhancedMarkdownContent function has been replaced by EnhancedMarkdownRenderer component
// Use the component directly instead of this function for better performance and features

// Function to detect content type for automatic styling
export const detectMarkdownContentType = (content: string) => {
  const hasCode = /```[\s\S]*```/.test(content);
  const hasMath = /\$\$[\s\S]*\$\$|\$[^$\n]*\$/.test(content);
  const hasTables = /\|.*\|/.test(content);
  const hasLists = /^[-*+]\s|^\d+\.\s/.test(content);
  const hasImages = /!\[.*\]\(.*\)/.test(content);
  const hasTaskLists = /^[-*+]\s\[[ x]\]/.test(content);
  
  return {
    hasCode,
    hasMath,
    hasTables,
    hasLists,
    hasImages,
    hasTaskLists,
    isTechnical: hasCode || hasMath || hasTables,
    isStructured: hasLists || hasTables,
    isVisual: hasImages,
    isTaskOriented: hasTaskLists
  };
};

// Function to get recommended styles based on content type
export const getRecommendedStyles = (contentType: ReturnType<typeof detectMarkdownContentType>) => {
  const baseStyles = {
    headings: {
      h1: 'text-2xl font-bold text-gray-900 mb-4 mt-6',
      h2: 'text-xl font-bold text-gray-800 mb-3 mt-5',
      h3: 'text-lg font-bold text-gray-800 mb-2 mt-4',
    },
    paragraphs: 'text-gray-800 text-sm leading-relaxed mb-3',
    code: 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono',
  };

  if (contentType.isTechnical) {
    return {
      ...baseStyles,
      code: 'bg-gray-900 text-green-400 px-4 py-2 rounded-lg text-sm font-mono border border-gray-700',
      pre: 'bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4',
    };
  }

  if (contentType.isStructured) {
    return {
      ...baseStyles,
      lists: 'text-gray-700 text-base leading-relaxed mb-4',
      table: 'w-full border-collapse border border-gray-300 mb-4 shadow-sm',
    };
  }

  if (contentType.isTaskOriented) {
    return {
      ...baseStyles,
      input: 'mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500',
      li: 'mb-2 flex items-start',
    };
  }

  return baseStyles;
};