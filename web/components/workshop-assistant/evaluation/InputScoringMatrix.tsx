"use client";

import React from "react";
import { Tooltip } from "antd";
import { ChevronDownIcon, InfoIcon } from "@/components/icons";
import InputScoringTooltipContent from "@/components/workshop-assistant/evaluation/InputScoringTooltipContent";
import { PointOption, PointValue } from "@/utils/sessionScoreCache";

type RubricItem = {
  id: string;
  name: string;
  num: number;
};

type ResponseOption = { id: string; label: string };

type ScoreData = {
  score: number;
  rationale: string;
  subscores?: Array<{ score: number; rationale: string }>;
};

interface InputScoringMatrixProps {
  rubricItems: RubricItem[];
  responses: ResponseOption[];
  scores: PointOption;
  rationales: Record<string, Record<string, string>>;
  aiScores: Record<string, Record<string, ScoreData>>;
  isComparingMode: boolean;
  currentIdealResponseId?: string;
  idealScores: PointValue;
  idealPoints: number[];
  handleScoreChange: (rubricId: string, responseId: string, value: number) => void;
  handleRationaleChange: (rubricId: string, responseId: string, value: string) => void;
  handleIdealScoreChange: (criteriaId: string, newScore: number) => void;
  autoResize: (el: HTMLTextAreaElement | null) => void;
  getMatchingSubscoreRationale: (rubricId: string, responseId: string) => string | null;
}

