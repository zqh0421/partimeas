import React from 'react';

export interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  onClick?: () => void;
  'aria-hidden'?: boolean;
}

export const ChevronDownIcon: React.FC<IconProps> = ({ 
  className = "h-5 w-5", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props} 
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = ({ 
  className = "h-5 w-5", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ 
  className = "h-5 w-5", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ 
  className = "h-5 w-5", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ 
  className = "h-5 w-5", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ 
  className = "w-5 h-5", 
  fill = "currentColor",
  ...props 
}) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={fill}
    aria-hidden="true"
    {...props}
  >
    <path d="M12 5c-3.859 0-7 3.141-7 7s3.141 7 7 7c2.914 0 5.402-1.77 6.42-4.269a1 1 0 0 1 1.86.738C19.996 19.21 16.34 22 12 22 6.477 22 2 17.523 2 12S6.477 2 12 2c2.21 0 4.217.804 5.77 2.137V3a1 1 0 1 1 2 0v5h-5a1 1 0 1 1 0-2h2.693A8.962 8.962 0 0 0 12 5Z" />
  </svg>
);

export const RefreshCycleIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 1.6,
  ...props 
}) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    aria-hidden="true"
    {...props}
  >
    {/* Upper arc - right side */}
    <path 
      d="M 16 7 A 5 5 0 0 1 17 12" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round"
    />
    <path 
      d="M 14 5 L 16 7 L 14 9" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Lower arc - left side */}
    <path 
      d="M 8 17 A 5 5 0 0 1 7 12" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round"
    />
    <path 
      d="M 10 19 L 8 17 L 10 15" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const StopIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9z" />
  </svg>
);

export const LoadingSpinner: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  ...props 
}) => (
  <div className={`border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin ${className}`} {...props} />
);

export const InfoIcon: React.FC<IconProps> = ({ 
  className = "w-5 h-5", 
  fill = "currentColor",
  ...props 
}) => (
  <svg 
    className={className} 
    fill={fill}
    viewBox="0 0 20 20"
    {...props}
  >
    <path 
      fillRule="evenodd" 
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
      clipRule="evenodd" 
    />
  </svg>
);

export const WarningIcon: React.FC<IconProps> = ({ 
  className = "w-5 h-5", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export const ErrorIcon: React.FC<IconProps> = ({ 
  className = "w-5 h-5", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const SuccessIcon: React.FC<IconProps> = ({ 
  className = "w-5 h-5", 
  fill = "currentColor",
  ...props 
}) => (
  <svg 
    className={className} 
    fill={fill}
    viewBox="0 0 20 20"
    {...props}
  >
    <path 
      fillRule="evenodd" 
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
      clipRule="evenodd" 
    />
  </svg>
);

export const DocumentIcon: React.FC<IconProps> = ({ 
  className = "h-4 w-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const FolderIcon: React.FC<IconProps> = ({ 
  className = "h-4 w-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

export const ClipboardIcon: React.FC<IconProps> = ({ 
  className = "h-4 w-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth}
    aria-hidden="true"
    {...props}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export const FilterIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

export const MenuIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const ExpandIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

export const CollapseIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-5-5m0 0l-5 5m5-5v12" />
  </svg>
);

export const ChartBarIcon: React.FC<IconProps> = ({ 
  className = "w-5 h-5", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export const RestartIcon: React.FC<IconProps> = ({ 
  className = "w-4 h-4", 
  strokeWidth = 2,
  ...props 
}) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeWidth={strokeWidth}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export const Icons = {
  // 方向图标
  ChevronDown: ChevronDownIcon,
  ChevronUp: ChevronUpIcon,
  ChevronRight: ChevronRightIcon,
  ChevronLeft: ChevronLeftIcon,
  
  // 操作图标
  Check: CheckIcon,
  Refresh: RefreshIcon,
  RefreshCycle: RefreshCycleIcon,
  Play: PlayIcon,
  Pause: PauseIcon,
  Stop: StopIcon,
  Restart: RestartIcon,
  
  // 状态图标
  Loading: LoadingSpinner,
  Info: InfoIcon,
  Warning: WarningIcon,
  Error: ErrorIcon,
  Success: SuccessIcon,
  
  // 文档图标
  Document: DocumentIcon,
  Folder: FolderIcon,
  Clipboard: ClipboardIcon,
  
  // 系统图标
  Settings: SettingsIcon,
  Search: SearchIcon,
  Filter: FilterIcon,
  
  // 界面图标
  Menu: MenuIcon,
  Close: CloseIcon,
  Expand: ExpandIcon,
  Collapse: CollapseIcon,
  
  // 图表图标
  ChartBar: ChartBarIcon
};

export default Icons;