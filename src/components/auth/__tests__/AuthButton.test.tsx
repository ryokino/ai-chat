import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthButton } from "../AuthButton";

// SessionProviderのモック
vi.mock("@/components/SessionProvider", () => ({
	useSession: vi.fn(),
}));

// auth-clientのモック
vi.mock("@/lib/auth-client", () => ({
	signIn: {
		social: vi.fn(),
	},
}));

import { useSession } from "@/components/SessionProvider";
import { signIn } from "@/lib/auth-client";

describe("AuthButton", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("未認証時にGoogleログインボタンを表示する", () => {
		vi.mocked(useSession).mockReturnValue({
			sessionId: "test-session",
			userId: null,
			user: null,
			isAuthenticated: false,
			isLoading: false,
		});

		render(<AuthButton />);

		const button = screen.getByRole("button", { name: /googleでログイン/i });
		expect(button).toBeInTheDocument();
	});

	it("認証済みの場合はボタンを表示しない", () => {
		vi.mocked(useSession).mockReturnValue({
			sessionId: "test-session",
			userId: "user-123",
			user: {
				id: "user-123",
				name: "Test User",
				email: "test@example.com",
				image: null,
				emailVerified: true,
				createdAt: new Date("2025-01-01"),
				updatedAt: new Date("2025-01-01"),
			},
			isAuthenticated: true,
			isLoading: false,
		});

		const { container } = render(<AuthButton />);
		expect(container).toBeEmptyDOMElement();
	});

	it("ローディング中は「Loading...」を表示する", () => {
		vi.mocked(useSession).mockReturnValue({
			sessionId: "test-session",
			userId: null,
			user: null,
			isAuthenticated: false,
			isLoading: true,
		});

		render(<AuthButton />);

		expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
	});

	it("ボタンクリックでGoogle認証を開始する", async () => {
		const mockSignIn = vi.mocked(signIn.social);

		vi.mocked(useSession).mockReturnValue({
			sessionId: "test-session",
			userId: null,
			user: null,
			isAuthenticated: false,
			isLoading: false,
		});

		render(<AuthButton />);

		const button = screen.getByRole("button", { name: /googleでログイン/i });
		fireEvent.click(button);

		expect(mockSignIn).toHaveBeenCalledWith({
			provider: "google",
			callbackURL: "/",
		});
	});

	it("ローディング中はボタンが無効化される", () => {
		vi.mocked(useSession).mockReturnValue({
			sessionId: "test-session",
			userId: null,
			user: null,
			isAuthenticated: false,
			isLoading: true,
		});

		render(<AuthButton />);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
	});
});
