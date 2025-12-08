"use client";

import { createContext, type ReactNode, useContext } from "react";
import { useSession } from "@/components/SessionProvider";
import {
	type UseConversationsReturn,
	useConversations,
} from "@/hooks/useConversations";

interface ConversationContextType extends UseConversationsReturn {
	sessionId: string;
}

const ConversationContext = createContext<ConversationContextType | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
	const { sessionId } = useSession();

	const conversationsState = useConversations(sessionId);

	return (
		<ConversationContext.Provider
			value={{
				...conversationsState,
				sessionId,
			}}
		>
			{children}
		</ConversationContext.Provider>
	);
}

export function useConversation(): ConversationContextType {
	const context = useContext(ConversationContext);
	if (!context) {
		throw new Error(
			"useConversation must be used within a ConversationProvider",
		);
	}
	return context;
}
