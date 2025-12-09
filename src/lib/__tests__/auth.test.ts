import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth, getAuthenticatedUserId } from "../auth";

describe("getAuthenticatedUserId", () => {
	let getSessionSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Spy on auth.api.getSession
		getSessionSpy = vi.spyOn(auth.api, "getSession");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("認証済みセッションから正しくuserIdを取得する", async () => {
		const mockUserId = "test-user-123";
		const mockSession = {
			user: {
				id: mockUserId,
				email: "test@example.com",
			},
			session: {
				id: "session-123",
				token: "token-123",
			},
		};

		getSessionSpy.mockResolvedValueOnce(mockSession as any);

		const request = new Request("http://localhost:3000/api/test");
		const userId = await getAuthenticatedUserId(request);

		expect(userId).toBe(mockUserId);
		expect(getSessionSpy).toHaveBeenCalledWith({
			headers: request.headers,
		});
	});

	it("未認証セッション（session.user.idがnull）の場合、nullを返す", async () => {
		const mockSession = {
			user: {
				id: null,
			},
			session: {
				id: "session-123",
				token: "token-123",
			},
		};

		getSessionSpy.mockResolvedValueOnce(mockSession as any);

		const request = new Request("http://localhost:3000/api/test");
		const userId = await getAuthenticatedUserId(request);

		expect(userId).toBeNull();
	});

	it("セッションがnullの場合、nullを返す", async () => {
		getSessionSpy.mockResolvedValueOnce(null);

		const request = new Request("http://localhost:3000/api/test");
		const userId = await getAuthenticatedUserId(request);

		expect(userId).toBeNull();
	});

	it("auth.api.getSessionがエラーをスローした場合、nullを返す", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		getSessionSpy.mockRejectedValueOnce(
			new Error("Session verification failed"),
		);

		const request = new Request("http://localhost:3000/api/test");
		const userId = await getAuthenticatedUserId(request);

		expect(userId).toBeNull();
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Failed to get authenticated user ID:",
			expect.any(Error),
		);

		consoleErrorSpy.mockRestore();
	});

	it("user.idがundefinedの場合、nullを返す", async () => {
		const mockSession = {
			user: {
				// idがない
				email: "test@example.com",
			},
			session: {
				id: "session-123",
				token: "token-123",
			},
		};

		getSessionSpy.mockResolvedValueOnce(mockSession as any);

		const request = new Request("http://localhost:3000/api/test");
		const userId = await getAuthenticatedUserId(request);

		expect(userId).toBeNull();
	});
});
