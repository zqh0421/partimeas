'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  NodeTypes,
  EdgeTypes,
  Panel,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  Position,
  getBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import { HistoryEntry, VersionData } from '../../types/rubric';

interface ReactFlowBranchDiagramProps {
  criteriaId: string;
  criteriaName: string;
  history: HistoryEntry[];
  isOpen: boolean;
  onClose: () => void;
  onLoadVersion?: (versionData: VersionData) => void;
}

interface NodeData {
  id: string;
  label: string;
  action: string;
  timestamp: Date;
  modifier: string;
  version: string;
  commitHash: string;
  summary?: string;
  differenceSummary?: string;
  field?: string;
  comment?: string;
  changeType?: string;
  parentId?: string;
  isMultiSelected?: boolean;
  isMergeMode?: boolean;
}

interface CustomNodeProps {
  data: NodeData;
  selected?: boolean;
}

const CustomNode = ({ data, selected }: CustomNodeProps) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return '✨';
      case 'modified': return '✏️';
      case 'merged': return '🔀';
      case 'star': return '⭐';
      case 'unstared': return '🌟';
      case 'current': return '🎯';
      default: return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-100 border-green-500';
      case 'modified': return 'bg-blue-100 border-blue-500';
      case 'merged': return 'bg-orange-100 border-orange-300';
      case 'star': return 'bg-gray-100 border-blue-500';
      case 'unstared': return 'bg-gray-100 border-blue-500';
      case 'current': return 'bg-indigo-100 border-indigo-300';
      default: return 'bg-gray-100 border-blue-500';
    }
  };



  const formatTimestamp = (timestamp: Date) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(timestamp);
    } catch {
      return timestamp.toISOString().slice(0, 16).replace('T', ' ');
    }
  };

  const handleLoadVersion = () => {
    const event = new CustomEvent('loadVersion', {
      detail: {
        versionId: data.id,
        version: data.version,
        timestamp: data.timestamp,
        modifier: data.modifier,
        action: data.action,
        field: data.field,
        comment: data.comment
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className={`
      p-3 border rounded-lg bg-white
      ${getActionColor(data.action)}
      ${selected ? 'ring-2 ring-blue-400' : ''}
      ${data.isMultiSelected ? 'ring-2 ring-purple-400 bg-purple-50' : ''}
      ${data.isMergeMode ? 'cursor-pointer hover:ring-2 hover:ring-purple-300' : ''}
      h-full overflow-hidden flex flex-col
    `}>
      {/* Correct Handle components */}
      <Handle type="target" position={Position.Top} style={{
        background: '#555',
        border: '2px solid white',
        width: '8px',
        height: '8px',
        top: '-6px',
        borderRadius: '50%',
        left: '50%',
        transform: 'translateX(-50%)'
      }} />

      <Handle type="source" position={Position.Bottom} style={{
        background: '#555',
        border: '2px solid white',
        width: '8px',
        height: '8px',
        bottom: '-6px',
        borderRadius: '50%',
        left: '50%',
        transform: 'translateX(-50%)'
      }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center space-x-2">
          {/* Initial and Current labels */}
          {data.action === 'created' && !data.parentId && (
            <span className="px-1 py-0.5 bg-green-500 text-white text-xs rounded">INITIAL</span>
          )}
          {data.action === 'current' && (
            <span className="px-1 py-0.5 bg-indigo-500 text-white text-xs rounded">CURRENT</span>
          )}
          <span className="font-medium text-xs">
            {data.action === 'current' ? '(unnamed)' : 
             data.version || data.id}
          </span>
          {data.isMultiSelected && (
            <span className="px-1 py-0.5 bg-purple-500 text-white text-xs rounded">SELECTED</span>
          )}
        </div>

        {data.action !== 'current' && (
          <button
            onClick={handleLoadVersion}
            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
            title={`Load version ${data.version} into editing interface`}
          >
            📥
          </button>
        )}
      </div>

      {/* Content */}
      <div className="text-xs space-y-1 flex-1 overflow-y-auto">
        <div><span className="font-medium">Time:</span> {formatTimestamp(data.timestamp)}</div>
        <div><span className="font-medium">By:</span> {data.modifier}</div>
        {data.field && <div><span className="font-medium">Field:</span> {data.field}</div>}
        {data.changeType && <div><span className="font-medium">Type:</span> {data.changeType.replace('_', ' ')}</div>}
      </div>
    </div>
  );
};

interface CustomEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  style?: React.CSSProperties;
  data?: {
    action?: string;
    label?: string;
  };
}

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data }: CustomEdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
      />
      {data?.label && (
        <text
          x={labelX}
          y={labelY}
          className="text-xs font-medium fill-gray-600"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: '10px' }}
        >
          {data.label}
        </text>
      )}
    </>
  );
};

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

