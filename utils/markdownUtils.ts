// Utility functions for prettifying model output with markdown formatting

// Function to create prettified markdown output
export const createPrettifiedMarkdown = (content: string): string => {
  if (!content) return '';
  
  let formatted = content;
  
  
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
  
  // Format paragraphs - improved to better handle already formatted content
  const paragraphs = formatted.split(/\n\s*\n/);
  formatted = paragraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    
    // Skip if already formatted as special content (including our list items)
    if (trimmed.includes('<div class="bg-') || 
        trimmed.includes('<h1 class=') || trimmed.includes('<h2 class=') || trimmed.includes('<h3 class=') ||
        trimmed.includes('<div class="flex') ||
        trimmed.includes('<div class="mt-')) {
      return trimmed;
    }
    
    return `<div class="mb-4 text-gray-800 leading-relaxed">${trimmed}</div>`;
  }).filter(p => p).join('');
  
  return `<div class="prose max-w-none">${formatted}</div>`;
};