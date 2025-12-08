import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ConversationProvider } from "@/components/ConversationProvider";
import { SessionProvider } from "@/components/SessionProvider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "AI Chat Bot",
	description:
		"エンターテイメント向けAIチャットボット - Claudeとの自由な会話を楽しもう",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
			>
				<SessionProvider>
					<ConversationProvider>{children}</ConversationProvider>
				</SessionProvider>
				<Toaster position="top-center" richColors closeButton />
			</body>
		</html>
	);
}
