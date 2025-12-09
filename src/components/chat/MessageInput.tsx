"use client";

import { ImagePlus, Send, X } from "lucide-react";
import {
	type FormEvent,
	type KeyboardEvent,
	memo,
	useCallback,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createImageAttachment } from "@/lib/image-validation";
import type { ImageAttachment } from "@/types/attachment";

interface MessageInputProps {
	onSend: (message: string, attachments?: ImageAttachment[]) => void;
	disabled?: boolean;
	placeholder?: string;
}

export const MessageInput = memo(function MessageInput({
	onSend,
	disabled = false,
	placeholder = "メッセージを入力してください（⌘+Enterで送信）",
}: MessageInputProps) {
	const [message, setMessage] = useState("");
	const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = useCallback(
		(e: FormEvent) => {
			e.preventDefault();
			const trimmedMessage = message.trim();
			// 画像のみの送信も許可
			if ((trimmedMessage || attachments.length > 0) && !disabled) {
				onSend(
					trimmedMessage,
					attachments.length > 0 ? attachments : undefined,
				);
				setMessage("");
				setAttachments([]);
			}
		},
		[message, attachments, disabled, onSend],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			// IME変換中のEnterは無視
			if (e.nativeEvent.isComposing) {
				return;
			}

			// Command+Enter (Mac) または Ctrl+Enter (Windows/Linux) で送信
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				handleSubmit(e);
			}
		},
		[handleSubmit],
	);

	const handleFileSelect = useCallback(async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		setIsProcessing(true);

		try {
			const newAttachments: ImageAttachment[] = [];

			for (const file of Array.from(files)) {
				try {
					const attachment = await createImageAttachment(file);
					newAttachments.push(attachment);
				} catch (error) {
					toast.error(
						error instanceof Error ? error.message : "画像の処理に失敗しました",
					);
				}
			}

			if (newAttachments.length > 0) {
				setAttachments((prev) => [...prev, ...newAttachments]);
				toast.success(`${newAttachments.length}枚の画像を追加しました`);
			}
		} finally {
			setIsProcessing(false);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	}, []);

	const handleImageButtonClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			handleFileSelect(e.target.files);
		},
		[handleFileSelect],
	);

	const handleRemoveAttachment = useCallback((index: number) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			handleFileSelect(e.dataTransfer.files);
		},
		[handleFileSelect],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handlePaste = useCallback(
		async (e: React.ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;

			const imageItems = Array.from(items).filter((item) =>
				item.type.startsWith("image/"),
			);

			if (imageItems.length > 0) {
				e.preventDefault();
				const files: File[] = [];

				for (const item of imageItems) {
					const file = item.getAsFile();
					if (file) files.push(file);
				}

				if (files.length > 0) {
					const dataTransfer = new DataTransfer();
					for (const file of files) {
						dataTransfer.items.add(file);
					}
					await handleFileSelect(dataTransfer.files);
				}
			}
		},
		[handleFileSelect],
	);

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-2 p-3 sm:p-4"
			onDrop={handleDrop}
			onDragOver={handleDragOver}
		>
			{/* 画像プレビュー */}
			{attachments.length > 0 && (
				<div className="flex flex-wrap gap-2 pb-2 border-b">
					{attachments.map((attachment, index) => (
						<div key={index} className="relative group">
							<img
								src={attachment.data}
								alt={attachment.fileName}
								className="w-20 h-20 object-cover rounded border"
							/>
							<button
								type="button"
								onClick={() => handleRemoveAttachment(index)}
								className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
								aria-label={`${attachment.fileName}を削除`}
							>
								<X className="h-3 w-3" />
							</button>
							<div className="text-xs text-muted-foreground mt-1 max-w-[80px] truncate">
								{attachment.fileName}
							</div>
						</div>
					))}
				</div>
			)}

			{/* 入力エリア */}
			<div className="flex gap-2">
				<input
					type="file"
					ref={fileInputRef}
					onChange={handleFileInputChange}
					accept="image/jpeg,image/png,image/webp,image/gif"
					multiple
					className="hidden"
					aria-label="画像を選択"
				/>
				<Button
					type="button"
					onClick={handleImageButtonClick}
					disabled={disabled || isProcessing}
					size="icon"
					variant="outline"
					aria-label="画像を添付"
					className="self-end"
				>
					<ImagePlus className="h-4 w-4" />
				</Button>
				<Textarea
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					onPaste={handlePaste}
					placeholder={placeholder}
					disabled={disabled}
					className="flex-1 min-h-[60px] max-h-[200px] resize-none"
					aria-label="メッセージ入力"
					rows={2}
				/>
				<Button
					type="submit"
					disabled={disabled || (!message.trim() && attachments.length === 0)}
					size="icon"
					aria-label="送信"
					className="self-end"
				>
					<Send className="h-4 w-4" />
				</Button>
			</div>
		</form>
	);
});
