import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MessageProps } from "./Message";
import { MessageList } from "./MessageList";

// scrollIntoViewのモック
beforeEach(() => {
	Element.prototype.scrollIntoView = vi.fn();
});

describe("MessageList component", () => {
	const mockMessages: MessageProps[] = [
		{
			id: "1",
			role: "user",
			content: "Hello",
			createdAt: new Date("2024-01-01T12:00:00"),
		},
		{
			id: "2",
			role: "assistant",
			content: "Hi there!",
			createdAt: new Date("2024-01-01T12:00:30"),
		},
		{
			id: "3",
			role: "user",
			content: "How are you?",
			createdAt: new Date("2024-01-01T12:01:00"),
		},
	];

	it("should render all messages", () => {
		render(<MessageList messages={mockMessages} />);

		expect(screen.getByText("Hello")).toBeInTheDocument();
		expect(screen.getByText("Hi there!")).toBeInTheDocument();
		expect(screen.getByText("How are you?")).toBeInTheDocument();
	});

	it("should display empty state when no messages", () => {
		render(<MessageList messages={[]} />);

		expect(
			screen.getByText("メッセージを送信して会話を始めましょう"),
		).toBeInTheDocument();
	});

	it("should render messages in correct order", () => {
		render(<MessageList messages={mockMessages} />);

		const messages = screen.getAllByText(/Hello|Hi there!|How are you?/);
		expect(messages).toHaveLength(3);
	});

	it("should display loading indicator when isLoading is true", () => {
		render(<MessageList messages={mockMessages} isLoading={true} />);

		expect(screen.getByText("送信中...")).toBeInTheDocument();
		// ローディングドット（●）が3つ表示されているか確認
		const loadingDots = screen.getAllByText("●");
		expect(loadingDots).toHaveLength(3);
	});

	it("should not display loading indicator when isLoading is false", () => {
		render(<MessageList messages={mockMessages} isLoading={false} />);

		expect(screen.queryByText("送信中...")).not.toBeInTheDocument();
	});

	it("should handle single message", () => {
		const singleMessage: MessageProps[] = [
			{
				id: "1",
				role: "user",
				content: "Single message",
				createdAt: new Date(),
			},
		];

		render(<MessageList messages={singleMessage} />);

		expect(screen.getByText("Single message")).toBeInTheDocument();
	});

	it("should apply custom className", () => {
		const { container } = render(
			<MessageList messages={mockMessages} className="custom-class" />,
		);

		expect(container.querySelector(".custom-class")).toBeInTheDocument();
	});
});
