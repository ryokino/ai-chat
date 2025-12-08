"use client";

import { Send } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
	onSend: (message: string) => void;
	disabled?: boolean;
	placeholder?: string;
}

export function MessageInput({
	onSend,
	disabled = false,
	placeholder = "メッセージを入力してください（⌘+Enterで送信）",
}: MessageInputProps) {
	const [message, setMessage] = useState("");

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (message.trim() && !disabled) {
			onSend(message);
			setMessage("");
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		// IME変換中のEnterは無視
		if (e.isComposing) {
			return;
		}

		// Command+Enter (Mac) または Ctrl+Enter (Windows/Linux) で送信
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2 p-3 sm:p-4">
			<Textarea
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				disabled={disabled}
				className="flex-1 min-h-[60px] max-h-[200px] resize-none"
				aria-label="メッセージ入力"
				rows={2}
			/>
			<Button
				type="submit"
				disabled={disabled || !message.trim()}
				size="icon"
				aria-label="送信"
				className="self-end"
			>
				<Send className="h-4 w-4" />
			</Button>
		</form>
	);
}
