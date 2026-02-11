"use client";

import React, { useState } from "react";

type Subscore = { score: number; rationale: string };

type ScoreData = {
  score: number;
  rationale: string;
  subscores?: Subscore[];
};

interface InputScoringTooltipContentProps {
  rubricId: string;
  responseId: string;
  aiScores: Record<string, Record<string, ScoreData>>;
  getMatchingSubscoreRationale: (
    rubricId: string,
    responseId: string,
  ) => string | null;
}

export default function InputScoringTooltipContent({
  rubricId,
  responseId,
  aiScores,
  getMatchingSubscoreRationale,
}: InputScoringTooltipContentProps) {
  const [showAllSubscores, setShowAllSubscores] = useState(false);
  const scoreData = aiScores[rubricId]?.[responseId];

  if (!scoreData) {
    return null;
  }

  if (!showAllSubscores) {
    const rationale = getMatchingSubscoreRationale(rubricId, responseId);
    if (!rationale) {
      return <div>No subscore rationale available</div>;
    }

    return (
      <div style={{ position: "relative", maxWidth: "668px", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
            borderBottom: "1px solid #e5e5e5",
            paddingBottom: "8px",
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            AI Evaluation (Final Score: {scoreData.score})
          </div>
          {scoreData.subscores && scoreData.subscores.length > 1 && (
            <button
              onClick={() => setShowAllSubscores(true)}
              style={{
                padding: "2px 6px",
                fontSize: "11px",
                background: "#4096ff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Show All ({scoreData.subscores.length})
            </button>
          )}
        </div>
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          <span className="font-semibold">Featured Rationale: </span>
          {rationale}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", maxWidth: "668px", width: "100%" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "transparent",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
          borderBottom: "1px solid #d9d9d9",
          paddingBottom: "8px",
          zIndex: 1,
        }}
      >
        <div style={{ fontWeight: "bold", color: "white" }}>
          All Subscores (Final Score: {scoreData.score})
        </div>
        <button
          onClick={() => setShowAllSubscores(false)}
          style={{
            padding: "2px 6px",
            fontSize: "11px",
            background: "#595959",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Show Single
        </button>
      </div>
      <div style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
        {scoreData.subscores?.map((subscore, index) => (
          <div
            key={index}
            style={{
              marginBottom: "8px",
              padding: "8px",
              background: "#2a2a2a",
              borderRadius: "4px",
              border: "1px solid #3a3a3a",
            }}
          >
            <div
              style={{
                fontWeight: "700",
                marginBottom: "4px",
                fontSize: "14px",
                color: subscore.score === scoreData.score ? "#52c41a" : "#f5222d",
              }}
            >
              AI Grader {index + 1} (Score: {subscore.score})
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "14px",
                color: "#f0f0f0",
                lineHeight: "1.5",
              }}
            >
              {subscore.rationale || "No rationale provided"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
