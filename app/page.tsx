import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Rubric Refiner
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create and refine rubrics for evaluating LLM output quality
          </p>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/rubric"
          >
            🎯 Start Rubric Builder
          </Link>
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-600 text-white gap-2 hover:bg-green-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/comparison"
          >
            🔍 Model Comparison
          </Link>
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-purple-600 text-white gap-2 hover:bg-purple-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/dynamic-comparison"
          >
            ⚡ Dynamic Comparison
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">System Setup</h3>
            <p className="text-gray-600 text-sm">
              Configure system prompts and evaluation criteria for consistent LLM assessment.
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Rubric Items</h3>
            <p className="text-gray-600 text-sm">
              Define 1-5 scale criteria with detailed descriptions for each evaluation level.
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Cases</h3>
            <p className="text-gray-600 text-sm">
              Add input examples and test cases to validate your rubric against real scenarios.
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Model Comparison</h3>
            <p className="text-gray-600 text-sm">
              Compare different AI models side-by-side with structured feedback collection.
            </p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Features</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Multi-provider API support (OpenAI, Anthropic, Google)</li>
            <li>• Rubric versioning and export capabilities</li>
            <li>• Secure API key management</li>
            <li>• Real-time rubric validation</li>
            <li>• Modern, responsive interface</li>
          </ul>
        </div>
      </main>
      
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="/rubric"
        >
          🎯 Rubric Builder
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/your-repo/rubric-refiner"
          target="_blank"
          rel="noopener noreferrer"
        >
          📖 Documentation
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/your-repo/rubric-refiner/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          🐛 Report Issues
        </a>
      </footer>
    </div>
  );
}
