import { useCallback } from "react";

/** Mouse-only enhancement: touch, trackpads, scrollbars and keyboard stay native. */
export function useMouseDragScroll() {
	return useCallback((element: HTMLDivElement | null) => {
		if (!element) return;
		let gesture:
			| { id: number; x: number; y: number; scroll: number; dragging: boolean }
			| undefined;
		let suppressClick = false;
		let clickTimer: ReturnType<typeof setTimeout> | undefined;
		const finish = () => {
			const current = gesture;
			gesture = undefined;
			delete element.dataset.mouseDragging;
			if (current && element.hasPointerCapture(current.id))
				element.releasePointerCapture(current.id);
			clearTimeout(clickTimer);
			clickTimer = setTimeout(() => {
				suppressClick = false;
			}, 0);
		};
		const down = (event: PointerEvent) => {
			if (
				event.pointerType !== "mouse" ||
				event.button !== 0 ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey
			)
				return;
			// Leave the native horizontal scrollbar available for dragging its thumb.
			const bounds = element.getBoundingClientRect();
			if (
				element.scrollWidth <= element.clientWidth ||
				event.clientY >= bounds.top + element.clientTop + element.clientHeight
			)
				return;
			clearTimeout(clickTimer);
			suppressClick = false;
			gesture = {
				id: event.pointerId,
				x: event.clientX,
				y: event.clientY,
				scroll: element.scrollLeft,
				dragging: false,
			};
		};
		const move = (event: PointerEvent) => {
			if (!gesture || event.pointerId !== gesture.id) return;
			if (!(event.buttons & 1)) {
				finish();
				return;
			}
			const dx = event.clientX - gesture.x;
			const dy = event.clientY - gesture.y;
			if (!gesture.dragging) {
				if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
				if (Math.abs(dy) > Math.abs(dx)) {
					finish();
					return;
				}
				gesture.dragging = true;
				suppressClick = true;
				element.dataset.mouseDragging = "true";
				element.setPointerCapture(event.pointerId);
			}
			event.preventDefault();
			element.scrollLeft = gesture.scroll - dx;
		};
		const click = (event: MouseEvent) => {
			if (suppressClick && event.detail !== 0) {
				event.preventDefault();
				event.stopPropagation();
				suppressClick = false;
			}
		};
		const select = (event: Event) => {
			if (gesture) event.preventDefault();
		};
		element.addEventListener("pointerdown", down);
		element.addEventListener("pointermove", move);
		element.addEventListener("pointerup", finish);
		element.addEventListener("pointercancel", finish);
		element.addEventListener("lostpointercapture", finish);
		element.addEventListener("click", click, true);
		element.addEventListener("selectstart", select);
		window.addEventListener("blur", finish);
		return () => {
			element.removeEventListener("pointerdown", down);
			element.removeEventListener("pointermove", move);
			element.removeEventListener("pointerup", finish);
			element.removeEventListener("pointercancel", finish);
			element.removeEventListener("lostpointercapture", finish);
			element.removeEventListener("click", click, true);
			element.removeEventListener("selectstart", select);
			window.removeEventListener("blur", finish);
			finish();
			clearTimeout(clickTimer);
		};
	}, []);
}
