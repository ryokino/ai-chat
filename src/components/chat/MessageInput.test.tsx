import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessageInput } from "./MessageInput";

const DEFAULT_PLACEHOLDER = "メッセージを入力してください（⌘+Enterで送信）";

describe("MessageInput component", () => {
	it("should render input field and send button", () => {
		render(<MessageInput onSend={vi.fn()} />);

		expect(
			screen.getByPlaceholderText(DEFAULT_PLACEHOLDER),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "送信" })).toBeInTheDocument();
	});

	it("should allow text input", async () => {
		const user = userEvent.setup();
		render(<MessageInput onSend={vi.fn()} />);

		const input = screen.getByPlaceholderText(DEFAULT_PLACEHOLDER);
		await user.type(input, "Hello");

		expect(input).toHaveValue("Hello");
	});

	it("should call onSend when send button is clicked", async () => {
		const user = userEvent.setup();
		const handleSend = vi.fn();
		render(<MessageInput onSend={handleSend} />);

		const input = screen.getByPlaceholderText(DEFAULT_PLACEHOLDER);
		const sendButton = screen.getByRole("button", { name: "送信" });

		await user.type(input, "Test message");
		await user.click(sendButton);

		expect(handleSend).toHaveBeenCalledWith("Test message", undefined);
		expect(input).toHaveValue("");
	});

	it("should call onSend when Command+Enter is pressed", async () => {
		const user = userEvent.setup();
		const handleSend = vi.fn();
		render(<MessageInput onSend={handleSend} />);

		const input = screen.getByPlaceholderText(DEFAULT_PLACEHOLDER);

		await user.type(input, "Test message");
		// Command+Enterで送信
		fireEvent.keyDown(input, { key: "Enter", metaKey: true });

		expect(handleSend).toHaveBeenCalledWith("Test message", undefined);
	});

	it("should call onSend when Ctrl+Enter is pressed", async () => {
		const user = userEvent.setup();
		const handleSend = vi.fn();
		render(<MessageInput onSend={handleSend} />);

		const input = screen.getByPlaceholderText(DEFAULT_PLACEHOLDER);

		await user.type(input, "Test message");
		// Ctrl+Enterで送信
		fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });

		expect(handleSend).toHaveBeenCalledWith("Test message", undefined);
	});

	it("should NOT send message when only Enter is pressed", async () => {
		const user = userEvent.setup();
		const handleSend = vi.fn();
		render(<MessageInput onSend={handleSend} />);

		const input = screen.getByPlaceholderText(DEFAULT_PLACEHOLDER);

		await user.type(input, "Test message");
		// 通常のEnterでは送信しない
		fireEvent.keyDown(input, { key: "Enter" });

		expect(handleSend).not.toHaveBeenCalled();
	});

	it("should not send empty or whitespace-only messages", async () => {
		const user = userEvent.setup();
		const handleSend = vi.fn();
		render(<MessageInput onSend={handleSend} />);

		const input = screen.getByPlaceholderText(DEFAULT_PLACEHOLDER);
		const sendButton = screen.getByRole("button", { name: "送信" });

		// 空メッセージ
		await user.click(sendButton);
		expect(handleSend).not.toHaveBeenCalled();

		// 空白のみ
		await user.type(input, "   ");
		await user.click(sendButton);
		expect(handleSend).not.toHaveBeenCalled();
	});

	it("should trim whitespace from messages", async () => {
		const user = userEvent.setup();
		const handleSend = vi.fn();
		render(<MessageInput onSend={handleSend} />);

		const input = screen.getByPlaceholderText(DEFAULT_PLACEHOLDER);

		await user.type(input, "  Test message  ");
		// Command+Enterで送信
		fireEvent.keyDown(input, { key: "Enter", metaKey: true });

		expect(handleSend).toHaveBeenCalledWith("Test message", undefined);
	});

	it("should disable input and button when disabled prop is true", () => {
		render(<MessageInput onSend={vi.fn()} disabled={true} />);

		const input = screen.getByPlaceholderText(DEFAULT_PLACEHOLDER);
		const sendButton = screen.getByRole("button", { name: "送信" });

		expect(input).toBeDisabled();
		expect(sendButton).toBeDisabled();
	});

	it("should not send message when disabled", async () => {
		const user = userEvent.setup();
		const handleSend = vi.fn();
		render(<MessageInput onSend={handleSend} disabled={true} />);

		const input = screen.getByPlaceholderText(DEFAULT_PLACEHOLDER);

		await user.type(input, "Test message");
		fireEvent.keyDown(input, { key: "Enter", metaKey: true });

		expect(handleSend).not.toHaveBeenCalled();
	});

	it("should use custom placeholder", () => {
		render(<MessageInput onSend={vi.fn()} placeholder="カスタム入力..." />);

		expect(screen.getByPlaceholderText("カスタム入力...")).toBeInTheDocument();
	});

	it("should disable send button when input is empty", () => {
		render(<MessageInput onSend={vi.fn()} />);

		const sendButton = screen.getByRole("button", { name: "送信" });
		expect(sendButton).toBeDisabled();
	});

	it("should enable send button when input has text", async () => {
		const user = userEvent.setup();
		render(<MessageInput onSend={vi.fn()} />);

		const input = screen.getByPlaceholderText(DEFAULT_PLACEHOLDER);
		const sendButton = screen.getByRole("button", { name: "送信" });

		expect(sendButton).toBeDisabled();

		await user.type(input, "Test");
		expect(sendButton).not.toBeDisabled();
	});
});
