'use client';
import { Suspense } from 'react';
import { LoadingState } from '@/components';

export default function WorkshopAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingState message="Loading..." size="lg" />}>
      {children}
    </Suspense>
  );
} 