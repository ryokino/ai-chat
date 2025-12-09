"use client";

import { Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
	type AISettings,
	DEFAULT_AI_SETTINGS,
	MAX_TOKENS_OPTIONS,
} from "@/lib/settings";

interface SettingsDialogProps {
	settings: AISettings;
	onUpdate: (settings: Partial<AISettings>) => void;
	onReset: () => void;
}

export function SettingsDialog({
	settings,
	onUpdate,
	onReset,
}: SettingsDialogProps) {
	const [open, setOpen] = useState(false);
	const [localSettings, setLocalSettings] = useState<AISettings>(settings);

	// 外部から設定が変更された場合にローカル状態を更新
	useEffect(() => {
		setLocalSettings(settings);
	}, [settings]);

	const handleSystemPromptChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setLocalSettings((prev) => ({ ...prev, systemPrompt: e.target.value }));
		},
		[],
	);

	const handleMaxTokensChange = useCallback((value: string) => {
		setLocalSettings((prev) => ({ ...prev, maxTokens: Number(value) }));
	}, []);

	const handleTemperatureChange = useCallback((value: number[]) => {
		setLocalSettings((prev) => ({ ...prev, temperature: value[0] }));
	}, []);

	const handleSave = useCallback(() => {
		onUpdate(localSettings);
		setOpen(false);
	}, [localSettings, onUpdate]);

	const handleReset = useCallback(() => {
		setLocalSettings(DEFAULT_AI_SETTINGS);
		onReset();
	}, [onReset]);

	const handleCancel = useCallback(() => {
		setLocalSettings(settings);
		setOpen(false);
	}, [settings]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon" title="AI設定">
					<Settings className="h-4 w-4" />
					<span className="sr-only">AI設定</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>AI設定</DialogTitle>
					<DialogDescription>
						AIの動作をカスタマイズできます。設定は自動的に保存されます。
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* システムプロンプト */}
					<div className="space-y-2">
						<Label htmlFor="system-prompt">システムプロンプト</Label>
						<Textarea
							id="system-prompt"
							value={localSettings.systemPrompt}
							onChange={handleSystemPromptChange}
							placeholder="AIに与える指示を入力してください..."
							className="min-h-[200px] resize-y"
						/>
						<p className="text-xs text-muted-foreground">
							AIの役割や振る舞いを定義します。
						</p>
					</div>

					{/* レスポンス長 */}
					<div className="space-y-2">
						<Label htmlFor="max-tokens">レスポンス長 (max_tokens)</Label>
						<Select
							value={String(localSettings.maxTokens)}
							onValueChange={handleMaxTokensChange}
						>
							<SelectTrigger id="max-tokens">
								<SelectValue placeholder="レスポンス長を選択" />
							</SelectTrigger>
							<SelectContent>
								{MAX_TOKENS_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={String(option.value)}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							AIの応答の最大長を設定します。長いほど詳細な回答が可能です。
						</p>
					</div>

					{/* Temperature */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="temperature">
								Temperature: {localSettings.temperature.toFixed(1)}
							</Label>
						</div>
						<Slider
							id="temperature"
							value={[localSettings.temperature]}
							onValueChange={handleTemperatureChange}
							min={0}
							max={1}
							step={0.1}
							className="w-full"
						/>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>正確性重視 (0.0)</span>
							<span>創造性重視 (1.0)</span>
						</div>
						<p className="text-xs text-muted-foreground">
							値が低いほど一貫性のある応答、高いほど多様な応答になります。
						</p>
					</div>
				</div>

				<DialogFooter className="flex-col gap-2 sm:flex-row">
					<Button
						variant="outline"
						onClick={handleReset}
						className="w-full sm:w-auto"
					>
						デフォルトに戻す
					</Button>
					<div className="flex gap-2">
						<Button variant="ghost" onClick={handleCancel}>
							キャンセル
						</Button>
						<Button onClick={handleSave}>保存</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
