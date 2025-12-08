"use client";

import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface MessageProps {
	id: string;
	sender: "user" | "assistant";
	content: string;
	createdAt: Date;
}

function formatTime(date: Date): string {
	return date.toLocaleTimeString("ja-JP", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function Message({ sender, content, createdAt }: MessageProps) {
	const isUser = sender === "user";

	return (
		<div
			className={cn(
				"flex gap-3 p-4 px-4 sm:px-6",
				isUser ? "flex-row-reverse" : "flex-row",
			)}
		>
			<Avatar className="h-8 w-8 shrink-0 hidden sm:flex">
				{isUser ? (
					<AvatarFallback className="bg-primary text-primary-foreground">
						<User className="h-4 w-4" />
					</AvatarFallback>
				) : (
					<AvatarFallback className="bg-secondary text-secondary-foreground">
						<Bot className="h-4 w-4" />
					</AvatarFallback>
				)}
			</Avatar>
			<div
				className={cn(
					"flex max-w-[95%] sm:max-w-[85%] md:max-w-[80%] flex-col gap-1",
					isUser ? "items-end" : "items-start",
				)}
			>
				<div
					className={cn(
						"rounded-lg px-4 py-2",
						isUser
							? "bg-primary text-primary-foreground"
							: "bg-muted text-foreground",
					)}
				>
					{isUser ? (
						<p className="whitespace-pre-wrap text-sm">{content}</p>
					) : (
						<div className="prose prose-sm dark:prose-invert max-w-none">
							<ReactMarkdown remarkPlugins={[remarkGfm]}>
								{content}
							</ReactMarkdown>
						</div>
					)}
				</div>
				<span className="text-xs text-muted-foreground">
					{formatTime(createdAt)}
				</span>
			</div>
		</div>
	);
}
