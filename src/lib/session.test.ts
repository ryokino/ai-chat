import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearSessionId,
	generateSessionId,
	getSessionId,
	saveSessionId,
} from "./session";

/**
 * @vitest-environment jsdom
 */
describe("session utilities", () => {
	beforeEach(() => {
		// localStorageをクリア
		localStorage.clear();
		vi.clearAllMocks();
	});

	describe("generateSessionId", () => {
		it("should generate a session ID", () => {
			const sessionId = generateSessionId();
			expect(sessionId).toBeTruthy();
			expect(typeof sessionId).toBe("string");
			expect(sessionId.length).toBeGreaterThan(0);
		});

		it("should generate unique session IDs", () => {
			const sessionId1 = generateSessionId();
			const sessionId2 = generateSessionId();
			expect(sessionId1).not.toBe(sessionId2);
		});
	});

	describe("saveSessionId", () => {
		it("should save session ID to localStorage", () => {
			const sessionId = "test-session-id";
			saveSessionId(sessionId);
			expect(localStorage.getItem("ai-chat-session-id")).toBe(sessionId);
		});

		it("should overwrite existing session ID", () => {
			saveSessionId("old-session-id");
			saveSessionId("new-session-id");
			expect(localStorage.getItem("ai-chat-session-id")).toBe("new-session-id");
		});
	});

	describe("getSessionId", () => {
		it("should return existing session ID from localStorage", () => {
			const sessionId = "existing-session-id";
			localStorage.setItem("ai-chat-session-id", sessionId);
			expect(getSessionId()).toBe(sessionId);
		});

		it("should generate and save new session ID if none exists", () => {
			const sessionId = getSessionId();
			expect(sessionId).toBeTruthy();
			expect(localStorage.getItem("ai-chat-session-id")).toBe(sessionId);
		});

		it("should return the same session ID on multiple calls", () => {
			const sessionId1 = getSessionId();
			const sessionId2 = getSessionId();
			expect(sessionId1).toBe(sessionId2);
		});
	});

	describe("clearSessionId", () => {
		it("should remove session ID from localStorage", () => {
			saveSessionId("test-session-id");
			clearSessionId();
			expect(localStorage.getItem("ai-chat-session-id")).toBeNull();
		});

		it("should not throw error if no session ID exists", () => {
			expect(() => clearSessionId()).not.toThrow();
		});
	});
});
