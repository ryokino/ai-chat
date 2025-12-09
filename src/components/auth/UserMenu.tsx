"use client";

import { LogOut, User } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";

/**
 * 認証済みユーザーメニューコンポーネント
 * ユーザーアバターとドロップダウンメニューを表示
 */
export function UserMenu() {
	const { user, isAuthenticated } = useSession();

	if (!isAuthenticated || !user) {
		return null;
	}

	const handleSignOut = async () => {
		try {
			await signOut();
		} catch (error) {
			console.error("Sign out error:", error);
		}
	};

	const userInitials = user.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: user.email?.[0]?.toUpperCase() || "U";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-2 hover:bg-accent w-full">
				<Avatar className="h-8 w-8">
					<AvatarImage
						src={user.image || undefined}
						alt={user.name || "User"}
					/>
					<AvatarFallback>{userInitials}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col items-start flex-1 min-w-0">
					<span className="text-sm font-medium truncate w-full">
						{user.name || "ユーザー"}
					</span>
					<span className="text-xs text-muted-foreground truncate w-full">
						{user.email}
					</span>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem disabled>
					<User className="mr-2 h-4 w-4" />
					<span>プロフィール</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleSignOut}>
					<LogOut className="mr-2 h-4 w-4" />
					<span>ログアウト</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
