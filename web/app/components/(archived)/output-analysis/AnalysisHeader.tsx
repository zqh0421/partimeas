import { useRouter } from "next/navigation";
import { AnalysisStep } from "@/app/types";

interface AnalysisHeaderProps {
  currentStep: AnalysisStep;
}

export default function AnalysisHeader({ currentStep }: AnalysisHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/")}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Output Analysis
            </h1>
          </div>

          {/* Progress Steps */}
          <div className="flex space-x-4">
            <div
              className={`flex items-center space-x-2 ${
                currentStep === "sync" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "sync"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Load</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                currentStep === "run" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "run"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Run</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                currentStep === "outcomes" ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "outcomes"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
