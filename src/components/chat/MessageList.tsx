"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, type MessageProps } from "./Message";

interface MessageListProps {
	messages: MessageProps[];
	className?: string;
	isLoading?: boolean;
}

export function MessageList({
	messages,
	className,
	isLoading = false,
}: MessageListProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: messages.length is intentionally used to trigger scroll on new messages
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]);

	if (messages.length === 0) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">
					メッセージを送信して会話を始めましょう
				</p>
			</div>
		);
	}

	return (
		<ScrollArea className={className}>
			<div className="flex flex-col">
				{messages.map((message) => (
					<Message
						key={message.id}
						id={message.id}
						sender={message.sender}
						content={message.content}
						createdAt={message.createdAt}
					/>
				))}
				{isLoading && (
					<div className="flex gap-3 p-4">
						<div className="flex items-center gap-2 text-muted-foreground">
							<div className="flex gap-1">
								<span
									className="animate-bounce"
									style={{ animationDelay: "0ms" }}
								>
									●
								</span>
								<span
									className="animate-bounce"
									style={{ animationDelay: "150ms" }}
								>
									●
								</span>
								<span
									className="animate-bounce"
									style={{ animationDelay: "300ms" }}
								>
									●
								</span>
							</div>
							<span className="text-sm">送信中...</span>
						</div>
					</div>
				)}
				<div ref={bottomRef} />
			</div>
		</ScrollArea>
	);
}
