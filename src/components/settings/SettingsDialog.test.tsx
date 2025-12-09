import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_AI_SETTINGS, MAX_TOKENS_OPTIONS } from "@/lib/settings";
import { SettingsDialog } from "./SettingsDialog";

describe("SettingsDialog", () => {
	const mockOnUpdate = vi.fn();
	const mockOnReset = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	const renderDialog = (settings = DEFAULT_AI_SETTINGS) => {
		return render(
			<SettingsDialog
				settings={settings}
				onUpdate={mockOnUpdate}
				onReset={mockOnReset}
			/>,
		);
	};

	it("設定ボタンが表示される", () => {
		renderDialog();

		const button = screen.getByRole("button", { name: /AI設定/i });
		expect(button).toBeInTheDocument();
	});

	it("設定ボタンをクリックするとダイアログが開く", async () => {
		renderDialog();
		const user = userEvent.setup();

		const button = screen.getByRole("button", { name: /AI設定/i });
		await user.click(button);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		// ダイアログのタイトルは heading で確認
		expect(
			screen.getByRole("heading", { name: "AI設定", level: 2 }),
		).toBeInTheDocument();
	});

	it("システムプロンプトのテキストエリアが表示される", async () => {
		renderDialog();
		const user = userEvent.setup();

		await user.click(screen.getByRole("button", { name: /AI設定/i }));

		const textarea = screen.getByLabelText("システムプロンプト");
		expect(textarea).toBeInTheDocument();
		expect(textarea).toHaveValue(DEFAULT_AI_SETTINGS.systemPrompt);
	});

	it("レスポンス長のセレクトが表示される", async () => {
		renderDialog();
		const user = userEvent.setup();

		await user.click(screen.getByRole("button", { name: /AI設定/i }));

		const select = screen.getByRole("combobox");
		expect(select).toBeInTheDocument();
	});

	it("Temperatureスライダーが表示される", async () => {
		renderDialog();
		const user = userEvent.setup();

		await user.click(screen.getByRole("button", { name: /AI設定/i }));

		const slider = screen.getByRole("slider");
		expect(slider).toBeInTheDocument();
	});

	it("保存ボタンをクリックするとonUpdateが呼ばれる", async () => {
		renderDialog();
		const user = userEvent.setup();

		await user.click(screen.getByRole("button", { name: /AI設定/i }));

		const saveButton = screen.getByRole("button", { name: "保存" });
		await user.click(saveButton);

		expect(mockOnUpdate).toHaveBeenCalledWith(DEFAULT_AI_SETTINGS);
	});

	it("デフォルトに戻すボタンをクリックするとonResetが呼ばれる", async () => {
		renderDialog();
		const user = userEvent.setup();

		await user.click(screen.getByRole("button", { name: /AI設定/i }));

		const resetButton = screen.getByRole("button", {
			name: "デフォルトに戻す",
		});
		await user.click(resetButton);

		expect(mockOnReset).toHaveBeenCalled();
	});

	it("キャンセルボタンをクリックするとダイアログが閉じる", async () => {
		renderDialog();
		const user = userEvent.setup();

		await user.click(screen.getByRole("button", { name: /AI設定/i }));
		expect(screen.getByRole("dialog")).toBeInTheDocument();

		const cancelButton = screen.getByRole("button", { name: "キャンセル" });
		await user.click(cancelButton);

		await waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});
	});

	it("システムプロンプトを変更して保存できる", async () => {
		renderDialog();
		const user = userEvent.setup();

		await user.click(screen.getByRole("button", { name: /AI設定/i }));

		const textarea = screen.getByLabelText("システムプロンプト");
		await user.clear(textarea);
		await user.type(textarea, "新しいプロンプト");

		const saveButton = screen.getByRole("button", { name: "保存" });
		await user.click(saveButton);

		expect(mockOnUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				systemPrompt: "新しいプロンプト",
			}),
		);
	});

	it("カスタム設定が表示される", async () => {
		const customSettings = {
			systemPrompt: "カスタムプロンプト",
			maxTokens: 4096,
			temperature: 0.7,
		};
		renderDialog(customSettings);
		const user = userEvent.setup();

		await user.click(screen.getByRole("button", { name: /AI設定/i }));

		const textarea = screen.getByLabelText("システムプロンプト");
		expect(textarea).toHaveValue("カスタムプロンプト");

		// Temperature の表示を確認
		expect(screen.getByText(/Temperature: 0.7/)).toBeInTheDocument();
	});

	it("説明テキストが表示される", async () => {
		renderDialog();
		const user = userEvent.setup();

		await user.click(screen.getByRole("button", { name: /AI設定/i }));

		expect(screen.getByText(/AIの役割や振る舞いを定義/)).toBeInTheDocument();
		expect(
			screen.getByText(/AIの応答の最大長を設定します/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/値が低いほど一貫性のある応答/),
		).toBeInTheDocument();
	});
});
