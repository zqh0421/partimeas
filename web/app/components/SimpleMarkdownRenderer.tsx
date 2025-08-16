import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CustomStyles {
  headings?: {
    h1?: string;
    h2?: string;
    h3?: string;
    h4?: string;
    h5?: string;
    h6?: string;
  };
  paragraphs?: string;
  lists?: string;
  code?: string;
  blockquote?: string;
  table?: string;
}

interface SimpleMarkdownRendererProps {
  content: string;
  className?: string;
  customStyles?: CustomStyles;
  enableGfm?: boolean;
}

export const SimpleMarkdownRenderer: React.FC<SimpleMarkdownRendererProps> = ({
  content,
  className = '',
  customStyles = {},
  enableGfm = true,
}) => {
  const defaultStyles: Required<CustomStyles> = {
    headings: {
      h1: 'text-2xl font-bold text-gray-900 mb-4 mt-6',
      h2: 'text-xl font-bold text-gray-800 mb-3 mt-5',
      h3: 'text-lg font-bold text-gray-800 mb-2 mt-4',
      h4: 'text-base font-bold text-gray-800 mb-2 mt-4',
      h5: 'text-sm font-bold text-gray-800 mb-2 mt-4',
      h6: 'text-xs font-bold text-gray-800 mb-2 mt-4',
    },
    paragraphs: 'text-gray-800 text-sm leading-relaxed mb-3',
    lists: 'text-gray-800 text-sm leading-relaxed mb-3',
    code: 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono',
    blockquote: 'border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3',
    table: 'w-full border-collapse border border-gray-300 mb-4',
  };

  const styles: Required<CustomStyles> = {
    headings: { ...defaultStyles.headings, ...customStyles.headings },
    paragraphs: customStyles.paragraphs || defaultStyles.paragraphs,
    lists: customStyles.lists || defaultStyles.lists,
    code: customStyles.code || defaultStyles.code,
    blockquote: customStyles.blockquote || defaultStyles.blockquote,
    table: customStyles.table || defaultStyles.table,
  };

  const components = {
    h1: ({ children, ...props }: any) => (
      <h1 className={styles.headings.h1} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className={styles.headings.h2} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className={styles.headings.h3} {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className={styles.headings.h4} {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: any) => (
      <h5 className={styles.headings.h5} {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: any) => (
      <h6 className={styles.headings.h6} {...props}>
        {children}
      </h6>
    ),
    p: ({ children, ...props }: any) => (
      <p className={styles.paragraphs} {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className={`${styles.lists} list-disc list-inside`} {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className={`${styles.lists} list-inside`} {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="mb-1" {...props}>
        {children}
      </li>
    ),
    code: ({ children, className: codeClassName, ...props }: any) => {
      const isInline = !codeClassName;
      if (isInline) {
        return (
          <code className={styles.code} {...props}>
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-gray-900 text-gray-200 p-4 rounded-lg overflow-x-auto mb-4 font-mono text-sm border border-gray-700">
          <code className={codeClassName} {...props}>
            {children}
          </code>
        </pre>
      );
    },
    blockquote: ({ children, ...props }: any) => (
      <blockquote className={styles.blockquote} {...props}>
        {children}
      </blockquote>
    ),
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto">
        <table className={styles.table} {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-gray-100" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }: any) => (
      <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="border border-gray-300 px-3 py-2 text-gray-800" {...props}>
        {children}
      </td>
    ),
    tr: ({ children, ...props }: any) => (
      <tr className="hover:bg-gray-50" {...props}>
        {children}
      </tr>
    ),
    input: ({ checked, ...props }: any) => (
      <input
        type="checkbox"
        checked={checked}
        readOnly
        className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        {...props}
      />
    ),
    a: ({ children, href, ...props }: any) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline"
        target="_blank"
        rel="noopener noreferrer"
        title={href}
        {...props}
      >
        {children}
      </a>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-bold text-gray-800" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic text-gray-800" {...props}>
        {children}
      </em>
    ),
    del: ({ children, ...props }: any) => (
      <del className="line-through text-gray-500" {...props}>
        {children}
      </del>
    ),
    hr: ({ ...props }: any) => (
      <hr className="my-6 border-gray-300" {...props} />
    ),
  };

  // 配置插件
  const plugins = [];
  if (enableGfm) {
    plugins.push(remarkGfm);
  }

  return (
    <div className={`prose max-w-none ${className}`}>
      <style>
        {`
          .prose ul ul,
          .prose ol ol,
          .prose ul ol,
          .prose ol ul {
            margin-left: 0.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
          }
          
          .prose ul ul ul,
          .prose ol ol ol,
          .prose ul ol ol,
          .prose ol ul ul {
            margin-left: 1rem;
          }

          .prose ol {
            counter-reset: list-counter;
          }
          
          .prose ol > li {
            counter-increment: list-counter;
          }
          
          .prose ol ol {
            counter-reset: sub-list-counter;
          }
          
          .prose ol ol > li {
            counter-increment: sub-list-counter;
          }
          
          .prose ol ol ol {
            counter-reset: sub-sub-list-counter;
          }
          
          .prose ol ol ol > li {
            counter-increment: sub-sub-list-counter;
          }
          
          .prose ol {
            list-style: none;
          }
          
          .prose ol > li {
            position: relative;
            padding-left: 1.5em;
          }
          
          .prose ol > li::before {
            content: counter(list-counter) ". ";
            position: absolute;
            left: 0;
            font-weight: 500;
            color: #374151;
          }
          
          .prose ol ol > li::before {
            content: counter(sub-list-counter, lower-alpha) ". ";
          }
          
          .prose ol ol ol > li::before {
            content: counter(sub-sub-list-counter, lower-roman) ". ";
          }

          .prose ul {
            list-style: none;
          }
          
          .prose ul > li {
            position: relative;
            padding-left: 1.5em;
          }
          
          .prose ul > li::before {
            content: "•";
            position: absolute;
            left: 0;
            font-weight: bold;
          }
          
          .prose ul ul > li::before {
            content: "◦";
          }
          
          .prose ul ul ul > li::before {
            content: "▪";
          }

          .prose li {
            margin-bottom: 0.25rem;
          }
          
          .prose li:last-child {
            margin-bottom: 0;
          }
          
          /* 链接自动截断和样式优化 */
          .prose a {
            word-break: break-all;
            word-wrap: break-word;
            overflow-wrap: break-word;
            display: inline;
            vertical-align: baseline;
          }
          
          .prose a:hover {
            word-break: break-word;
          }
          
          /* 长链接的容器样式 */
          .prose p:has(a),
          .prose li:has(a) {
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-all;
          }
        `}
      </style>
      <ReactMarkdown
        components={components}
        remarkPlugins={plugins}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default SimpleMarkdownRenderer; 