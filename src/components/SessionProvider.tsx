"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSessionId } from "@/lib/session";

interface SessionContextType {
	sessionId: string;
	isLoading: boolean;
}

const SessionContext = createContext<SessionContextType>({
	sessionId: "",
	isLoading: true,
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

	useEffect(() => {
		// クライアントサイドでセッションIDを取得・生成
		const id = getSessionId();
		setSessionId(id);
		setIsLoading(false);
	}, []);

	return (
		<SessionContext.Provider value={{ sessionId, isLoading }}>
			{children}
		</SessionContext.Provider>
	);
}
