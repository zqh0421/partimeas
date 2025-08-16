"use client";

import { useState } from "react";
import {
  RubricVersion as BaseRubricVersion,
  RubricItem,
  TestCase,
} from "@/app/types";

interface RubricVersion extends Omit<BaseRubricVersion, "createdAt"> {
  createdAt: string;
  description: string;
}

interface RubricData {
  versions?: RubricVersion[];
  systemPrompt?: string;
  evaluationPrompt?: string;
  rubricItems?: RubricItem[];
  testCases?: TestCase[];
}

interface RubricVersioningProps {
  rubricData: RubricData;
  setRubricData: (data: RubricData) => void;
}

export default function RubricVersioning({
  rubricData,
  setRubricData,
}: RubricVersioningProps) {
  const [versions, setVersions] = useState<RubricVersion[]>(
    rubricData.versions || []
  );
  const [selectedVersion, setSelectedVersion] = useState<RubricVersion | null>(
    null
  );
  const [newVersionName, setNewVersionName] = useState("");
  const [newVersionDescription, setNewVersionDescription] = useState("");

  const createNewVersion = () => {
    if (newVersionName.trim()) {
      const versionNumber = versions.length + 1;
      const newVersion: RubricVersion = {
        id: Date.now().toString(),
        version: `v${versionNumber}.0`,
        name: newVersionName,
        description: newVersionDescription,
        createdAt: new Date().toISOString(),
        systemPrompt: rubricData.systemPrompt || "",
        evaluationPrompt: rubricData.evaluationPrompt || "",
        rubricItems: rubricData.rubricItems || [],
        testCases: rubricData.testCases || [],
        history: [],
      };

      const updatedVersions = [...versions, newVersion];
      setVersions(updatedVersions);
      setRubricData({
        ...rubricData,
        versions: updatedVersions,
      });

      setNewVersionName("");
      setNewVersionDescription("");
    }
  };

  const loadVersion = (version: RubricVersion) => {
    setSelectedVersion(version);
    setRubricData({
      ...rubricData,
      systemPrompt: version.systemPrompt,
      rubricItems: version.rubricItems,
      testCases: version.testCases,
    });
  };

  const deleteVersion = (id: string) => {
    const updatedVersions = versions.filter((v) => v.id !== id);
    setVersions(updatedVersions);
    setRubricData({
      ...rubricData,
      versions: updatedVersions,
    });

    if (selectedVersion?.id === id) {
      setSelectedVersion(null);
    }
  };

  const exportVersion = (version: RubricVersion) => {
    const dataStr = JSON.stringify(version, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${version.name}-${version.version}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Rubric Versioning
        </h2>
        <p className="text-gray-600 mb-6">
          Save and manage different versions of your rubric for comparison and
          rollback.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Create New Version
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version Name
              </label>
              <input
                type="text"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="Enter version name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe what changes were made in this version..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Current State
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>
                  • System Prompt:{" "}
                  {rubricData.systemPrompt ? "✓ Set" : "✗ Not set"}
                </div>
                <div>
                  • Rubric Items:{" "}
                  {rubricData.rubricItems?.filter(
                    (item: RubricItem) => item.criteria && item.description
                  ).length || 0}
                  /5 defined
                </div>
                <div>
                  • Test Cases: {rubricData.testCases?.length || 0} added
                </div>
              </div>
            </div>

            <button
              onClick={createNewVersion}
              disabled={!newVersionName.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Version
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Version History
          </h3>

          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No versions created yet.</p>
              <p className="text-sm">
                Create your first version to start tracking changes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedVersion?.id === version.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {version.name}
                      </h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {version.version}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportVersion(version);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Export
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteVersion(version.id);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {version.description}
                  </p>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      Created:{" "}
                      {new Date(version.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      Items: {version.rubricItems?.length || 0} criteria
                    </div>
                    <div>Test Cases: {version.testCases?.length || 0}</div>
                  </div>

                  <button
                    onClick={() => loadVersion(version)}
                    className="mt-3 w-full px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Load Version
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedVersion && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-sm font-medium text-green-900 mb-2">
            Currently Loaded: {selectedVersion.name} ({selectedVersion.version})
          </h3>
          <p className="text-sm text-green-800">
            {selectedVersion.description}
          </p>
        </div>
      )}
    </div>
  );
}
