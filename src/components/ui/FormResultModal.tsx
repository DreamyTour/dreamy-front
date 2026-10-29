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

	return (
		<dialog
			ref={dialog}
			aria-labelledby={titleId}
			onClose={close}
			className="w-[min(92vw,31rem)] rounded-xl border-0 bg-white p-0 text-left text-foreground shadow-2xl backdrop:bg-slate-950/45"
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
						<p className="mt-3 text-sm leading-6 text-slate-600">
							{result?.message}
						</p>
					</div>
				</div>
				<div className="mt-7 flex justify-end">
					<button
						type="button"
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
	);
}
