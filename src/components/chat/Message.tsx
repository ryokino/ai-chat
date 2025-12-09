"use client";

import { Bot, Pencil, RefreshCw, User } from "lucide-react";
import { memo, useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface MessageProps {
	id: string;
	sender: "user" | "assistant";
	content: string;
	createdAt: Date;
}

export interface MessageActionsProps {
	onEdit?: (messageId: string, newContent: string) => void;
	onRegenerate?: (messageId: string) => void;
	isLoading?: boolean;
}

function formatTime(date: Date): string {
	return date.toLocaleTimeString("ja-JP", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export const Message = memo(function Message({
	id,
	sender,
	content,
	createdAt,
	onEdit,
	onRegenerate,
	isLoading = false,
}: MessageProps & MessageActionsProps) {
	const isUser = sender === "user";
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(content);
	const [isHovered, setIsHovered] = useState(false);

	const handleEditClick = useCallback(() => {
		setEditContent(content);
		setIsEditing(true);
	}, [content]);

	const handleCancelEdit = useCallback(() => {
		setIsEditing(false);
		setEditContent(content);
	}, [content]);

	const handleSaveEdit = useCallback(() => {
		if (editContent.trim() && editContent.trim() !== content) {
			onEdit?.(id, editContent.trim());
		}
		setIsEditing(false);
	}, [id, editContent, content, onEdit]);

	const handleRegenerate = useCallback(() => {
		onRegenerate?.(id);
	}, [id, onRegenerate]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				handleSaveEdit();
			}
			if (e.key === "Escape") {
				handleCancelEdit();
			}
		},
		[handleSaveEdit, handleCancelEdit],
	);

	return (
		<div
			className={cn(
				"group flex gap-3 p-4 px-4 sm:px-6",
				isUser ? "flex-row-reverse" : "flex-row",
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
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
				{isEditing ? (
					<div className="w-full space-y-2">
						<Textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							onKeyDown={handleKeyDown}
							className="min-h-[80px] resize-y"
							autoFocus
						/>
						<div className="flex gap-2 justify-end">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCancelEdit}
								disabled={isLoading}
							>
								キャンセル
							</Button>
							<Button
								size="sm"
								onClick={handleSaveEdit}
								disabled={isLoading || !editContent.trim()}
							>
								保存して再送信
							</Button>
						</div>
					</div>
				) : (
					<>
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
						<div
							className={cn(
								"flex items-center gap-2",
								isUser ? "flex-row-reverse" : "flex-row",
							)}
						>
							<span className="text-xs text-muted-foreground">
								{formatTime(createdAt)}
							</span>

							{/* アクションボタン（ホバー時に表示） */}
							{(isHovered || isLoading) && !isLoading && (
								<div
									className={cn(
										"flex gap-1",
										isUser ? "flex-row-reverse" : "flex-row",
									)}
								>
									{isUser && onEdit && (
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={handleEditClick}
											title="編集"
										>
											<Pencil className="h-3 w-3" />
										</Button>
									)}
									{!isUser && onRegenerate && (
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onClick={handleRegenerate}
											title="再生成"
										>
											<RefreshCw className="h-3 w-3" />
										</Button>
									)}
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
});
