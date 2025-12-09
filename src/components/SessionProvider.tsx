"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSessionId } from "@/lib/session";
import { useSession as useBetterAuthSession } from "@/lib/auth-client";

interface SessionContextType {
	sessionId: string;
	userId: string | null;
	isLoading: boolean;
	isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextType>({
	sessionId: "",
	userId: null,
	isLoading: true,
	isAuthenticated: false,
});

export function useSession() {
	const context = useContext(SessionContext);
	if (!context) {
		throw new Error("useSession must be used within SessionProvider");
	}
	return context;
}

interface SessionProviderProps {
	children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
	const [sessionId, setSessionId] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);

	// Better Authセッションを取得
	const {
		data: authSession,
		isPending: isAuthPending,
		error: authError,
	} = useBetterAuthSession();

	useEffect(() => {
		// 認証セッションの読み込みが完了してから処理
		if (isAuthPending) {
			return;
		}

		// 認証済みの場合はuserIdを使用、未認証の場合はlocalStorageのsessionIdを使用
		if (!authSession?.user) {
			// 未認証: localStorageからセッションIDを取得
			const id = getSessionId();
			setSessionId(id);
		}

		setIsLoading(false);
	}, [authSession, isAuthPending]);

	// エラーハンドリング
	useEffect(() => {
		if (authError) {
			console.error("Better Auth session error:", authError);
			// エラーが発生してもlocalStorageのセッションIDで継続
			const id = getSessionId();
			setSessionId(id);
			setIsLoading(false);
		}
	}, [authError]);

	const userId = authSession?.user?.id ?? null;
	const isAuthenticated = !!authSession?.user;

	return (
		<SessionContext.Provider
			value={{ sessionId, userId, isLoading, isAuthenticated }}
		>
			{children}
		</SessionContext.Provider>
	);
}
