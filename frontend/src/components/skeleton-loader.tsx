export function LectureCardSkeleton() {
    return (
        <div className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
                    <div className="flex gap-3">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-9 bg-gray-200 rounded w-16"></div>
                    <div className="h-9 bg-gray-200 rounded w-16"></div>
                </div>
            </div>
        </div>
    );
}

export function TranscriptSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-6 bg-gray-200 rounded w-12 shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TopicSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex gap-3">
                        <div className="h-6 w-6 bg-gray-200 rounded-full shrink-0"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}