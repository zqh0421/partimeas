'use client';

import Link from 'next/link';

export default function AnalysisHeaderFull() {

  return (
    <div className="bg-white shadow-sm shadow-slate-300 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl text-slate-600">PartiMeas Workshop Assistant</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin" 
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 