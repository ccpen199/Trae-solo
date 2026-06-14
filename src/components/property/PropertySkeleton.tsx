interface PropertySkeletonProps {
  count?: number;
}

export const PropertySkeleton = ({ count = 6 }: PropertySkeletonProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
        >
          <div className="relative">
            <div className="w-full h-48 bg-gray-200 animate-pulse" />
            <div className="absolute top-3 left-3 flex gap-1.5">
              <div className="w-10 h-6 bg-gray-300 rounded animate-pulse" />
              <div className="w-14 h-6 bg-gray-300 rounded animate-pulse" />
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
              <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />

            <div className="flex items-baseline gap-2">
              <div className="h-7 bg-gray-200 rounded animate-pulse w-20" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
            </div>

            <div className="flex items-center gap-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
              <div className="w-px h-4 bg-gray-200" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
              <div className="w-px h-4 bg-gray-200" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-8" />
            </div>

            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
            </div>

            <div className="flex gap-1">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-16" />
              <div className="h-5 bg-gray-200 rounded animate-pulse w-16" />
              <div className="h-5 bg-gray-200 rounded animate-pulse w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
