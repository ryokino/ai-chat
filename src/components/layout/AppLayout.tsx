"use client";

import type { ReactNode } from "react";
import { useConversation } from "@/components/ConversationProvider";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSettings } from "@/hooks/useSettings";

interface AppLayoutProps {
	children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
	const {
		conversations,
		activeConversationId,
		isLoading,
		setActiveConversationId,
		deleteConversation,
		updateTitle,
	} = useConversation();

	const { settings, updateSettings, resetSettings } = useSettings();

	const handleNewConversation = async () => {
		// 新規会話を作成せずに、activeConversationIdをnullにする
		// メッセージ送信時に新しい会話が自動作成される
		setActiveConversationId(null);
	};

	const handleSelectConversation = (id: string) => {
		setActiveConversationId(id);
	};

	return (
		<SidebarProvider>
			<AppSidebar
				conversations={conversations}
				activeConversationId={activeConversationId}
				isLoading={isLoading}
				onSelectConversation={handleSelectConversation}
				onNewConversation={handleNewConversation}
				onDeleteConversation={deleteConversation}
				onUpdateTitle={updateTitle}
				settings={settings}
				onUpdateSettings={updateSettings}
				onResetSettings={resetSettings}
			/>
			<SidebarInset>
				<header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
					<SidebarTrigger />
					<span className="font-semibold">ドクターT</span>
				</header>
				<main className="flex-1">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
