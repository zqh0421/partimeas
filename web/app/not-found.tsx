"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/app/components/icons";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/workshop-assistant");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-gray-600">Loading ...</p>
      </div>
    </div>
  );
}
