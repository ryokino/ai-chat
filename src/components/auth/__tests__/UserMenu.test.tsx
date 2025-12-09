import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserMenu } from "../UserMenu";

// SessionProviderのモック
vi.mock("@/components/SessionProvider", () => ({
	useSession: vi.fn(),
}));

// auth-clientのモック
vi.mock("@/lib/auth-client", () => ({
	signOut: vi.fn(),
}));

import { useSession } from "@/components/SessionProvider";
import { signOut } from "@/lib/auth-client";

describe("UserMenu", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("未認証時は何も表示しない", () => {
		vi.mocked(useSession).mockReturnValue({
			sessionId: "test-session",
			userId: null,
			user: null,
			isAuthenticated: false,
			isLoading: false,
		});

		const { container } = render(<UserMenu />);
		expect(container).toBeEmptyDOMElement();
	});

	it("認証済みの場合はユーザー情報を表示する", () => {
		vi.mocked(useSession).mockReturnValue({
			sessionId: "test-session",
			userId: "user-123",
			user: {
				id: "user-123",
				name: "Test User",
				email: "test@example.com",
				image: null,
			},
			isAuthenticated: true,
			isLoading: false,
		});

		render(<UserMenu />);

		expect(screen.getByText("Test User")).toBeInTheDocument();
		expect(screen.getByText("test@example.com")).toBeInTheDocument();
	});

	it("ユーザー名がない場合はメールアドレスのイニシャルを表示する", () => {
		vi.mocked(useSession).mockReturnValue({
			sessionId: "test-session",
			userId: "user-123",
			user: {
				id: "user-123",
				name: null,
				email: "test@example.com",
				image: null,
			},
			isAuthenticated: true,
			isLoading: false,
		});

		render(<UserMenu />);

		expect(screen.getByText("ユーザー")).toBeInTheDocument();
		expect(screen.getByText("test@example.com")).toBeInTheDocument();
		// アバターのフォールバックテキストを確認
		expect(screen.getByText("T")).toBeInTheDocument();
	});

	it("ユーザー名のイニシャルを正しく生成する", () => {
		vi.mocked(useSession).mockReturnValue({
			sessionId: "test-session",
			userId: "user-123",
			user: {
				id: "user-123",
				name: "John Doe",
				email: "john@example.com",
				image: null,
			},
			isAuthenticated: true,
			isLoading: false,
		});

		render(<UserMenu />);

		// アバターのフォールバックテキスト "JD" を確認
		expect(screen.getByText("JD")).toBeInTheDocument();
	});

	it("ログアウトボタンをクリックでsignOutが呼ばれる", async () => {
		const user = userEvent.setup();
		const mockSignOut = vi.mocked(signOut);

		vi.mocked(useSession).mockReturnValue({
			sessionId: "test-session",
			userId: "user-123",
			user: {
				id: "user-123",
				name: "Test User",
				email: "test@example.com",
				image: null,
			},
			isAuthenticated: true,
			isLoading: false,
		});

		render(<UserMenu />);

		// メニューを開く
		const trigger = screen.getByRole("button");
		await user.click(trigger);

		// ログアウトボタンをクリック
		const logoutButton = await screen.findByText("ログアウト");
		await user.click(logoutButton);

		expect(mockSignOut).toHaveBeenCalled();
	});

	it("プロフィールメニューが無効化されている", async () => {
		const user = userEvent.setup();

		vi.mocked(useSession).mockReturnValue({
			sessionId: "test-session",
			userId: "user-123",
			user: {
				id: "user-123",
				name: "Test User",
				email: "test@example.com",
				image: null,
			},
			isAuthenticated: true,
			isLoading: false,
		});

		render(<UserMenu />);

		// メニューを開く
		const trigger = screen.getByRole("button");
		await user.click(trigger);

		// プロフィールメニューが存在し、無効化されているか確認
		const profileButton = await screen.findByText("プロフィール");
		// Radix UIのdisabled属性は空文字列で設定される
		expect(profileButton.closest("div[role='menuitem']")).toHaveAttribute(
			"data-disabled",
		);
	});
});
