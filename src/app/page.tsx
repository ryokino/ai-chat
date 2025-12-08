import dynamic from "next/dynamic";

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
		<main className="flex min-h-screen flex-col">
			<ChatWindow title="AI Chat Bot" />
		</main>
	);
}
