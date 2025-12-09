import { Skeleton } from "@/components/ui/skeleton";

export function MessageListSkeleton() {
	return (
		<div className="space-y-6 p-4">
			{/* ユーザーメッセージのスケルトン */}
			<div className="flex items-start gap-3">
				<Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
				<div className="space-y-2 flex-1">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-16 w-full" />
				</div>
			</div>

			{/* アシスタントメッセージのスケルトン */}
			<div className="flex items-start gap-3">
				<Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
				<div className="space-y-2 flex-1">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</div>
			</div>

			{/* ユーザーメッセージのスケルトン */}
			<div className="flex items-start gap-3">
				<Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
				<div className="space-y-2 flex-1">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-12 w-full" />
				</div>
			</div>

			{/* アシスタントメッセージのスケルトン */}
			<div className="flex items-start gap-3">
				<Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
				<div className="space-y-2 flex-1">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-4 w-2/3" />
					<Skeleton className="h-4 w-1/2" />
				</div>
			</div>
		</div>
	);
}
