const initializeCertificateGalleries = () => {
	document
		.querySelectorAll<HTMLElement>("[data-certificate-gallery]")
		.forEach((gallery) => {
			if (gallery.dataset.certificateGalleryInitialized === "true") return;
			gallery.dataset.certificateGalleryInitialized = "true";

			const dialog = gallery.querySelector<HTMLDialogElement>(
				"[data-certificate-dialog]",
			);
			const image = gallery.querySelector<HTMLImageElement>(
				"[data-certificate-dialog-image]",
			);
			const title = gallery.querySelector<HTMLElement>(
				"[data-certificate-dialog-title]",
			);

			gallery.addEventListener("click", (event) => {
				const target = event.target;
				if (!(target instanceof Element)) return;

				const trigger = target.closest<HTMLAnchorElement>(
					"[data-certificate-trigger]",
				);
				if (!trigger || !dialog || !image || typeof dialog.showModal !== "function") {
					return;
				}

				const src = trigger.dataset.certificateSrc;
				if (!src) return;

				event.preventDefault();
				const label = trigger.dataset.certificateTitle || trigger.textContent || "";
				image.src = src;
				image.alt = label;
				if (title) title.textContent = label;
				if (!dialog.open) dialog.showModal();
			});

			if (!dialog) return;

			dialog.addEventListener("click", (event) => {
				if (event.target === dialog) dialog.close();
			});

			dialog.addEventListener("close", () => {
				if (image) {
					image.removeAttribute("src");
					image.alt = "";
				}
				if (title) title.textContent = "";
			});
		});
};

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initializeCertificateGalleries, {
		once: true,
	});
} else {
	initializeCertificateGalleries();
}

document.addEventListener("astro:page-load", initializeCertificateGalleries);
