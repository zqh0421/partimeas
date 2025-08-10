/**
 * Unified Theme System for Partimeas
 * 
 * This file provides a centralized theme system that works with our Tailwind configuration
 * to ensure consistent styling across all components.
 */

// Semantic color mappings
export const THEME_COLORS = {
  // Primary action colors
  primary: {
    background: 'bg-primary-500',
    backgroundHover: 'hover:bg-primary-600',
    backgroundActive: 'active:bg-primary-700',
    backgroundDisabled: 'bg-primary-200',
    text: 'text-primary-500',
    textHover: 'hover:text-primary-600',
    textInverse: 'text-white',
    border: 'border-primary-500',
    borderHover: 'hover:border-primary-600',
    ring: 'ring-primary-500/20',
    shadow: 'shadow-primary-500/25',
  },
  
  // Secondary action colors
  secondary: {
    background: 'bg-secondary-500',
    backgroundHover: 'hover:bg-secondary-600',
    backgroundActive: 'active:bg-secondary-700',
    backgroundDisabled: 'bg-secondary-200',
    text: 'text-secondary-600',
    textHover: 'hover:text-secondary-700',
    textInverse: 'text-white',
    border: 'border-secondary-500',
    borderHover: 'hover:border-secondary-600',
    ring: 'ring-secondary-500/20',
    shadow: 'shadow-secondary-500/25',
  },
  
  // Status colors
  success: {
    background: 'bg-success-500',
    backgroundLight: 'bg-success-50',
    backgroundHover: 'hover:bg-success-600',
    text: 'text-success-600',
    textLight: 'text-success-500',
    textDark: 'text-success-800',
    border: 'border-success-500',
    borderLight: 'border-success-200',
    ring: 'ring-success-500/20',
  },
  
  warning: {
    background: 'bg-warning-500',
    backgroundLight: 'bg-warning-50',
    backgroundHover: 'hover:bg-warning-600',
    text: 'text-warning-600',
    textLight: 'text-warning-500',
    textDark: 'text-warning-800',
    border: 'border-warning-500',
    borderLight: 'border-warning-200',
    ring: 'ring-warning-500/20',
  },
  
  error: {
    background: 'bg-error-500',
    backgroundLight: 'bg-error-50',
    backgroundHover: 'hover:bg-error-600',
    text: 'text-error-600',
    textLight: 'text-error-500',
    textDark: 'text-error-800',
    textInverse: 'text-white',
    border: 'border-error-500',
    borderLight: 'border-error-200',
    ring: 'ring-error-500/20',
  },
  
  // Neutral colors for general UI - improved contrast and hierarchy
  neutral: {
    background: 'bg-neutral-100',
    backgroundSecondary: 'bg-neutral-50',
    backgroundTertiary: 'bg-neutral-25',
    backgroundHover: 'hover:bg-neutral-100',
    text: 'text-neutral-700',
    textSecondary: 'text-neutral-600',
    textTertiary: 'text-neutral-500',
    border: 'border-neutral-200',
    borderSecondary: 'border-neutral-300',
    borderSubtle: 'border-neutral-150',
    ring: 'ring-neutral-500/10',
    shadow: 'shadow-neutral-200/50',
  },
} as const;

// Model-specific color schemes
export const MODEL_COLORS = {
  claude: {
    background: 'bg-models-claude-500',
    backgroundLight: 'bg-models-claude-50',
    backgroundHover: 'hover:bg-models-claude-600',
    text: 'text-models-claude-600',
    textLight: 'text-models-claude-500',
    textDark: 'text-models-claude-800',
    textInverse: 'text-white',
    border: 'border-models-claude-500',
    borderLight: 'border-models-claude-200',
    ring: 'ring-models-claude-500/20',
    badge: 'bg-models-claude-100 text-models-claude-800 border-models-claude-200',
  },
  gpt: {
    background: 'bg-models-gpt-500',
    backgroundLight: 'bg-models-gpt-50',
    backgroundHover: 'hover:bg-models-gpt-600',
    text: 'text-models-gpt-600',
    textLight: 'text-models-gpt-500',
    textDark: 'text-models-gpt-800',
    textInverse: 'text-white',
    border: 'border-models-gpt-500',
    borderLight: 'border-models-gpt-200',
    ring: 'ring-models-gpt-500/20',
    badge: 'bg-models-gpt-100 text-models-gpt-800 border-models-gpt-200',
  },
  o1: {
    background: 'bg-models-o1-500',
    backgroundLight: 'bg-models-o1-50',
    backgroundHover: 'hover:bg-models-o1-600',
    text: 'text-models-o1-600',
    textLight: 'text-models-o1-500',
    textDark: 'text-models-o1-800',
    textInverse: 'text-white',
    border: 'border-models-o1-500',
    borderLight: 'border-models-o1-200',
    ring: 'ring-models-o1-500/20',
    badge: 'bg-models-o1-100 text-models-o1-800 border-models-o1-200',
  },
} as const;

// Step/process status colors - ReactFlow inspired with strong contrast
export const STEP_COLORS = {
  pending: {
    circle: 'bg-slate-400/90 text-white shadow-md border border-slate-300',
    background: 'bg-slate-50 border-slate-300',
    text: 'text-slate-400',
    border: 'border-slate-300',
    connector: 'bg-slate-400',
  },
  current: {
    circle: 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-200 border border-blue-500',
    background: 'shadow-sm border border-slate-300',
    text: 'text-blue-900',
    textSecondary: 'text-blue-700',
    border: 'border-blue-300',
    ring: 'ring-slate-500/10',
    connector: 'bg-blue-500',
  },
  completed: {
    circle: 'bg-emerald-600 text-white shadow-lg border border-emerald-500',
    background: 'border-slate-300 shadow-sm',
    text: 'text-emerald-900',
    textSecondary: 'text-emerald-700',
    border: 'border-emerald-300',
    connector: 'bg-emerald-500',
  },
  error: {
    circle: 'bg-red-600 text-white shadow-lg border border-red-500',
    background: 'bg-red-50 border-red-300 shadow-sm',
    text: 'text-red-900',
    textSecondary: 'text-red-700',
    border: 'border-red-300',
    connector: 'bg-red-500',
  },
} as const;

// Animation and transition utilities
export const ANIMATIONS = {
  transition: 'transition-all duration-200 ease-in-out',
  transitionSlow: 'transition-all duration-300 ease-in-out',
  transitionFast: 'transition-all duration-150 ease-in-out',
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  pulse: 'animate-pulse-subtle',
} as const;

// Utility functions for theme management
export const themeUtils = {
  /**
   * Get model-specific color classes
   */
  getModelColors: (modelId: string): typeof MODEL_COLORS.claude | typeof MODEL_COLORS.gpt | typeof MODEL_COLORS.o1 => {
    if (modelId.includes('claude')) return MODEL_COLORS.claude;
    if (modelId.includes('gpt') || modelId.includes('o1')) {
      if (modelId.includes('o1')) return MODEL_COLORS.o1;
      return MODEL_COLORS.gpt;
    }
    return MODEL_COLORS.claude; // fallback
  },
  
  /**
   * Get step status colors
   */
  getStepColors: (status: keyof typeof STEP_COLORS) => {
    return STEP_COLORS[status] || STEP_COLORS.pending;
  },
  
  /**
   * Combine multiple class strings
   */
  cn: (...classes: (string | undefined | null | boolean)[]): string => {
    return classes.filter(Boolean).join(' ');
  }
};

export default {
  THEME_COLORS,
  MODEL_COLORS,
  STEP_COLORS,
  ANIMATIONS,
  themeUtils,
};