"use client";

import { useState, useEffect } from "react";
import { IdealModelResponse } from "@/app/types";

export function useIdealResponses() {
  const [idealResponses, setIdealResponses] = useState<IdealModelResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdealResponses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/ideal-responses");
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "API returned unsuccessful response");
        }
        
        setIdealResponses(data.idealResponses || []);
      } catch (err) {
        console.error("Error fetching ideal responses:", err);
        setError(err instanceof Error ? err.message : "Failed to load ideal responses");
      } finally {
        setLoading(false);
      }
    };

    fetchIdealResponses();
  }, []);

  return { idealResponses, loading, error };
}