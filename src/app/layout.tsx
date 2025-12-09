import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";
import { ConversationProvider } from "@/components/ConversationProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
	title: "ドクターT",
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
				<ErrorBoundary>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<SessionProvider>
							<ConversationProvider>{children}</ConversationProvider>
						</SessionProvider>
						<Toaster position="top-center" richColors closeButton />
					</ThemeProvider>
				</ErrorBoundary>
			</body>
		</html>
	);
}
