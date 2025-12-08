"use client";

import { Bot } from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConversationSummary } from "@/lib/sse-client";
import { ConversationList } from "./ConversationList";
import { NewConversationButton } from "./NewConversationButton";

interface AppSidebarProps {
	conversations: ConversationSummary[];
	activeConversationId: string | null;
	isLoading: boolean;
	onSelectConversation: (id: string) => void;
	onNewConversation: () => void;
	onDeleteConversation: (id: string) => Promise<void>;
	onUpdateTitle: (id: string, title: string) => Promise<void>;
}

export function AppSidebar({
	conversations,
	activeConversationId,
	isLoading,
	onSelectConversation,
	onNewConversation,
	onDeleteConversation,
	onUpdateTitle,
}: AppSidebarProps) {
	return (
		<Sidebar>
			<SidebarHeader className="border-b">
				<div className="flex items-center gap-2 px-2 py-2">
					<Bot className="h-6 w-6 text-primary" />
					<span className="font-semibold">AI Chat</span>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<div className="px-2 py-2">
						<NewConversationButton
							onClick={onNewConversation}
							disabled={isLoading}
						/>
					</div>
				</SidebarGroup>

				<SidebarGroup className="flex-1">
					<SidebarGroupLabel>会話履歴</SidebarGroupLabel>
					<SidebarGroupContent>
						{isLoading ? (
							<div className="space-y-2 px-2">
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
								<Skeleton className="h-8 w-full" />
							</div>
						) : (
							<ConversationList
								conversations={conversations}
								activeId={activeConversationId}
								onSelect={onSelectConversation}
								onDelete={onDeleteConversation}
								onUpdateTitle={onUpdateTitle}
							/>
						)}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t">
				<div className="px-4 py-2 text-xs text-muted-foreground">
					Powered by Claude
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
