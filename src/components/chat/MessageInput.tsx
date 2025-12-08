"use client";

import { Send } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
	onSend: (message: string) => void;
	disabled?: boolean;
	placeholder?: string;
}

export function MessageInput({
	onSend,
	disabled = false,
	placeholder = "メッセージを入力...",
}: MessageInputProps) {
	const [message, setMessage] = useState("");

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (message.trim() && !disabled) {
			onSend(message.trim());
			setMessage("");
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
			<Input
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				disabled={disabled}
				className="flex-1"
				aria-label="メッセージ入力"
			/>
			<Button
				type="submit"
				disabled={disabled || !message.trim()}
				size="icon"
				aria-label="送信"
			>
				<Send className="h-4 w-4" />
			</Button>
		</form>
	);
}
