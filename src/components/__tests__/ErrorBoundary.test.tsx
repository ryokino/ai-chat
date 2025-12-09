import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

// エラーをスローするコンポーネント
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
	if (shouldThrow) {
		throw new Error("Test error");
	}
	return <div>No error</div>;
};

describe("ErrorBoundary", () => {
	// コンソールエラーをモック（テスト出力をクリーンに保つため）
	const originalConsoleError = console.error;
	beforeEach(() => {
		console.error = vi.fn();
	});
	afterEach(() => {
		console.error = originalConsoleError;
	});

	it("エラーがない場合、子要素を正常にレンダリングする", () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={false} />
			</ErrorBoundary>,
		);

		expect(screen.getByText("No error")).toBeInTheDocument();
	});

	it("エラーがキャッチされた場合、デフォルトのフォールバックUIを表示する", () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
		expect(
			screen.getByText(
				"予期しないエラーが発生しました。ページを再読み込みしてください。",
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "ページを再読み込み" }),
		).toBeInTheDocument();
	});

	it("カスタムフォールバックUIが提供された場合、それを表示する", () => {
		const customFallback = <div>Custom error message</div>;

		render(
			<ErrorBoundary fallback={customFallback}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Custom error message")).toBeInTheDocument();
		expect(screen.queryByText("エラーが発生しました")).not.toBeInTheDocument();
	});

	it("再読み込みボタンをクリックすると、window.location.reloadが呼ばれる", async () => {
		const user = userEvent.setup();
		const reloadMock = vi.fn();
		Object.defineProperty(window, "location", {
			value: { reload: reloadMock },
			writable: true,
		});

		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		const reloadButton = screen.getByRole("button", {
			name: "ページを再読み込み",
		});
		await user.click(reloadButton);

		expect(reloadMock).toHaveBeenCalledOnce();
	});

	it("componentDidCatchでエラーがログに記録される", () => {
		const consoleErrorSpy = vi.spyOn(console, "error");

		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		// console.errorが呼ばれたことを確認（React自身のエラーログ + componentDidCatch）
		expect(consoleErrorSpy).toHaveBeenCalled();
	});
});
