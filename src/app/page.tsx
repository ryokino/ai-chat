"use client";

import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/AppLayout";

// ChatWindowを遅延読み込み
const ChatWindow = dynamic(
	() =>
		import("@/components/chat/ChatWindow").then((mod) => ({
			default: mod.ChatWindow,
		})),
	{
		loading: () => (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">読み込み中...</p>
			</div>
		),
	},
);

export default function Home() {
	return (
		<AppLayout>
			<div className="flex h-[calc(100vh-56px)] flex-col md:h-screen">
				<ChatWindow title="AI Chat Bot" />
			</div>
		</AppLayout>
	);
}
