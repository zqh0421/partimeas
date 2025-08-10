'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/icons';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // 自动跳转到 workshop-assistant
    router.replace('/workshop-assistant');
  }, [router]);

  // 显示加载状态，防止闪烁
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-gray-600">Loading ...</p>
      </div>
    </div>
  );
}