"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/app/components/icons";
import "@ant-design/v5-patch-for-react-19";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import { unstableSetRender } from "antd";

declare global {
  interface Element {
    _reactRoot?: Root;
  }
  interface DocumentFragment {
    _reactRoot?: Root;
  }
}

unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/workshop-assistant");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
