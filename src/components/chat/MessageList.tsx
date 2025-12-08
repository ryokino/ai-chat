"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, type MessageProps } from "./Message";

interface MessageListProps {
	messages: MessageProps[];
	className?: string;
}

export function MessageList({ messages, className }: MessageListProps) {
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
						role={message.role}
						content={message.content}
						createdAt={message.createdAt}
					/>
				))}
				<div ref={bottomRef} />
			</div>
		</ScrollArea>
	);
}
