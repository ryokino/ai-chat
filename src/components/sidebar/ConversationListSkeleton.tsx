import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function ConversationListSkeleton() {
	return (
		<SidebarMenu>
			{Array.from({ length: 5 }).map((_, i) => (
				<SidebarMenuItem key={i} className="px-2">
					<div className="flex items-center gap-2 py-2">
						<Skeleton className="h-4 w-4 rounded-full" />
						<Skeleton className="h-4 flex-1" />
					</div>
				</SidebarMenuItem>
			))}
		</SidebarMenu>
	);
}
