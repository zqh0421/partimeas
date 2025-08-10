'use client';

import { useState } from 'react';
import { HistoryEntry } from '@/types';

interface CriteriaHistoryProps {
  criteriaId: string;
  criteriaName: string;
  history: HistoryEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export default function CriteriaHistory({ criteriaId, criteriaName, history, isOpen, onClose }: CriteriaHistoryProps) {
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState('');

  if (!isOpen) return null;

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return '✨';
      case 'modified': return '✏️';
      case 'merged': return '🔄';
      case 'star': return '⭐';
      case 'unstared': return '👎';
      default: return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-green-600 bg-green-50';
      case 'modified': return 'text-blue-600 bg-blue-50';
      case 'merged': return 'text-purple-600 bg-purple-50';
      case 'star': return 'text-yellow-600 bg-yellow-50';
      case 'unstared': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      // In a real app, you'd save this comment to the history
      console.log('Adding comment:', newComment);
      setNewComment('');
      setShowAddComment(false);
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `criteria-history-${criteriaId}.json`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">History: {criteriaName}</h2>
              <p className="text-sm text-gray-600">Creation and modification history</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No history available for this criteria.</p>
              <p className="text-sm">History will be tracked as you make changes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getActionIcon(entry.action)}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(entry.action)}`}>
                        {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                      </span>
                      {entry.field && (
                        <span className="text-xs text-gray-500">({entry.field})</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>

                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Modified by: </span>
                    <span className="text-sm text-gray-600">{entry.modifier}</span>
                  </div>

                  {entry.oldValue && entry.newValue && (
                    <div className="mb-2 p-2 bg-gray-50 rounded text-xs">
                      <div className="text-red-600 line-through">{entry.oldValue}</div>
                      <div className="text-green-600">{entry.newValue}</div>
                    </div>
                  )}

                  {entry.comment && (
                    <div className="p-2 bg-blue-50 rounded text-sm">
                      <span className="font-medium text-blue-900">Comment: </span>
                      <span className="text-blue-800">{entry.comment}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddComment(!showAddComment)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showAddComment ? 'Cancel' : '+ Add Comment'}
              </button>
              {history.length > 0 && (
                <button
                  onClick={exportHistory}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  📤 Export History
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {history.length} history entries
            </div>
          </div>

          {showAddComment && (
            <div className="mt-3">
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Add a comment about this criteria..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => setShowAddComment(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Comment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 