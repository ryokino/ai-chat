"use client";

import { nanoid } from "nanoid";
import { useCallback, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MessageProps } from "./Message";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

interface ChatWindowProps {
	title?: string;
}

export function ChatWindow({ title = "AI Chat" }: ChatWindowProps) {
	const { sessionId, isLoading: isSessionLoading } = useSession();
	const [messages, setMessages] = useState<MessageProps[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSendMessage = useCallback(
		async (content: string) => {
			if (!sessionId || isLoading) return;

			const userMessage: MessageProps = {
				id: nanoid(),
				role: "user",
				content,
				createdAt: new Date(),
			};

			setMessages((prev) => [...prev, userMessage]);
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch("/api/chat", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						message: content,
						sessionId,
					}),
				});

				if (!response.ok) {
					throw new Error("メッセージの送信に失敗しました");
				}

				const reader = response.body?.getReader();
				if (!reader) {
					throw new Error("レスポンスの読み取りに失敗しました");
				}

				const assistantMessageId = nanoid();
				let assistantContent = "";

				setMessages((prev) => [
					...prev,
					{
						id: assistantMessageId,
						role: "assistant",
						content: "",
						createdAt: new Date(),
					},
				]);

				const decoder = new TextDecoder();
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const lines = chunk.split("\n");

					for (const line of lines) {
						if (line.startsWith("data: ")) {
							const data = line.slice(6);
							if (data === "[DONE]") continue;

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
							} catch {
								// JSON parse error - skip this line
							}
						}
					}
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "エラーが発生しました");
			} finally {
				setIsLoading(false);
			}
		},
		[sessionId, isLoading],
	);

	if (isSessionLoading) {
		return (
			<Card className="flex h-full flex-col">
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-1 items-center justify-center">
					<p className="text-muted-foreground">読み込み中...</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="border-b">
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col p-0 overflow-hidden">
				<MessageList messages={messages} className="flex-1" />
				{error && (
					<div className="px-4 py-2 text-sm text-destructive bg-destructive/10">
						{error}
					</div>
				)}
				<MessageInput onSend={handleSendMessage} disabled={isLoading} />
			</CardContent>
		</Card>
	);
}
