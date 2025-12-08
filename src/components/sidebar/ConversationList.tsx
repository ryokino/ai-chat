"use client";

import { SidebarMenu } from "@/components/ui/sidebar";
import type { ConversationSummary } from "@/lib/sse-client";
import { ConversationItem } from "./ConversationItem";

interface ConversationListProps {
	conversations: ConversationSummary[];
	activeId: string | null;
	onSelect: (id: string) => void;
	onDelete: (id: string) => Promise<void>;
	onUpdateTitle: (id: string, title: string) => Promise<void>;
}

export function ConversationList({
	conversations,
	activeId,
	onSelect,
	onDelete,
	onUpdateTitle,
}: ConversationListProps) {
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