export default function InputScoringMatrix({
  rubricItems,
  responses,
  scores,
  rationales,
  aiScores,
  isComparingMode,
  currentIdealResponseId,
  idealScores,
  idealPoints,
  handleScoreChange,
  handleRationaleChange,
  handleIdealScoreChange,
  autoResize,
  getMatchingSubscoreRationale,
}: InputScoringMatrixProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 text-center">
          <tr>
            <th className="px-2 pt-4 pb-2 text-sm font-bold text-gray-700 w-10 border-x border-gray-200">Num</th>
            <th className="px-4 pt-4 pb-2 text-sm font-bold text-gray-700  w-[15vw] border-x border-gray-200">Assertion Name</th>
            {responses.map((resp) => (
              <th key={resp.id} colSpan={2} className="px-4 pt-4 pb-2 text-center text-sm font-bold text-gray-700 border-x border-gray-200">
                {resp.label}
              </th>
            ))}
            <th className="px-4 pt-4 pb-2  text-sm font-bold text-gray-700 border-x border-gray-200 w-28 whitespace-nowrap">Ideal Response</th>
          </tr>
          <tr>
            <th className="px-2 py-2 border-x border-gray-200" />
            <th className="px-4 py-2 border-x border-gray-200" />
            {responses.map((resp) => (
              <React.Fragment key={`${resp.id}-subheaders`}>
                <th className=" pb-2 pt-1 text-sm font-medium text-gray-700 text-center border-x border-gray-200 w-10">Point</th>
                <th className=" pb-2 pt-1 text-sm font-medium text-gray-700 text-center border-x border-gray-200 w-[14vw]">Rationale</th>
              </React.Fragment>
            ))}
            <th className=" pb-2 pt-1 text-sm font-medium text-gray-700 text-center border-x border-gray-200 w-10">Point</th>
          </tr>
        </thead>
        <tbody>
          {rubricItems.map((r, rowIdx) => (
            <tr key={r.id} className="border-t border-gray-200 align-top">
              <td className="px-2 py-3 text-sm text-gray-700 text-center border-x border-gray-200">{r.num}</td>
              <td className="px-4 py-3 text-sm text-gray-900 border-x border-gray-200">
                <p>{r.name}</p>
              </td>
              {responses.map((resp) => (
                <React.Fragment key={resp.id}>
                  <td className="px-4 py-3 align-top border-x border-gray-200">
                    <div className="relative w-16">
                      <select
                        className={`w-16 h-10 px-3 py-2 pr-8 border rounded-lg text-sm font-medium text-center transition-all duration-200 appearance-none ${
                          isComparingMode
                            ? `cursor-not-allowed ${
                                aiScores[r.id]?.[resp.id] !== undefined &&
                                scores[r.id]?.[resp.id] !== undefined &&
                                Number(scores[r.id][resp.id]) !==
                                  Number(aiScores[r.id][resp.id].score)
                                  ? "border-red-300 bg-red-50 text-red-700"
                                  : "border-gray-200 bg-white text-gray-700"
                              }`
                            : "shadow-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer border-gray-300 text-gray-700"
                        }`}
                        value={(scores[r.id] && scores[r.id][resp.id]) ?? 0}
                        disabled={isComparingMode}
                        onChange={(e) => handleScoreChange(r.id, resp.id, Number(e.target.value))}
                      >
                        {Array.from(
                          { length: Math.max(0, Number(idealPoints[rowIdx] ?? 0)) + 1 },
                          (_, i) => i,
                        ).map((val) => (
                          <option key={val} value={val} className="text-gray-700 font-medium">
                            {val}
                          </option>
                        ))}
                      </select>
                      {!isComparingMode && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top border-x border-gray-200">
                    <div className="flex items-start gap-2">
                      <textarea
                        className={`w-[15vw] px-3 py-2 border rounded-md text-sm transition-all duration-200 ${
                          isComparingMode
                            ? "border-gray-200 bg-white text-gray-700"
                            : "border-gray-300 shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                        }`}
                        placeholder="Your rationale"
                        rows={1}
                        disabled={isComparingMode}
                        value={(rationales[r.id] && rationales[r.id][resp.id]) ?? ""}
                        onChange={(e) => {
                          handleRationaleChange(r.id, resp.id, e.target.value);
                          autoResize(e.currentTarget);
                        }}
                        onInput={(e) => autoResize(e.currentTarget)}
                        ref={(el) => autoResize(el)}
                        style={{ overflow: "hidden", resize: "none" }}
                      />
                      {isComparingMode && aiScores[r.id]?.[resp.id] && (
                        <Tooltip
                          title={
                            <InputScoringTooltipContent
                              rubricId={r.id}
                              responseId={resp.id}
                              aiScores={aiScores}
                              getMatchingSubscoreRationale={getMatchingSubscoreRationale}
                            />
                          }
                          placement="top"
                          arrow={true}
                          getPopupContainer={(node) => node.parentElement || document.body}
                          autoAdjustOverflow={true}
                        >
                          <div className="mt-2 cursor-help inline-block">
                            <InfoIcon className="w-4 h-4 text-blue-500 hover:text-blue-700 transition-colors" />
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </React.Fragment>
              ))}
              <td className="px-4 py-3 align-top border-x border-gray-200">
                <div className="relative w-16">
                  <select
                    className={`w-16 h-10 px-3 py-2 pr-8 border rounded-lg text-sm font-medium text-center transition-all duration-200 appearance-none ${
                      isComparingMode
                        ? `cursor-not-allowed ${
                            currentIdealResponseId &&
                            aiScores[r.id]?.[currentIdealResponseId] !== undefined &&
                            Number(
                              idealScores[r.id] !== undefined
                                ? idealScores[r.id]
                                : idealPoints[rowIdx],
                            ) !== Number(aiScores[r.id][currentIdealResponseId].score)
                              ? "border-red-300 bg-red-50 text-red-700"
                              : "border-gray-200 bg-white text-gray-700"
                          }`
                        : "shadow-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer border-gray-300 text-gray-700"
                    }`}
                    value={
                      idealScores[r.id] !== undefined
                        ? idealScores[r.id]
                        : idealPoints[rowIdx] !== undefined
                          ? idealPoints[rowIdx]
                          : 0
                    }
                    disabled={isComparingMode}
                    onChange={(e) => handleIdealScoreChange(r.id, Number(e.target.value))}
                  >
                    {Array.from(
                      { length: Math.max(0, Number(idealPoints[rowIdx] ?? 0)) + 1 },
                      (_, i) => i,
                    ).map((val) => (
                      <option key={val} value={val} className="text-gray-700 font-medium">
                        {val}
                      </option>
                    ))}
                  </select>
                  {!isComparingMode && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
