import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as sessionLib from "@/lib/session";
import { SessionProvider, useSession } from "./SessionProvider";

vi.mock("@/lib/session", () => ({
	getSessionId: vi.fn(),
}));

/**
 * @vitest-environment jsdom
 */
describe("SessionProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should initialize session ID from getSessionId", async () => {
		vi.mocked(sessionLib.getSessionId).mockReturnValue("test-session-id");

		function TestComponent() {
			const { sessionId, isLoading } = useSession();
			return (
				<div>
					<div data-testid="session-id">{sessionId}</div>
					<div data-testid="is-loading">{isLoading.toString()}</div>
				</div>
			);
		}

		render(
			<SessionProvider>
				<TestComponent />
			</SessionProvider>,
		);

		// 初期状態はローディング中
		await waitFor(() => {
			expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
		});

		// セッションIDが設定されている
		expect(screen.getByTestId("session-id")).toHaveTextContent(
			"test-session-id",
		);
	});

	it("should call getSessionId only once on mount", async () => {
		vi.mocked(sessionLib.getSessionId).mockReturnValue("test-session-id");

		function TestComponent() {
			const { sessionId } = useSession();
			return <div>{sessionId}</div>;
		}

		render(
			<SessionProvider>
				<TestComponent />
			</SessionProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText("test-session-id")).toBeInTheDocument();
		});

		expect(sessionLib.getSessionId).toHaveBeenCalledOnce();
	});

	it("should handle empty session ID", async () => {
		vi.mocked(sessionLib.getSessionId).mockReturnValue("");

		function TestComponent() {
			const { sessionId, isLoading } = useSession();
			return (
				<div>
					<div data-testid="session-id">{sessionId || "empty"}</div>
					<div data-testid="is-loading">{isLoading.toString()}</div>
				</div>
			);
		}

		render(
			<SessionProvider>
				<TestComponent />
			</SessionProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
		});

		expect(screen.getByTestId("session-id")).toHaveTextContent("empty");
	});

	it("should update isLoading state correctly", async () => {
		vi.mocked(sessionLib.getSessionId).mockReturnValue("test-session-id");

		function TestComponent() {
			const { isLoading } = useSession();
			return (
				<div data-testid="loading-state">
					{isLoading ? "Loading..." : "Loaded"}
				</div>
			);
		}

		render(
			<SessionProvider>
				<TestComponent />
			</SessionProvider>,
		);

		// 最終的にはローディングが完了する
		await waitFor(() => {
			expect(screen.getByTestId("loading-state")).toHaveTextContent("Loaded");
		});
	});
});
