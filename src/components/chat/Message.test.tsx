import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Message } from "./Message";

describe("Message component", () => {
	const mockDate = new Date("2024-01-01T12:00:00");

	it("should render user message correctly", () => {
		render(
			// biome-ignore lint/a11y/useValidAriaRole: role prop is for Message component, not ARIA
			<Message id="1" role="user" content="Hello, AI!" createdAt={mockDate} />,
		);

		expect(screen.getByText("Hello, AI!")).toBeInTheDocument();
		expect(screen.getByText("12:00")).toBeInTheDocument();
	});

	it("should render assistant message correctly", () => {
		render(
			// biome-ignore lint/a11y/useValidAriaRole: role prop is for Message component, not ARIA
			<Message
				id="2"
				role="assistant"
				content="Hello, human!"
				createdAt={mockDate}
			/>,
		);

		expect(screen.getByText("Hello, human!")).toBeInTheDocument();
		expect(screen.getByText("12:00")).toBeInTheDocument();
	});

	it("should display timestamp in Japanese format", () => {
		const date = new Date("2024-01-01T09:30:00");
		// biome-ignore lint/a11y/useValidAriaRole: role prop is for Message component, not ARIA
		render(<Message id="3" role="user" content="Test" createdAt={date} />);

		expect(screen.getByText("09:30")).toBeInTheDocument();
	});

	it("should render multi-line content with whitespace preserved", () => {
		const multiLineContent = "Line 1\nLine 2\nLine 3";
		render(
			// biome-ignore lint/a11y/useValidAriaRole: role prop is for Message component, not ARIA
			<Message
				id="4"
				role="assistant"
				content={multiLineContent}
				createdAt={mockDate}
			/>,
		);

		const contentElement = screen.getByText(/Line 1/);
		expect(contentElement).toHaveClass("whitespace-pre-wrap");
	});

	it("should apply different styles for user and assistant messages", () => {
		const { container: userContainer } = render(
			// biome-ignore lint/a11y/useValidAriaRole: role prop is for Message component, not ARIA
			<Message
				id="5"
				role="user"
				content="User message"
				createdAt={mockDate}
			/>,
		);

		const { container: assistantContainer } = render(
			// biome-ignore lint/a11y/useValidAriaRole: role prop is for Message component, not ARIA
			<Message
				id="6"
				role="assistant"
				content="Assistant message"
				createdAt={mockDate}
			/>,
		);

		// ユーザーメッセージは flex-row-reverse
		expect(
			userContainer.querySelector(".flex-row-reverse"),
		).toBeInTheDocument();

		// アシスタントメッセージは flex-row
		expect(assistantContainer.querySelector(".flex-row")).toBeInTheDocument();
	});
});
