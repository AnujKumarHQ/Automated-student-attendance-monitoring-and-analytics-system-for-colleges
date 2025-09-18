export default function Loading() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="mt-6 space-y-2 px-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
        </div>
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
