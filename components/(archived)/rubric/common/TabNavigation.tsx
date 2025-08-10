"use client";

import React from 'react';

interface Tab {
  id: string;
  label: string;
  color?: 'blue' | 'red' | 'green';
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = ""
}: TabNavigationProps) {
  const getTabColor = (tab: Tab, isActive: boolean) => {
    if (!isActive) return 'text-gray-600 hover:text-gray-900';
    
    switch (tab.color) {
      case 'red':
        return 'bg-white text-red-600 shadow-sm';
      case 'green':
        return 'bg-white text-green-600 shadow-sm';
      case 'blue':
      default:
        return 'bg-white text-blue-600 shadow-sm';
    }
  };

  return (
    <div className={`flex space-x-1 bg-gray-100 rounded-lg p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tab.id
              ? getTabColor(tab, true)
              : getTabColor(tab, false)
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
} 