// Using default edge types for now
const edgeTypes: EdgeTypes = { default: CustomEdge };

interface KeyboardShortcutsProps {
  onClose: () => void;
  onResetLayout: () => void;
  onCenterCurrent: () => void;
}

const KeyboardShortcuts = ({ onClose, onResetLayout, onCenterCurrent }: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing
      }

      switch (event.key.toLowerCase()) {
        case 'escape':
          onClose();
          break;
        case 'r':
          onResetLayout();
          break;
        case 'c':
          onCenterCurrent();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onResetLayout, onCenterCurrent]);

  return null;
};

function ReactFlowBranchDiagramContent({ 
  criteriaName, 
  history, 
  isOpen, 
  onClose,
  onLoadVersion 
}: ReactFlowBranchDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]); // 多选节点
  const [isMergeMode, setIsMergeMode] = useState(false); // 合并模式
  const [focusedNode, setFocusedNode] = useState<HistoryEntry | null>(null); // 当前聚焦的节点
  const reactFlowInstance = useReactFlow();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localHistory, setLocalHistory] = useState<HistoryEntry[]>(history);

  // 同步props中的history到localHistory
  useEffect(() => {
    setLocalHistory(history);
  }, [history]);

  // 监控edges状态变化
  useEffect(() => {
    console.log('Edges state changed:', {
      edgesCount: edges.length,
      edgeIds: edges.map(e => e.id),
      edges: edges.map(e => `${e.source} -> ${e.target}`)
    });
  }, [edges]);

  // 监听loadVersion事件
  useEffect(() => {
    const handleLoadVersion = (event: CustomEvent) => {
      console.log('Load version event received:', event.detail);
      if (onLoadVersion) {
        onLoadVersion(event.detail);
      }
    };

    window.addEventListener('loadVersion', handleLoadVersion as EventListener);
    
    return () => {
      window.removeEventListener('loadVersion', handleLoadVersion as EventListener);
    };
  }, [onLoadVersion]);



  // Generate Git-like commit hashes
  const generateCommitHash = (entry: HistoryEntry, index: number) => {
    const timestamp = entry.timestamp.getTime().toString(16);
    const modifier = entry.modifier.slice(0, 3).toLowerCase();
    return `${timestamp.slice(-6)}${modifier}${index.toString().padStart(2, '0')}`;
  };

  // 根据action确定连接线样式
  const getEdgeStyle = (action: string) => {
    switch (action) {
      case 'created':
        return { stroke: '#10B981', strokeWidth: 2 }; // 绿色
      case 'modified':
        return { stroke: '#3B82F6', strokeWidth: 2 }; // 蓝色
      case 'merged':
        return { stroke: '#8B5CF6', strokeWidth: 2 }; // 紫色
      case 'star':
        return { stroke: '#F59E0B', strokeWidth: 2 }; // 橙色
      case 'unstared':
        return { stroke: '#6B7280', strokeWidth: 2 }; // 灰色
      default:
        return { stroke: '#6B7280', strokeWidth: 2 }; // 默认灰色
    }
  };

  // 基于parentId构建分支结构
  const createBranchStructureFromParentId = (history: HistoryEntry[]) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // 定义节点尺寸和间距
    const nodeWidth = 240;
    const nodeHeight = 160;
    const nodeSpacing = 200;
    const rootIndexSpacing = 800;
    
    const nodeMap = new Map<string, HistoryEntry>();
    const nodeLevels = new Map<string, number>();
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    // 构建节点映射
    history.forEach(entry => {
      nodeMap.set(entry.id, entry);
    });
    
    // 计算节点层级和位置
    const calculateLevels = (nodeId: string, level: number, xOffset: number) => {
      const entry = nodeMap.get(nodeId);
      if (!entry) return;
      
      nodeLevels.set(nodeId, level);
      
      // 计算X位置
      const children = history.filter(h => h.parentId === nodeId);
      if (children.length === 0) {
        // 叶子节点
        nodePositions.set(nodeId, { x: xOffset, y: level * nodeSpacing });
      } else {
        // 有子节点的节点，位置在子节点的中间
        children.forEach((child, index) => {
          const childXOffset = 300; // 水平间距
          const childXOffsetPos = xOffset + index * childXOffset;
          calculateLevels(child.id, level + 1, childXOffsetPos);
        });
        
        const childPositions = children.map(child => nodePositions.get(child.id)?.x || 0);
        const avgX = childPositions.length > 0 ? childPositions.reduce((a, b) => a + b, 0) / childPositions.length : xOffset;
        nodePositions.set(nodeId, { x: avgX, y: level * nodeSpacing });
      }
    };
    
    // 找到根节点（没有parentId的节点）
    const rootNodes = history.filter(entry => !entry.parentId);
    console.log('Root nodes:', rootNodes.map(n => n.id));
    
    // 为每个根节点计算位置
    rootNodes.forEach((rootNode, rootIndex) => {
      const rootXOffset = rootIndex * rootIndexSpacing;
      calculateLevels(rootNode.id, 0, rootXOffset);
    });
    
    // 创建节点
    history.forEach(entry => {
      const position = nodePositions.get(entry.id);
      if (position) {
        const isSelected = selectedNodes.includes(entry.id);
        

        
        const node: Node = {
          id: entry.id,
          type: 'customNode',
          position: position,
          data: {
            id: entry.id,
            timestamp: entry.timestamp,
            modifier: entry.modifier,
            action: entry.id === 'current-state' ? 'current' : entry.action, // 特殊处理current-state节点
            field: entry.field,
            oldValue: entry.oldValue,
            newValue: entry.newValue,
            comment: entry.comment,
            version: entry.version,
            changeType: entry.changeType,
            summary: entry.summary || "AI will generate version summary...",
            differenceSummary: entry.differenceSummary || "e.g. +1 Communication criteria, Modified Safety description, Changed Theory category...",
            commitHash: generateCommitHash(entry, history.indexOf(entry) + 1),
            branchName: 'main',
            isMultiSelected: isSelected,
            isMergeMode: isMergeMode
          },
          style: {
            width: nodeWidth,
            height: nodeHeight,
            minHeight: nodeHeight
          }
        };
        nodes.push(node);
        
        // Debug logging
        if (isSelected) {
          console.log(`Node ${entry.id} is selected:`, isSelected);
        }
      }
    });
    
    // 创建边连接
    history.forEach(entry => {
      if (entry.parentId && nodePositions.has(entry.parentId) && nodePositions.has(entry.id)) {
        const edge: Edge = {
          id: `${entry.parentId}-${entry.id}`,
          source: entry.parentId,
          target: entry.id,
          type: 'default',
          data: { label: '' }, // 不显示标签，因为有图例
          style: getEdgeStyle(entry.action)
        };
        edges.push(edge);
        console.log(`Created edge: ${entry.parentId} -> ${entry.id}`);
      } else if (!entry.parentId) {
        console.log(`No edge created for ${entry.id} (root node)`);
      }
    });
    
    // 为merge节点创建额外的连接
    const mergeNodes = history.filter(entry => entry.action === 'merged');
    mergeNodes.forEach(mergeNode => {
      // 找到所有叶子节点（没有子节点的节点）
      const leafNodes = history.filter(entry => {
        return !history.some(child => child.parentId === entry.id) && entry.id !== mergeNode.id;
      });
      
      // 为每个叶子节点创建到merge节点的连接
      leafNodes.forEach(leafNode => {
        if (nodePositions.has(leafNode.id) && nodePositions.has(mergeNode.id)) {
          const mergeEdge: Edge = {
            id: `${leafNode.id}-${mergeNode.id}-merge`,
            source: leafNode.id,
            target: mergeNode.id,
            type: 'default',
            data: { label: '' }, // 不显示标签，因为有图例
            style: getEdgeStyle('merged')
          };
          edges.push(mergeEdge);
          console.log(`Created merge edge: ${leafNode.id} -> ${mergeNode.id}`);
        }
      });
    });
    
    // 创建当前状态节点
    const maxLevel = Math.max(...Array.from(nodeLevels.values()));
    const currentStateNode: Node = {
      id: 'current-state',
      type: 'customNode',
      position: { x: 0, y: (maxLevel + 1) * nodeSpacing },
      data: {
        id: 'current-state',
        timestamp: new Date(),
        modifier: 'Current System',
        action: 'current',
        field: 'Current State',
        newValue: `Current state of overall evaluation criteria: "${criteriaName}"`,
        comment: 'Current active version of the evaluation framework',
        version: 'v2.5',
        changeType: 'merge_versions',
        commitHash: 'HEAD',
        branchName: 'main'
      },
      style: {
        width: nodeWidth,
        height: nodeHeight,
        minHeight: nodeHeight
      }
    };
    nodes.push(currentStateNode);
    
    // 找到最新的节点作为current的父节点
    const latestNode = history.length > 0 ? history[history.length - 1] : null;
    
    if (latestNode && nodePositions.has(latestNode.id)) {
      const currentStateEdge: Edge = {
        id: `${latestNode.id}-current-state`,
        source: latestNode.id,
        target: 'current-state',
        type: 'default',
        data: { label: '' }, // 不显示标签，因为不是 'modify' 或 'merge'
        style: { 
          stroke: '#10B981', 
          strokeWidth: 2,
          strokeDasharray: '5,5'
        }
      };
      edges.push(currentStateEdge);
      console.log(`Created current state edge: ${latestNode.id} -> current-state (latest node)`);
    }
    
    console.log('Final structure:', {
      nodesCount: nodes.length,
      edgesCount: edges.length,
      nodeIds: nodes.map(n => n.id),
      edgeIds: edges.map(e => e.id),
      nodeLevels: Object.fromEntries(nodeLevels),
      nodePositions: Object.fromEntries(nodePositions)
    });
    
    return { nodes, edges };
  };

  // Timeline view - linear progression like Git history
  const generateTimelineLayout = useCallback((history: HistoryEntry[]) => {
    if (history.length === 0) return { nodes: [], edges: [] };

    // 使用分支结构而不是简单的线性序列
    return createBranchStructureFromParentId(history);
  }, [criteriaName, isMergeMode]); // Add isMergeMode to dependencies

  // Filter nodes based on search and action filter
  const filteredHistory = useMemo(() => {
    try {
      const filtered = localHistory.filter(entry => {
        const matchesSearch = searchTerm === '' || 
          entry.modifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.field?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.comment?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesAction = filterAction === 'all' || entry.action === filterAction;
        
        return matchesSearch && matchesAction;
      });
      
      console.log('Filtered History:', {
        originalCount: localHistory.length,
        filteredCount: filtered.length,
        searchTerm,
        filterAction
      });
      
      return filtered;
    } catch (err) {
      console.error('Error filtering history data:', err);
      setError('Error filtering history data');
      return localHistory;
    }
  }, [localHistory, searchTerm, filterAction]);

  // Generate layout based on filtered data
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Generating layout with:', {
        filteredHistoryLength: filteredHistory.length,
        layoutMode: 'timeline', // Always timeline for now
        criteriaName
      });

      const layoutData = generateTimelineLayout(filteredHistory);

      console.log('Layout data generated:', {
        nodesCount: layoutData.nodes.length,
        edgesCount: layoutData.edges.length,
        nodeIds: layoutData.nodes.map(n => n.id),
        edgeIds: layoutData.edges.map(e => e.id),
        edges: layoutData.edges.map(e => `${e.source} -> ${e.target}`)
      });
      
      // 设置节点和边
      setNodes(layoutData.nodes);
      setEdges(layoutData.edges);

      console.log('All node IDs:', layoutData.nodes.map(n => n.id));
      console.log('All edge connections:', layoutData.edges.map(e => `${e.source} -> ${e.target}`));

      
      console.log('Nodes and edges set to ReactFlow state:', {
        nodesSet: layoutData.nodes.length,
        edgesSet: layoutData.edges.length,
        nodeIdsSet: layoutData.nodes.map(n => n.id),
        edgeIdsSet: layoutData.edges.map(e => e.id)
      });
      
    } catch (err) {
      console.error('Layout error:', err);
      setError('Error generating layout');
    } finally {
      setIsLoading(false);
    }
  }, [filteredHistory, generateTimelineLayout, setNodes, setEdges, selectedNodes, isMergeMode, criteriaName]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (isMergeMode) {
      // 合并模式下直接多选，不改变selectedNode，也不聚焦
      setSelectedNodes(prev => {
        const newSelected = prev.includes(node.id) 
          ? prev.filter(id => id !== node.id)
          : [...prev, node.id];
        
        console.log('Merge mode - selectedNodes updated:', {
          nodeId: node.id,
          previous: prev,
          new: newSelected
        });
        
        return newSelected;
      });
      // 在merge模式下清除聚焦
      setFocusedNode(null);
    } else {
      // 正常模式下，如果按住Ctrl键，则多选
      if (event.ctrlKey || event.metaKey) {
        setSelectedNodes(prev => {
          if (prev.includes(node.id)) {
            return prev.filter(id => id !== node.id);
          } else {
            return [...prev, node.id];
          }
        });
      } else {
        // 单击选择单个节点
        setSelectedNode(selectedNode === node.id ? null : node.id);
        setSelectedNodes([]); // 清除多选
        
        // 设置聚焦节点
        const nodeData = localHistory.find(entry => entry.id === node.id);
        setFocusedNode(nodeData || null);
      }
    }
  }, [selectedNode, isMergeMode, localHistory]);



  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterAction('all');
  }, []);

  const handleResetLayout = useCallback(() => {
    // 重新生成布局
    const layoutData = createBranchStructureFromParentId(filteredHistory);
    setNodes(layoutData.nodes);
    setEdges(layoutData.edges);
  }, [filteredHistory, setNodes, setEdges]);

  const handleCenterCurrent = useCallback(() => {
    // 居中当前选中的节点
    if (selectedNode) {
      reactFlowInstance.fitView({
        nodes: [{ id: selectedNode }],
        padding: 0.2,
        duration: 800
      });
    } else {
      // 如果没有选中的节点，则居中所有节点
      reactFlowInstance.fitView({
        padding: 0.2,
        duration: 800
      });
    }
  }, [selectedNode, reactFlowInstance]);

  const handleMergeSelectedNodes = useCallback(() => {
    if (selectedNodes.length < 2) {
      alert('Please select at least 2 nodes to merge');
      return;
    }

    // 获取选中的节点数据
    const selectedNodeData = localHistory.filter(entry => selectedNodes.includes(entry.id));
    
    // 创建合并节点
    const mergeNode: HistoryEntry = {
      id: `merge-${Date.now()}`,
      timestamp: new Date(),
      modifier: 'User',
      action: 'merged',
      field: 'Version Merge',
      oldValue: `Selected ${selectedNodes.length} versions`,
      newValue: `Merged ${selectedNodes.length} versions into new version`,
      comment: `User merged ${selectedNodes.length} selected versions: ${selectedNodeData.map(n => n.version || 'unknown').join(', ')}`,
      version: `v${Math.max(...selectedNodeData.map(n => parseInt((n.version || 'v1.0').slice(1)))) + 1}.0`,
      changeType: 'merge_versions',
      // 不设置parentId，让merge节点成为新的根节点
      summary: `Merged version combining ${selectedNodes.length} selected versions into a unified evaluation framework`,
      differenceSummary: `Combined features and criteria from ${selectedNodes.length} different versions into a comprehensive evaluation system`
    };

    // 触发合并事件
    const event = new CustomEvent('mergeVersions', {
      detail: {
        selectedNodes: selectedNodeData,
        mergeNode: mergeNode
      }
    });
    window.dispatchEvent(event);

    // 将新节点添加到本地历史记录中
    const newHistory = [...localHistory, mergeNode];
    setLocalHistory(newHistory);
    
    // 重新生成布局以显示新节点
    const layoutData = createBranchStructureFromParentId(newHistory);
    setNodes(layoutData.nodes);
    setEdges(layoutData.edges);

    // 清除选择并退出合并模式
    setSelectedNodes([]);
    setSelectedNode(null);
    setIsMergeMode(false);
  }, [selectedNodes, localHistory, setNodes, setEdges]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Overall Evaluation Criteria Version History: {criteriaName}</h2>
              <p className="text-sm text-gray-600">Git-style version tracking for the complete evaluation framework</p>
            </div>
            <div className="flex items-center space-x-4">
              {!isMergeMode ? (
                <button
                  onClick={() => setIsMergeMode(true)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                  title="Enter merge mode to select nodes"
                >
                  🔀 Merge Mode
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleMergeSelectedNodes}
                    disabled={selectedNodes.length < 2}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      selectedNodes.length >= 2 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                    title={selectedNodes.length >= 2 ? `Merge ${selectedNodes.length} selected nodes` : 'Select at least 2 nodes'}
                  >
                    ✅ Confirm ({selectedNodes.length})
                  </button>
                  <button
                    onClick={() => {
                      setIsMergeMode(false);
                      setSelectedNodes([]);
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    title="Cancel merge mode"
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}


              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Close diagram (Esc)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Panel */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by modifier, field, or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="created">Created</option>
              <option value="modified">Modified</option>
              <option value="merged">Merged</option>
              <option value="star">Star (Main)</option>
              <option value="unstared">Unstared</option>
            </select>
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setShowMiniMap(!showMiniMap)}
              className={`px-3 py-2 text-sm rounded transition-colors ${
                showMiniMap 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              🗺️ MiniMap
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-6 py-2 bg-red-50 border-b border-red-200">
            <div className="text-red-700 text-sm flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="px-6 py-4">
          <div style={{ width: '100%', height: '700px' }}>
            <ReactFlow
                key={`${nodes.length}-${edges.length}`}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ 
                  padding: 0.2,
                  minZoom: 0.3,
                  maxZoom: 0.8
                }}
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
                defaultEdgeOptions={{ 
                  type: 'default',
                  style: { stroke: '#6B7280', strokeWidth: 2 }
                }}
                onInit={(reactFlowInstance) => {
                  console.log('ReactFlow initialized with:', {
                    nodesCount: nodes.length,
                    edgesCount: edges.length,
                    nodeIds: nodes.map(n => n.id),
                    edgeIds: edges.map(e => e.id)
                  });
                }}
              >
                <Controls />
                <Background />
                {showMiniMap && <MiniMap />}
                <Panel position="top-right" className="bg-white p-2 rounded shadow">
                  <div className="text-xs text-gray-600">
                    {isLoading ? 'Loading...' : `${nodes.length} versions • ${edges.length} connections`}
                  </div>
                </Panel>
                <Panel position="bottom-left" className="bg-white p-2 rounded shadow">
                  <div className="text-xs text-gray-500">
                    <div>Esc: Close • R: Reset Layout • C: Center Node • Drag nodes to reposition</div>
                  </div>
                </Panel>
                <Panel position="top-left" className="bg-white p-3 rounded shadow">
                  <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">
                      <div className="font-medium mb-1">Node States:</div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Initial</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>Regular</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
                          <span>Main</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-indigo-300 rounded-full"></div>
                          <span>Current (Editing)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div className="font-medium mb-1">Connection Actions:</div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-0.5 bg-blue-500"></div>
                          <span>Modify</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-0.5 bg-purple-500"></div>
                          <span>Merge</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-0.5 bg-green-500" style={{ 
                            background: 'repeating-linear-gradient(to right, #10B981 0px, #10B981 2px, transparent 2px, transparent 4px)',
                            height: '2px'
                          }}></div>
                          <span>To Current (Editing Interface)</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </Panel>
                
                {/* 详情Panel */}
                {focusedNode && (
                  <Panel position="top-right" className="bg-white p-4 rounded shadow w-80">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Node Details</h3>
                      <button
                        onClick={() => setFocusedNode(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* 基本信息 */}
                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                        <div className="text-sm space-y-1">
                          <div><span className="font-medium">ID:</span> {focusedNode.id}</div>
                          <div><span className="font-medium">Version:</span> {focusedNode.version || 'N/A'}</div>
                          <div><span className="font-medium">Action:</span> {focusedNode.action}</div>
                          <div><span className="font-medium">Modifier:</span> {focusedNode.modifier}</div>
                          <div><span className="font-medium">Time:</span> {new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).format(focusedNode.timestamp)}</div>
                        </div>
                      </div>
                      
                      {/* Comment */}
                      {focusedNode.comment && (
                        <div className="bg-blue-50 p-3 rounded">
                          <h4 className="font-medium text-blue-900 mb-2">💬 Comment (User)</h4>
                          <p className="text-sm text-blue-800">{focusedNode.comment}</p>
                        </div>
                      )}
                      
                      {/* AI Version Summary Placeholder */}
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <div className="flex items-center space-x-1 mb-2">
                          <span className="text-green-600">📋</span>
                          <h4 className="font-medium text-green-900">Version Summary</h4>
                        </div>
                        <div className="text-green-600 text-sm">
                          {focusedNode.summary ? focusedNode.summary : "AI will generate version summary..."}
                        </div>
                      </div>
                      
                      {/* Changes Placeholder */}
                      <div className="bg-orange-50 p-3 rounded border border-orange-200">
                        <div className="flex items-center space-x-1 mb-2">
                          <span className="text-orange-600">📝</span>
                          <h4 className="font-medium text-orange-900">Changes</h4>
                        </div>
                        <div className="text-orange-600 text-sm">
                          {focusedNode.differenceSummary ? focusedNode.differenceSummary : "e.g. +1 Communication criteria, Modified Safety description, Changed Theory category..."}
                        </div>
                      </div>
                    </div>
                  </Panel>
                )}
              </ReactFlow>
            </div>
          </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Showing {filteredHistory.length} of {localHistory.length} versions • Vertical Timeline layout
            </div>
            <div className="flex space-x-4 text-xs text-gray-500">
              <span>✨ Created</span>
              <span>✏️ Modified</span>
              <span>🔀 Merged</span>
              <span>⭐ Star (Main)</span>
              <span>🌟 Unstared</span>
              <span>🎯 Current</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            💡 Tip: Click nodes to view details in floating panel • All connections are solid with arrows • Only connections to Current are dashed • Drag nodes to adjust positions • 📋 AI Version Summary • 📝 Changes
          </div>
        </div>

        {/* Keyboard shortcuts handler */}
        <KeyboardShortcuts 
          onClose={onClose}
          onResetLayout={handleResetLayout}
          onCenterCurrent={handleCenterCurrent}
        />
      </div>
    </div>
  );
}

export default function ReactFlowBranchDiagram(props: ReactFlowBranchDiagramProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowBranchDiagramContent {...props} />
    </ReactFlowProvider>
  );
} 