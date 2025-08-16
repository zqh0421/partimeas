"use client";

import { useState } from "react";
import { RubricVersion } from "@/types";
import CaseTab from "./CaseTab";

interface ConfigurationPanelProps {
  currentVersion: RubricVersion;
  setCurrentVersion: (version: RubricVersion | ((prev: RubricVersion) => RubricVersion)) => void;
  onOpenSettings: () => void;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
}

export default function ConfigurationPanel({ 
  currentVersion, 
  setCurrentVersion, 
  onOpenSettings,
  isCollapsed = false,
  onToggleCollapse
}: ConfigurationPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    systemPrompt: false,
    useCases: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // If collapsed, show only a minimal toggle button
  if (isCollapsed) {
    return (
      <div className="bg-white rounded-r-lg shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl">
        <div className="p-2">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            title="Expand Configuration Panel"
          >
            <span className="text-lg">🔧</span>
          </button>
        </div>
        
        {/* Quick Settings Button */}
        <div className="px-2 pb-2">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            title="Settings"
          >
            <span className="text-sm">⚙️</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Configuration Panel
          </h2>
          <button
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="text-lg">◀</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* System Prompt Section */}
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <button
                onClick={() => toggleSection("systemPrompt")}
                className="flex justify-between items-center w-full text-left"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  S123 Relation GPT
                </h3>
                <span className="text-gray-500">
                  {expandedSections.systemPrompt ? "▼" : "▶"}
                </span>
              </button>
            </div>
            {expandedSections.systemPrompt && (
              <div className="p-4">
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm overflow-visible"
                  placeholder="Enter the system prompt for evaluating LLM outputs..."
                  value={currentVersion.systemPrompt}
                  onChange={(e) =>
                    setCurrentVersion((prev) => ({
                      ...prev,
                      systemPrompt: e.target.value,
                    }))
                  }
                />
              </div>
            )}
          </div>

          {/* Use Cases Section */}
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <button
                onClick={() => toggleSection("useCases")}
                className="flex justify-between items-center w-full text-left"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  Use Case(s)
                </h3>
                <span className="text-gray-500">
                  {expandedSections.useCases ? "▼" : "▶"}
                </span>
              </button>
            </div>
            {expandedSections.useCases && (
              <div className="p-4">
                <CaseTab
                  currentVersion={currentVersion}
                  setCurrentVersion={setCurrentVersion}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 