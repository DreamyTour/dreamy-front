/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly RESEND_API_KEY?: string;
	readonly RESEND_FROM_EMAIL?: string;
	readonly RESEND_TO_EMAIL?: string;
	readonly STRAPI_URL?: string;
	readonly VITE_STRAPI_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
