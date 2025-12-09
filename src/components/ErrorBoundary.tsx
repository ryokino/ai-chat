"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

/**
 * ErrorBoundary コンポーネント
 * React アプリケーションでキャッチされないエラーをキャッチして、フォールバックUIを表示
 */
export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="flex items-center justify-center min-h-screen p-4">
						<Card className="max-w-md">
							<CardHeader>
								<CardTitle>エラーが発生しました</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-muted-foreground">
									予期しないエラーが発生しました。ページを再読み込みしてください。
								</p>
								<Button onClick={() => window.location.reload()}>
									ページを再読み込み
								</Button>
							</CardContent>
						</Card>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
