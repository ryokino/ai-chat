import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as ConversationProvider from "@/components/ConversationProvider";
import * as SessionProvider from "@/components/SessionProvider";
import * as useChat from "@/hooks/useChat";
import { ChatWindow } from "./ChatWindow";

// SessionProviderのモック
vi.mock("@/components/SessionProvider", () => ({
	useSession: vi.fn(),
}));

// ConversationProviderのモック
vi.mock("@/components/ConversationProvider", () => ({
	useConversation: vi.fn(),
}));

// useChatフックのモック
vi.mock("@/hooks/useChat", () => ({
	useChat: vi.fn(),
}));

// scrollIntoViewのモック
beforeEach(() => {
	Element.prototype.scrollIntoView = vi.fn();
	vi.clearAllMocks();

	// Default ConversationProvider mock
	vi.mocked(ConversationProvider.useConversation).mockReturnValue({
		conversations: [],
		isLoading: false,
		error: null,
		activeConversationId: null,
		setActiveConversationId: vi.fn(),
		createNewConversation: vi.fn(),
		deleteConversation: vi.fn(),
		updateTitle: vi.fn(),
		generateTitle: vi.fn(),
		refetch: vi.fn(),
		clearError: vi.fn(),
		sessionId: "test-session",
	});
});

describe("ChatWindow component", () => {
	it("should display session loading state", () => {
		vi.mocked(SessionProvider.useSession).mockReturnValue({
			sessionId: null,
			isLoading: true,
			clearSession: vi.fn(),
		});

		vi.mocked(useChat.useChat).mockReturnValue({
			messages: [],
			isLoading: false,
			error: null,
			sendMessage: vi.fn(),
			clearError: vi.fn(),
			isInitialLoading: false,
			clearMessages: vi.fn(),
		});

		render(<ChatWindow />);

		expect(screen.getByText("セッション初期化中...")).toBeInTheDocument();
	});

	it("should display conversation history loading state", () => {
		vi.mocked(SessionProvider.useSession).mockReturnValue({
			sessionId: "test-session",
			isLoading: false,
			clearSession: vi.fn(),
		});

		vi.mocked(useChat.useChat).mockReturnValue({
			messages: [],
			isLoading: false,
			error: null,
			sendMessage: vi.fn(),
			clearError: vi.fn(),
			isInitialLoading: true,
			clearMessages: vi.fn(),
		});

		render(<ChatWindow />);

		expect(screen.getByText("会話履歴を読み込み中...")).toBeInTheDocument();
	});

	it("should render MessageList and MessageInput when ready", async () => {
		const mockSendMessage = vi.fn();

		vi.mocked(SessionProvider.useSession).mockReturnValue({
			sessionId: "test-session",
			isLoading: false,
			clearSession: vi.fn(),
		});

		vi.mocked(useChat.useChat).mockReturnValue({
			messages: [
				{
					id: "1",
					sender: "user",
					content: "Hello",
					createdAt: new Date(),
				},
			],
			isLoading: false,
			error: null,
			sendMessage: mockSendMessage,
			clearError: vi.fn(),
			isInitialLoading: false,
			clearMessages: vi.fn(),
		});

		render(<ChatWindow />);

		expect(screen.getByText("Hello")).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("メッセージを入力してください"),
		).toBeInTheDocument();
	});

	it("should display error message with close button", async () => {
		const user = userEvent.setup();
		const mockClearError = vi.fn();

		vi.mocked(SessionProvider.useSession).mockReturnValue({
			sessionId: "test-session",
			isLoading: false,
			clearSession: vi.fn(),
		});

		vi.mocked(useChat.useChat).mockReturnValue({
			messages: [],
			isLoading: false,
			error: "テストエラー",
			sendMessage: vi.fn(),
			clearError: mockClearError,
			isInitialLoading: false,
			clearMessages: vi.fn(),
		});

		render(<ChatWindow />);

		expect(screen.getByText("テストエラー")).toBeInTheDocument();
		expect(screen.getByText("閉じる")).toBeInTheDocument();

		await user.click(screen.getByText("閉じる"));
		expect(mockClearError).toHaveBeenCalledOnce();
	});

	it("should disable input while loading", () => {
		vi.mocked(SessionProvider.useSession).mockReturnValue({
			sessionId: "test-session",
			isLoading: false,
			clearSession: vi.fn(),
		});

		vi.mocked(useChat.useChat).mockReturnValue({
			messages: [],
			isLoading: true,
			error: null,
			sendMessage: vi.fn(),
			clearError: vi.fn(),
			isInitialLoading: false,
			clearMessages: vi.fn(),
		});

		render(<ChatWindow />);

		const input = screen.getByPlaceholderText("送信中...");
		expect(input).toBeDisabled();
	});

	it("should disable input when no sessionId", () => {
		vi.mocked(SessionProvider.useSession).mockReturnValue({
			sessionId: null,
			isLoading: false,
			clearSession: vi.fn(),
		});

		vi.mocked(useChat.useChat).mockReturnValue({
			messages: [],
			isLoading: false,
			error: null,
			sendMessage: vi.fn(),
			clearError: vi.fn(),
			isInitialLoading: false,
			clearMessages: vi.fn(),
		});

		render(<ChatWindow />);

		const input = screen.getByPlaceholderText("メッセージを入力してください");
		expect(input).toBeDisabled();
	});

	it("should render custom title", () => {
		vi.mocked(SessionProvider.useSession).mockReturnValue({
			sessionId: "test-session",
			isLoading: false,
			clearSession: vi.fn(),
		});

		vi.mocked(useChat.useChat).mockReturnValue({
			messages: [],
			isLoading: false,
			error: null,
			sendMessage: vi.fn(),
			clearError: vi.fn(),
			isInitialLoading: false,
			clearMessages: vi.fn(),
		});

		render(<ChatWindow title="カスタムタイトル" />);

		expect(screen.getByText("カスタムタイトル")).toBeInTheDocument();
	});

	it("should show loading indicator in MessageList when sending", () => {
		vi.mocked(SessionProvider.useSession).mockReturnValue({
			sessionId: "test-session",
			isLoading: false,
			clearSession: vi.fn(),
		});

		vi.mocked(useChat.useChat).mockReturnValue({
			messages: [
				{
					id: "1",
					sender: "user",
					content: "Hello",
					createdAt: new Date(),
				},
			],
			isLoading: true,
			error: null,
			sendMessage: vi.fn(),
			clearError: vi.fn(),
			isInitialLoading: false,
			clearMessages: vi.fn(),
		});

		render(<ChatWindow />);

		expect(screen.getByText("送信中...")).toBeInTheDocument();
	});
});
