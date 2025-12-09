"use client";

import { SidebarMenu } from "@/components/ui/sidebar";
import type { ConversationSummary } from "@/lib/sse-client";
import { ConversationItem } from "./ConversationItem";
import { ConversationListSkeleton } from "./ConversationListSkeleton";

interface ConversationListProps {
	conversations: ConversationSummary[];
	activeId: string | null;
	onSelect: (id: string) => void;
	onDelete: (id: string) => Promise<void>;
	onUpdateTitle: (id: string, title: string) => Promise<void>;
	isLoading?: boolean;
}

export function ConversationList({
	conversations,
	activeId,
	onSelect,
	onDelete,
	onUpdateTitle,
	isLoading = false,
}: ConversationListProps) {
	if (isLoading) {
		return <ConversationListSkeleton />;
	}

	if (conversations.length === 0) {
		return (
			<div className="px-4 py-8 text-center text-sm text-muted-foreground">
				会話がありません。
				<br />
				新しい会話を始めましょう。
			</div>
		);
	}

	return (
		<SidebarMenu>
			{conversations.map((conversation) => (
				<ConversationItem
					key={conversation.id}
					conversation={conversation}
					isActive={activeId === conversation.id}
					onSelect={() => onSelect(conversation.id)}
					onDelete={() => onDelete(conversation.id)}
					onUpdateTitle={(title) => onUpdateTitle(conversation.id, title)}
				/>
			))}
		</SidebarMenu>
	);
}
