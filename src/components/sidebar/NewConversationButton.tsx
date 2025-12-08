"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewConversationButtonProps {
	onClick: () => void;
	disabled?: boolean;
}

export function NewConversationButton({
	onClick,
	disabled,
}: NewConversationButtonProps) {
	return (
		<Button
			variant="outline"
			className="w-full justify-start gap-2"
			onClick={onClick}
			disabled={disabled}
		>
			<Plus className="h-4 w-4" />
			新しい会話
		</Button>
	);
}
