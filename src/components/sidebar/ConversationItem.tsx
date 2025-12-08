"use client";

import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { ConversationSummary } from "@/lib/sse-client";

interface ConversationItemProps {
	conversation: ConversationSummary;
	isActive: boolean;
	onSelect: () => void;
	onDelete: () => Promise<void>;
	onUpdateTitle: (title: string) => Promise<void>;
}

function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return "たった今";
	if (diffMins < 60) return `${diffMins}分前`;
	if (diffHours < 24) return `${diffHours}時間前`;
	if (diffDays < 7) return `${diffDays}日前`;

	return date.toLocaleDateString("ja-JP", {
		month: "short",
		day: "numeric",
	});
}

export function ConversationItem({
	conversation,
	isActive,
	onSelect,
	onDelete,
	onUpdateTitle,
}: ConversationItemProps) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [editTitle, setEditTitle] = useState(conversation.title || "");
	const [isDeleting, setIsDeleting] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	const displayTitle = conversation.title || "新しい会話";

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await onDelete();
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	const handleUpdateTitle = async () => {
		if (!editTitle.trim()) return;

		setIsUpdating(true);
		try {
			await onUpdateTitle(editTitle.trim());
			setShowEditDialog(false);
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<>
			<SidebarMenuItem>
				<SidebarMenuButton
					isActive={isActive}
					onClick={onSelect}
					className="group/item w-full justify-between"
				>
					<div className="flex items-center gap-2 min-w-0 flex-1">
						<MessageSquare className="h-4 w-4 shrink-0" />
						<span className="truncate">{displayTitle}</span>
					</div>
					<div className="flex items-center gap-1">
						<span className="text-xs text-muted-foreground shrink-0 group-hover/item:hidden">
							{formatRelativeTime(conversation.updatedAt)}
						</span>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 shrink-0 opacity-0 group-hover/item:opacity-100"
									onClick={(e) => e.stopPropagation()}
								>
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">メニューを開く</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-40">
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										setEditTitle(conversation.title || "");
										setShowEditDialog(true);
									}}
								>
									<Pencil className="mr-2 h-4 w-4" />
									タイトルを編集
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										setShowDeleteDialog(true);
									}}
									className="text-destructive focus:text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									削除
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</SidebarMenuButton>
			</SidebarMenuItem>

			{/* 削除確認ダイアログ */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>会話を削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							「{displayTitle}」を削除します。この操作は取り消せません。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							キャンセル
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "削除中..." : "削除"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* タイトル編集ダイアログ */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>タイトルを編集</DialogTitle>
						<DialogDescription>
							会話のタイトルを入力してください。
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Input
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
							placeholder="会話のタイトル"
							onKeyDown={(e) => {
								if (e.key === "Enter" && !isUpdating) {
									handleUpdateTitle();
								}
							}}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowEditDialog(false)}
							disabled={isUpdating}
						>
							キャンセル
						</Button>
						<Button
							onClick={handleUpdateTitle}
							disabled={isUpdating || !editTitle.trim()}
						>
							{isUpdating ? "保存中..." : "保存"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
