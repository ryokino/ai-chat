"use client";

import { Bot } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { AISettings } from "@/lib/settings";
import type { ConversationSummary } from "@/lib/sse-client";
import { ConversationList } from "./ConversationList";
import { NewConversationButton } from "./NewConversationButton";

interface AppSidebarProps {
	conversations: ConversationSummary[];
	activeConversationId: string | null;
	isLoading: boolean;
	onSelectConversation: (id: string) => void;
	onNewConversation: () => void;
	onDeleteConversation: (id: string) => Promise<void>;
	onUpdateTitle: (id: string, title: string) => Promise<void>;
	settings: AISettings;
	onUpdateSettings: (settings: Partial<AISettings>) => void;
	onResetSettings: () => void;
}

export function AppSidebar({
	conversations,
	activeConversationId,
	isLoading,
	onSelectConversation,
	onNewConversation,
	onDeleteConversation,
	onUpdateTitle,
	settings,
	onUpdateSettings,
	onResetSettings,
}: AppSidebarProps) {
	return (
		<Sidebar>
			<SidebarHeader className="border-b">
				<div className="flex items-center gap-2 px-2 py-2">
					<Bot className="h-6 w-6 text-primary" />
					<span className="font-semibold">AI Chat</span>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<div className="px-2 py-2">
						<NewConversationButton
							onClick={onNewConversation}
							disabled={isLoading}
						/>
					</div>
				</SidebarGroup>

				<SidebarGroup className="flex-1">
					<SidebarGroupLabel>会話履歴</SidebarGroupLabel>
					<SidebarGroupContent>
						<ConversationList
							conversations={conversations}
							activeId={activeConversationId}
							onSelect={onSelectConversation}
							onDelete={onDeleteConversation}
							onUpdateTitle={onUpdateTitle}
							isLoading={isLoading}
						/>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t">
				<div className="space-y-2 px-2 py-2">
					{/* 認証UI */}
					<div className="flex flex-col gap-2">
						<AuthButton />
						<UserMenu />
					</div>

					<Separator />

					{/* 設定とテーマ切り替え */}
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							Powered by Claude
						</span>
						<div className="flex items-center gap-1">
							<SettingsDialog
								settings={settings}
								onUpdate={onUpdateSettings}
								onReset={onResetSettings}
							/>
							<ThemeToggle />
						</div>
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
