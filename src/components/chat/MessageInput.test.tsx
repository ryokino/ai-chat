import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessageInput } from "./MessageInput";

describe("MessageInput component", () => {
	it("should render input field and send button", () => {
		render(<MessageInput onSend={vi.fn()} />);

		expect(
			screen.getByPlaceholderText("メッセージを入力..."),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "送信" })).toBeInTheDocument();
	});

	it("should allow text input", async () => {
		const user = userEvent.setup();
		render(<MessageInput onSend={vi.fn()} />);

		const input = screen.getByPlaceholderText("メッセージを入力...");
		await user.type(input, "Hello");

		expect(input).toHaveValue("Hello");
	});

	it("should call onSend when send button is clicked", async () => {
		const user = userEvent.setup();
		const handleSend = vi.fn();
		render(<MessageInput onSend={handleSend} />);

		const input = screen.getByPlaceholderText("メッセージを入力...");
		const sendButton = screen.getByRole("button", { name: "送信" });

		await user.type(input, "Test message");
		await user.click(sendButton);

		expect(handleSend).toHaveBeenCalledWith("Test message");
		expect(input).toHaveValue("");
	});

	it("should call onSend when Enter key is pressed", async () => {
		const user = userEvent.setup();
		const handleSend = vi.fn();
		render(<MessageInput onSend={handleSend} />);

		const input = screen.getByPlaceholderText("メッセージを入力...");

		await user.type(input, "Test message");
		await user.keyboard("{Enter}");

		expect(handleSend).toHaveBeenCalledWith("Test message");
		expect(input).toHaveValue("");
	});

	it("should not send empty or whitespace-only messages", async () => {
		const user = userEvent.setup();
		const handleSend = vi.fn();
		render(<MessageInput onSend={handleSend} />);

		const input = screen.getByPlaceholderText("メッセージを入力...");
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

		const input = screen.getByPlaceholderText("メッセージを入力...");

		await user.type(input, "  Test message  ");
		await user.keyboard("{Enter}");

		expect(handleSend).toHaveBeenCalledWith("Test message");
	});

	it("should disable input and button when disabled prop is true", () => {
		render(<MessageInput onSend={vi.fn()} disabled={true} />);

		const input = screen.getByPlaceholderText("メッセージを入力...");
		const sendButton = screen.getByRole("button", { name: "送信" });

		expect(input).toBeDisabled();
		expect(sendButton).toBeDisabled();
	});

	it("should not send message when disabled", async () => {
		const user = userEvent.setup();
		const handleSend = vi.fn();
		render(<MessageInput onSend={handleSend} disabled={true} />);

		const input = screen.getByPlaceholderText("メッセージを入力...");

		await user.type(input, "Test message");
		await user.keyboard("{Enter}");

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

		const input = screen.getByPlaceholderText("メッセージを入力...");
		const sendButton = screen.getByRole("button", { name: "送信" });

		expect(sendButton).toBeDisabled();

		await user.type(input, "Test");
		expect(sendButton).not.toBeDisabled();
	});
});
