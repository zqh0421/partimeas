import { useState, useCallback, useRef, useEffect } from 'react';

interface StreamMessage {
  type: 'modelOutput' | 'modelChunk' | 'complete' | 'error';
  modelId?: string;
  output?: string;
  chunk?: string;
  isLastChunk?: boolean;
  sessionId?: string;
  timestamp: string;
  error?: string;
}

interface ModelOutput {
  modelId: string;
  output: string;
  timestamp: string;
}

interface UseStreamingGenerationReturn {
  modelOutputs: ModelOutput[];
  errors: Array<{ modelId: string; error: string; timestamp: string }>;
  isStreaming: boolean;
  isComplete: boolean;
  sessionId: string | null;
  startStreaming: (testCase: any, groupId?: string) => Promise<void>;
  resetStream: () => void;
}

export const useStreamingGeneration = (): UseStreamingGenerationReturn => {
  const [modelOutputs, setModelOutputs] = useState<ModelOutput[]>([]);
  const [errors, setErrors] = useState<Array<{ modelId: string; error: string; timestamp: string }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Track partial outputs for each model as chunks arrive
  const partialOutputsRef = useRef<Map<string, string>>(new Map());

  const resetStream = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset state
    setModelOutputs([]);
    setErrors([]);
    setIsStreaming(false);
    setIsComplete(false);
    setSessionId(null);
    
    // Clear partial outputs
    partialOutputsRef.current.clear();
  }, []);

  const startStreaming = useCallback(async (testCase: any, groupId?: string) => {
    try {
      // Reset previous state
      resetStream();
      
      setIsStreaming(true);
      setIsComplete(false);

      console.log('🚀 Starting streaming generation...', { testCase, groupId });

      // Create abort controller for cleanup
      abortControllerRef.current = new AbortController();

      // Make the POST request to start streaming
      const response = await fetch('/api/model-evaluation/stream-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testCase,
          groupId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      // Create a reader for the response stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('🏁 Stream completed');
            break;
          }

          // Decode the chunk and split by lines
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const messageData = line.substring(6); // Remove 'data: ' prefix
                if (messageData.trim()) {
                  const message: StreamMessage = JSON.parse(messageData);
                  
                  console.log('📨 Received stream message:', message);

                  switch (message.type) {
                    case 'modelChunk':
                      if (message.modelId && message.chunk !== undefined) {
                        // Accumulate chunks for this model (no extra spaces - the model provides proper formatting)
                        const currentOutput = partialOutputsRef.current.get(message.modelId) || '';
                        const updatedOutput = currentOutput + message.chunk;
                        partialOutputsRef.current.set(message.modelId, updatedOutput);
                        
                        // Update or create the model output with accumulated text
                        setModelOutputs(prev => {
                          const existingIndex = prev.findIndex(m => m.modelId === message.modelId);
                          if (existingIndex >= 0) {
                            // Update existing output
                            const updated = [...prev];
                            updated[existingIndex] = {
                              ...updated[existingIndex],
                              output: updatedOutput,
                              timestamp: message.timestamp,
                            };
                            return updated;
                          } else {
                            // Add new output
                            return [...prev, {
                              modelId: message.modelId!,
                              output: updatedOutput,
                              timestamp: message.timestamp,
                            }];
                          }
                        });
                      }
                      break;

                    case 'modelOutput':
                      if (message.modelId && message.output) {
                        // Full output received (fallback for non-chunked responses)
                        partialOutputsRef.current.set(message.modelId, message.output);
                        
                        setModelOutputs(prev => {
                          const existingIndex = prev.findIndex(m => m.modelId === message.modelId);
                          if (existingIndex >= 0) {
                            // Update existing output with final version
                            const updated = [...prev];
                            updated[existingIndex] = {
                              ...updated[existingIndex],
                              output: message.output!,
                              timestamp: message.timestamp,
                            };
                            return updated;
                          } else {
                            // Add new output
                            return [...prev, {
                              modelId: message.modelId!,
                              output: message.output!,
                              timestamp: message.timestamp,
                            }];
                          }
                        });
                      }
                      break;

                    case 'error':
                      if (message.modelId && message.error) {
                        setErrors(prev => [...prev, {
                          modelId: message.modelId!,
                          error: message.error!,
                          timestamp: message.timestamp,
                        }]);
                      }
                      break;

                    case 'complete':
                      console.log('✅ Stream generation complete');
                      if (message.sessionId) {
                        console.log(`📝 Session ID received: ${message.sessionId}`);
                        setSessionId(message.sessionId);
                      }
                      setIsComplete(true);
                      setIsStreaming(false);
                      return;

                    default:
                      console.warn('Unknown message type:', message.type);
                  }
                }
              } catch (parseError) {
                console.error('Error parsing stream message:', parseError, 'Raw line:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('❌ Streaming generation error:', error);
      
      // Check if error is due to abort (user cancelled)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🛑 Streaming cancelled by user');
      } else {
        // Add error to state for UI display
        setErrors(prev => [...prev, {
          modelId: 'system',
          error: error instanceof Error ? error.message : 'Unknown streaming error',
          timestamp: new Date().toISOString(),
        }]);
      }
      
      setIsStreaming(false);
      setIsComplete(true);
    }
  }, [resetStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetStream();
    };
  }, [resetStream]);

  return {
    modelOutputs,
    errors,
    isStreaming,
    isComplete,
    sessionId,
    startStreaming,
    resetStream,
  };
};

export default useStreamingGeneration;