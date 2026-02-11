import { LoadingSpinner } from "@/components/icons";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-gray-600">Loading ...</p>
      </div>
    </div>
  );
}
