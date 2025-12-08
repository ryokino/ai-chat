import { nanoid } from "nanoid";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { MessageProps } from "@/components/chat/Message";
import {
	fetchConversation,
	generateConversationTitle,
	sendChatMessage,
} from "@/lib/sse-client";

export interface UseChatOptions {
	sessionId: string;
	conversationId: string | null;
	onError?: (error: Error) => void;
	onNewConversation?: (conversationId: string) => void;
	onTitleGenerated?: () => void;
}

export interface UseChatReturn {
	messages: MessageProps[];
	isLoading: boolean;
	error: string | null;
	sendMessage: (content: string) => Promise<void>;
	clearError: () => void;
	isInitialLoading: boolean;
	clearMessages: () => void;
}

/**
 * チャット機能のカスタムフック
 * メッセージの送受信、会話履歴の読み込みを管理
 */
export function useChat({
	sessionId,
	conversationId,
	onError,
	onNewConversation,
	onTitleGenerated,
}: UseChatOptions): UseChatReturn {
	const [messages, setMessages] = useState<MessageProps[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 会話履歴を取得
	useEffect(() => {
		if (!sessionId || !conversationId) {
			setMessages([]);
			setIsInitialLoading(false);
			return;
		}

		const loadHistory = async () => {
			try {
				setIsInitialLoading(true);
				const data = await fetchConversation(conversationId, sessionId);

				if (data.messages && Array.isArray(data.messages)) {
					const loadedMessages: MessageProps[] = data.messages.map(
						(msg: {
							id: string;
							role: string;
							content: string;
							createdAt: string;
						}) => ({
							id: msg.id,
							sender: msg.role as "user" | "assistant",
							content: msg.content,
							createdAt: new Date(msg.createdAt),
						}),
					);
					setMessages(loadedMessages);
				}
			} catch (err) {
				console.error("Failed to load conversation history:", err);
				// 履歴の読み込み失敗は致命的ではないので、エラーは表示しない
			} finally {
				setIsInitialLoading(false);
			}
		};

		loadHistory();
	}, [sessionId, conversationId]);

	const clearMessages = useCallback(() => {
		setMessages([]);
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const sendMessage = useCallback(
		async (content: string) => {
			if (!sessionId || isLoading || !content.trim()) return;

			const userMessage: MessageProps = {
				id: nanoid(),
				sender: "user",
				content: content.trim(),
				createdAt: new Date(),
			};

			// ユーザーメッセージを即座に表示
			setMessages((prev) => [...prev, userMessage]);
			setIsLoading(true);
			setError(null);

			const assistantMessageId = nanoid();
			let assistantContent = "";

			try {
				// アシスタントメッセージの枠を追加
				setMessages((prev) => [
					...prev,
					{
						id: assistantMessageId,
						sender: "assistant",
						content: "",
						createdAt: new Date(),
					},
				]);

				// SSEストリーミングでメッセージを送信
				await sendChatMessage(content.trim(), sessionId, conversationId, {
					onMessage: (data: string) => {
						try {
							const parsed = JSON.parse(data);
							if (parsed.content) {
								assistantContent += parsed.content;
								setMessages((prev) =>
									prev.map((msg) =>
										msg.id === assistantMessageId
											? { ...msg, content: assistantContent }
											: msg,
									),
								);
							}

							if (parsed.error) {
								throw new Error(parsed.error);
							}
						} catch (parseError) {
							console.error("Error parsing SSE data:", parseError);
						}
					},
					onConversationInfo: async (info) => {
						// 新しい会話が作成された場合、コールバックを呼ぶ
						if (info.isNewConversation && onNewConversation) {
							onNewConversation(info.conversationId);

							// タイトルを自動生成
							try {
								await generateConversationTitle(info.conversationId, sessionId);
								onTitleGenerated?.();
							} catch (titleErr) {
								console.error("Failed to generate title:", titleErr);
								// タイトル生成の失敗は致命的ではないのでエラーを表示しない
							}
						}
					},
					onError: (err: Error) => {
						console.error("SSE stream error:", err);
						const errorMessage =
							err.message || "メッセージの送信に失敗しました";
						setError(errorMessage);
						toast.error("エラーが発生しました", {
							description: errorMessage,
						});
						onError?.(err);

						// エラー時はアシスタントメッセージを削除
						setMessages((prev) =>
							prev.filter((msg) => msg.id !== assistantMessageId),
						);
					},
					onComplete: () => {
						console.log("Message streaming completed");
					},
				});
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "エラーが発生しました";
				setError(errorMessage);
				toast.error("エラーが発生しました", {
					description: errorMessage,
				});
				onError?.(
					err instanceof Error ? err : new Error("Unknown error occurred"),
				);

				// エラー時はアシスタントメッセージを削除
				setMessages((prev) =>
					prev.filter((msg) => msg.id !== assistantMessageId),
				);
			} finally {
				setIsLoading(false);
			}
		},
		[
			sessionId,
			conversationId,
			isLoading,
			onError,
			onNewConversation,
			onTitleGenerated,
		],
	);

	return {
		messages,
		isLoading,
		error,
		sendMessage,
		clearError,
		isInitialLoading,
		clearMessages,
	};
}
