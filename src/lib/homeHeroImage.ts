import mobileImage from "@/assets/dreamy-tours-mobile-768.avif";
import largeMobileImage from "@/assets/dreamy-tours-mobile-1080.avif";

// Share the responsive source with the head preload to avoid duplicate downloads.
export const homeMobileHeroImage = {
	src: mobileImage.src,
	srcset: `${mobileImage.src} ${mobileImage.width}w, ${largeMobileImage.src} ${largeMobileImage.width}w`,
	sizes: "100vw",
	type: "image/avif",
	media: "(max-width: 767px)",
};
