/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
	readonly ORS_API_KEY?: string;
	readonly PUBLIC_MAPTILER_KEY?: string;
	readonly RESEND_API_KEY?: string;
	readonly RESEND_FROM_EMAIL?: string;
	readonly RESEND_TO_EMAIL?: string;
	readonly STRAPI_URL?: string;
	readonly VITE_STRAPI_URL?: string;
}

declare namespace Cloudflare {
  interface Env { TURNSTILE_SECRET_KEY?: string; DRY_RUN?: string; }
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
