/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
	readonly ORS_API_KEY?: string;
	readonly PUBLIC_MAPTILER_KEY?: string;
	readonly STRAPI_URL?: string;
	readonly VITE_STRAPI_URL?: string;
}

declare namespace Cloudflare {
	interface Env {
		TURNSTILE_SECRET_KEY?: string;
		DRY_RUN?: string;
		RESEND_API_KEY?: string;
		RESEND_FROM_EMAIL?: string;
		RESEND_TO_EMAIL?: string;
	}
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
