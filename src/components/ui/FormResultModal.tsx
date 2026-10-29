"use client";

import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type FormResultKind = "success" | "error" | "retry";

export interface FormResult {
	kind: FormResultKind;
	message: string;
}

export interface FormResultModalMessages {
	successTitle: string;
	errorTitle: string;
	retryTitle: string;
	closeLabel: string;
}

interface FormResultModalProps {
	result?: FormResult | null;
	messages: FormResultModalMessages;
	onClose?: () => void;
	onConfirm?: () => void;
	dialogId?: string;
}

interface FormResultEventDetail {
	dialogId?: string;
	result: FormResult;
}

type FormResultEvent = CustomEvent<FormResultEventDetail>;

declare global {
	interface Window {
		__dreamyFormResultQueue?: FormResultEventDetail[];
	}
}

function consumeQueuedResult(dialogId: string) {
	const queue = window.__dreamyFormResultQueue;
	if (!queue) return null;
	const index = queue.findIndex((item) => item.dialogId === dialogId);
	if (index < 0) return null;
	return queue.splice(index, 1)[0] ?? null;
}

/**
 * One native-dialog implementation for mail-form outcomes. Native dialogs
 * provide modality, Escape handling and focus restoration without a custom
 * focus trap. ContactForm (Astro) opens it through the documented event.
 */
export default function FormResultModal({
	result: controlledResult,
	messages,
	onClose,
	onConfirm,
	dialogId,
}: FormResultModalProps) {
	const dialog = useRef<HTMLDialogElement>(null);
	const generatedTitleId = useId();
	const titleId = dialogId ? `${dialogId}-title` : generatedTitleId;
	const [eventResult, setEventResult] = useState<FormResult | null>(null);
	const result = controlledResult ?? eventResult;

	useEffect(() => {
		if (!dialogId) return;
		const queued = consumeQueuedResult(dialogId);
		if (queued) setEventResult(queued.result);
		const openFromEvent = (event: Event) => {
			const detail = (event as FormResultEvent).detail;
			if (detail?.dialogId === dialogId && detail.result) {
				consumeQueuedResult(dialogId);
				setEventResult(detail.result);
			}
		};
		document.addEventListener("dreamy:form-result", openFromEvent);
		return () =>
			document.removeEventListener("dreamy:form-result", openFromEvent);
	}, [dialogId]);

	useEffect(() => {
		const element = dialog.current;
		if (result && element && !element.open) element.showModal();
	}, [result]);

	const close = () => {
		if (controlledResult === undefined) setEventResult(null);
		onClose?.();
	};
	const title =
		result?.kind === "success"
			? messages.successTitle
			: result?.kind === "retry"
				? messages.retryTitle
				: messages.errorTitle;
	const Icon =
		result?.kind === "success"
			? CheckCircle2
			: result?.kind === "retry"
				? Clock3
				: CircleAlert;
	const iconClass =
		result?.kind === "success"
			? "text-primary"
			: result?.kind === "retry"
				? "text-amber-600"
				: "text-secondary";
	const description = result?.message.trim() ?? "";
	const repeatsTitle =
		description.localeCompare(title, undefined, {
			sensitivity: "base",
		}) === 0;

	return (
		<>
			<style>{`
				dialog[data-form-result-modal]:modal { overscroll-behavior: contain; }
				dialog[data-form-result-modal]::backdrop {
					background: rgb(15 23 42 / 0.45);
					overflow: hidden;
					overscroll-behavior: contain;
				}
			`}</style>
			<dialog
				ref={dialog}
				data-form-result-modal
				aria-labelledby={titleId}
				onClose={close}
				style={{
					position: "fixed",
					inset: 0,
					margin: "auto",
					width: "min(92vw, 31rem)",
					maxHeight: "calc(100dvh - 2rem)",
					overflowY: "auto",
				}}
				className="rounded-xl border-0 bg-white p-0 text-left text-foreground shadow-2xl"
			>
				<div className="p-6 sm:p-8">
					<div className="flex items-start gap-4">
						<Icon
							className={`mt-0.5 size-8 shrink-0 ${iconClass}`}
							aria-hidden="true"
						/>
						<div>
							<h2 id={titleId} className="text-xl font-bold">
								{title}
							</h2>
							{description && !repeatsTitle ? (
								<p className="mt-3 text-sm leading-6 text-slate-600">
									{description}
								</p>
							) : null}
						</div>
					</div>
					<div className="mt-7 flex justify-end">
						<button
							type="button"
							autoFocus
							onClick={() => {
								if (onConfirm) onConfirm();
								else dialog.current?.close();
							}}
							className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
						>
							{messages.closeLabel}
						</button>
					</div>
				</div>
			</dialog>
		</>
	);
}
