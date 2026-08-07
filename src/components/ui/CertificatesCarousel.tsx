import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
	useEffect,
	useId,
	useRef,
	useState,
	type KeyboardEvent,
	type MouseEvent,
} from "react";

export interface Certificate {
	src: string;
	title: string;
	subtitle: string;
	status: string;
}

interface CertificatesCarouselProps {
	certificates: Certificate[];
	previousLabel: string;
	nextLabel: string;
	dialogLabel: string;
	closeLabel: string;
	instructions: string;
}

const wraps = (index: number, length: number) =>
	(index + length) % length;

export default function CertificatesCarousel({
	certificates,
	previousLabel,
	nextLabel,
	dialogLabel,
	closeLabel,
	instructions,
}: CertificatesCarouselProps) {
	const instructionsId = useId();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const canMove = certificates.length > 1;
	const panelStarts = [currentIndex];

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		if (selectedIndex === null) {
			if (dialog.open) dialog.close();
			return;
		}

		if (!dialog.open) dialog.showModal();
	}, [selectedIndex]);

	const move = (direction: number) => {
		if (!canMove) return;

		setCurrentIndex((current) =>
			wraps(current + direction, certificates.length),
		);
	};

	const openCertificate = (
		event: MouseEvent<HTMLAnchorElement>,
		index: number,
	) => {
		event.preventDefault();
		setSelectedIndex(index);
	};
	const moveLightbox = (direction: number) => {
		setSelectedIndex((current) =>
			current === null ? current : wraps(current + direction, certificates.length),
		);
	};
	const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
		if (event.key === "ArrowLeft") {
			event.preventDefault();
			moveLightbox(-1);
		} else if (event.key === "ArrowRight") {
			event.preventDefault();
			moveLightbox(1);
		}
	};

	if (!certificates.length) return null;

	return (
		<div className="not-prose">
			<p className="sr-only" id={instructionsId}>
				{instructions}
			</p>

			<div className="relative overflow-hidden px-1 py-2" aria-describedby={instructionsId}>
				<div>
					{panelStarts.map((panelStart, panelIndex) => {
						const isOffscreen = false;

						return (
							<div
								key={`${panelIndex}-${panelStart}`}
								className="grid grid-cols-1 gap-5 px-1 md:grid-cols-2 lg:grid-cols-3"
							>
								{[0, 1, 2].map((offset) => {
									const certificateIndex = wraps(
										panelStart + offset,
										certificates.length,
									);
									const certificate = certificates[certificateIndex];
									const visibilityClass =
										offset === 0
											? "block"
											: offset === 1
												? "hidden md:block"
												: "hidden lg:block";

									return (
										<article key={`${offset}-${certificate.src}`} className={visibilityClass}>
											<a
												href={certificate.src}
												onClick={(event) => openCertificate(event, certificateIndex)}
												aria-haspopup="dialog"
												tabIndex={isOffscreen ? -1 : undefined}
												className="group block h-full overflow-hidden rounded-2xl border border-border bg-card text-left text-foreground shadow-lg shadow-black/5 outline-none transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-3 focus-visible:ring-secondary motion-reduce:transition-none"
											>
												<span className="relative grid aspect-[3/4] place-items-center overflow-hidden bg-white">
													<img
														src={certificate.src}
														alt={certificate.title}
														width={640}
														height={480}
														loading="lazy"
														decoding="async"
														className="h-full w-full object-contain p-2"
													/>
												</span>
												<span className="grid gap-1 border-t border-border p-4">
													<strong className="text-lg text-primary">{certificate.title}</strong>
													<span className="text-sm text-muted-foreground">
														{certificate.subtitle}
													</span>
												</span>
											</a>
										</article>
									);
								})}
							</div>
						);
					})}
				</div>

				{canMove && (
					<>
						<button
							type="button"
							onClick={() => move(-1)}
							aria-label={previousLabel}
							className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-primary shadow-lg transition hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-secondary disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"
						>
							<ChevronLeft aria-hidden="true" />
						</button>
						<button
							type="button"
							onClick={() => move(1)}
							aria-label={nextLabel}
							className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-primary shadow-lg transition hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-secondary disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"
						>
							<ChevronRight aria-hidden="true" />
						</button>
					</>
				)}
			</div>

			<dialog
				ref={dialogRef}
				onClose={() => setSelectedIndex(null)}
				onClick={(event) => {
					if (event.target === event.currentTarget) setSelectedIndex(null);
				}}
				onKeyDown={handleDialogKeyDown}
				aria-label={dialogLabel}
				className="m-auto w-fit max-w-[92vw] overflow-visible border-0 bg-transparent p-0 backdrop:bg-black/80"
			>
				{selectedIndex !== null && (
					<div className="relative flex w-fit max-w-full flex-col items-center">
						<button
							type="button"
							onClick={() => setSelectedIndex(null)}
							aria-label={closeLabel}
							className="absolute -right-3 -top-3 z-10 grid size-11 place-items-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg transition hover:bg-secondary focus-visible:ring-3 focus-visible:ring-white motion-reduce:transition-none"
						>
							<X aria-hidden="true" />
						</button>
						<div className="inline-block max-w-full bg-[#f7f0df] p-[clamp(0.4rem,1vw,0.8rem)] ring-[clamp(0.16rem,0.35vw,0.28rem)] ring-[#c6a574] ring-offset-[0.2rem] ring-offset-[#2b1a13] shadow-[0_1.75rem_4rem_rgba(0,0,0,0.52)]">
							<img
								src={certificates[selectedIndex].src}
								alt={certificates[selectedIndex].title}
								className="block h-auto max-h-[calc(92vh-8.5rem)] w-auto max-w-full border-[clamp(0.55rem,1.35vw,1rem)] border-[#4a2e20] bg-[#f7f0df] object-contain"
							/>
						</div>
						<div className="mt-5 flex items-center justify-center gap-3">
							<button
								type="button"
								onClick={() => moveLightbox(-1)}
								aria-label={previousLabel}
								className="grid size-11 place-items-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg transition hover:bg-secondary focus-visible:ring-3 focus-visible:ring-white motion-reduce:transition-none"
							>
								<ChevronLeft aria-hidden="true" />
							</button>
							<button
								type="button"
								onClick={() => moveLightbox(1)}
								aria-label={nextLabel}
								className="grid size-11 place-items-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg transition hover:bg-secondary focus-visible:ring-3 focus-visible:ring-white motion-reduce:transition-none"
							>
								<ChevronRight aria-hidden="true" />
							</button>
						</div>
						<p className="mt-3 text-center text-sm font-bold text-white">
							{certificates[selectedIndex].title}
						</p>
					</div>
				)}
			</dialog>
		</div>
	);
}
