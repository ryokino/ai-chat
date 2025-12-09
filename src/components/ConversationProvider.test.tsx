import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as SessionProvider from "@/components/SessionProvider";
import * as useConversationsHook from "@/hooks/useConversations";
import {
	ConversationProvider,
	useConversation,
} from "./ConversationProvider";

// SessionProviderのモック
vi.mock("@/components/SessionProvider", () => ({
	useSession: vi.fn(),
}));

// useConversationsフックのモック
vi.mock("@/hooks/useConversations", () => ({
	useConversations: vi.fn(),
}));

/**
 * @vitest-environment jsdom
 */
describe("ConversationProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("子要素をレンダリングする", () => {
		vi.mocked(SessionProvider.useSession).mockReturnValue({
			sessionId: "test-session",
			userId: null,
			isLoading: false,
		});

		vi.mocked(useConversationsHook.useConversations).mockReturnValue({
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
		});

		render(
			<ConversationProvider>
				<div data-testid="child">Child content</div>
			</ConversationProvider>,
		);

		expect(screen.getByTestId("child")).toHaveTextContent("Child content");
	});

	it("useSessionの値を伝播する", async () => {
		vi.mocked(SessionProvider.useSession).mockReturnValue({
			sessionId: "session-123",
			userId: "user-456",
			isLoading: false,
		});

		vi.mocked(useConversationsHook.useConversations).mockReturnValue({
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
		});

		function TestComponent() {
			const { sessionId, userId, isSessionLoading } = useConversation();
			return (
				<div>
					<div data-testid="session-id">{sessionId}</div>
					<div data-testid="user-id">{userId || "null"}</div>
					<div data-testid="session-loading">{isSessionLoading.toString()}</div>
				</div>
			);
		}

		render(
			<ConversationProvider>
				<TestComponent />
			</ConversationProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("session-id")).toHaveTextContent("session-123");
		});

		expect(screen.getByTestId("user-id")).toHaveTextContent("user-456");
		expect(screen.getByTestId("session-loading")).toHaveTextContent("false");
	});

	it("useConversationsの値を伝播する", async () => {
		vi.mocked(SessionProvider.useSession).mockReturnValue({
			sessionId: "test-session",
			userId: null,
			isLoading: false,
		});

		const mockConversations = [
			{
				id: "conv-1",
				title: "Test conversation",
				sessionId: "test-session",
				userId: null,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:05:00Z",
				messageCount: 5,
			},
		];

		vi.mocked(useConversationsHook.useConversations).mockReturnValue({
			conversations: mockConversations,
			isLoading: false,
			error: null,
			activeConversationId: "conv-1",
			setActiveConversationId: vi.fn(),
			createNewConversation: vi.fn(),
			deleteConversation: vi.fn(),
			updateTitle: vi.fn(),
			generateTitle: vi.fn(),
			refetch: vi.fn(),
			clearError: vi.fn(),
		});

		function TestComponent() {
			const { conversations, activeConversationId, isLoading, error } =
				useConversation();
			return (
				<div>
					<div data-testid="conversations-count">{conversations.length}</div>
					<div data-testid="active-id">{activeConversationId || "null"}</div>
					<div data-testid="is-loading">{isLoading.toString()}</div>
					<div data-testid="error">{error || "no-error"}</div>
				</div>
			);
		}

		render(
			<ConversationProvider>
				<TestComponent />
			</ConversationProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("conversations-count")).toHaveTextContent("1");
		});

		expect(screen.getByTestId("active-id")).toHaveTextContent("conv-1");
		expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
		expect(screen.getByTestId("error")).toHaveTextContent("no-error");
	});

	it("useConversationをProvider外で使用するとエラーをthrowする", () => {
		function TestComponent() {
			useConversation(); // Provider外で呼び出し
			return <div>Test</div>;
		}

		// エラーをキャッチするため、console.errorをモック
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		expect(() => {
			render(<TestComponent />);
		}).toThrow("useConversation must be used within a ConversationProvider");

		consoleError.mockRestore();
	});
});
