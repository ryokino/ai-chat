"use client";

import { useConversation } from "@/components/ConversationProvider";
import { useSession } from "@/components/SessionProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChat } from "@/hooks/useChat";
import { useSettings } from "@/hooks/useSettings";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

interface ChatWindowProps {
	title?: string;
}

export function ChatWindow({ title = "AI Chat" }: ChatWindowProps) {
	const { sessionId, isLoading: isSessionLoading } = useSession();
	const {
		activeConversationId,
		setActiveConversationId,
		refetch: refetchConversations,
	} = useConversation();
	const { settings, isLoaded: isSettingsLoaded } = useSettings();

	const {
		messages,
		isLoading,
		error,
		sendMessage,
		editMessage,
		regenerateMessage,
		clearError,
		isInitialLoading,
	} = useChat({
		sessionId: sessionId || "",
		conversationId: activeConversationId,
		settings: isSettingsLoaded ? settings : undefined,
		sessionLoading: isSessionLoading,
		onError: (err) => {
			console.error("Chat error:", err);
		},
		onNewConversation: (newConversationId) => {
			setActiveConversationId(newConversationId);
			refetchConversations();
		},
		onTitleGenerated: () => {
			// タイトル生成後に会話一覧を更新
			refetchConversations();
		},
	});

	// セッション読み込み中
	if (isSessionLoading) {
		return (
			<Card className="flex h-full flex-col">
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-1 items-center justify-center">
					<p className="text-muted-foreground">セッション初期化中...</p>
				</CardContent>
			</Card>
		);
	}

	// 会話履歴読み込み中
	if (isInitialLoading) {
		return (
			<Card className="flex h-full flex-col">
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-1 items-center justify-center">
					<p className="text-muted-foreground">会話履歴を読み込み中...</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="border-b shrink-0">
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col p-0 overflow-hidden relative">
				<div className="flex-1 overflow-hidden">
					<MessageList
						messages={messages}
						className="h-full pb-[120px]"
						isLoading={isLoading}
						onEditMessage={editMessage}
						onRegenerateMessage={regenerateMessage}
					/>
				</div>
				{error && (
					<div className="px-4 py-2 text-sm text-destructive bg-destructive/10 flex items-center justify-between absolute bottom-[120px] left-0 right-0">
						<span>{error}</span>
						<button
							type="button"
							onClick={clearError}
							className="ml-2 underline hover:no-underline"
						>
							閉じる
						</button>
					</div>
				)}
				<div className="absolute bottom-0 left-0 right-0 bg-background border-t">
					<MessageInput
						onSend={sendMessage}
						disabled={isLoading || !sessionId}
						placeholder={
							isLoading ? "送信中..." : "メッセージを入力してください"
						}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
