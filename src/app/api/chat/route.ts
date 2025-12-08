import type { NextRequest } from "next/server";
import { chatAgent } from "@/lib/mastra";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
	message: string;
	sessionId: string;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as ChatRequestBody;
		const { message, sessionId } = body;

		if (!message || !sessionId) {
			return new Response(
				JSON.stringify({ error: "Message and sessionId are required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Get or create conversation
		let conversation = await prisma.conversation.findFirst({
			where: { sessionId },
			include: { messages: true },
		});

		if (!conversation) {
			conversation = await prisma.conversation.create({
				data: { sessionId },
				include: { messages: true },
			});
		}

		// Save user message to database
		await prisma.message.create({
			data: {
				conversationId: conversation.id,
				role: "user",
				content: message,
			},
		});

		// Get conversation history for context
		const conversationHistory = conversation.messages.map((msg) => ({
			role: msg.role as "user" | "assistant",
			content: msg.content,
		}));

		// Add current user message
		conversationHistory.push({ role: "user", content: message });

		// Stream response from Mastra agent
		const stream = await chatAgent.stream(conversationHistory);

		// Create a ReadableStream to send SSE
		const encoder = new TextEncoder();
		let fullResponse = "";

		const readableStream = new ReadableStream({
			async start(controller) {
				try {
					// Stream the response chunks
					for await (const chunk of stream.textStream) {
						fullResponse += chunk;
						const data = JSON.stringify({ content: chunk });
						controller.enqueue(encoder.encode(`data: ${data}\n\n`));
					}

					// Save assistant message to database
					await prisma.message.create({
						data: {
							conversationId: conversation.id,
							role: "assistant",
							content: fullResponse,
						},
					});

					// Send done signal
					controller.enqueue(encoder.encode("data: [DONE]\n\n"));
					controller.close();
				} catch (error) {
					console.error("Streaming error:", error);
					const errorData = JSON.stringify({
						error: "Error during streaming",
					});
					controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
					controller.close();
				}
			},
		});

		return new Response(readableStream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache, no-transform",
				Connection: "keep-alive",
				"X-Accel-Buffering": "no",
			},
		});
	} catch (error) {
		console.error("Chat API error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Internal server error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
