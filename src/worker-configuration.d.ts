/* eslint-disable */
// Generated from wrangler.jsonc with `wrangler types --include-runtime=false`.
// Platform types use qualified imports to avoid adding Worker globals to browser code.
interface __BaseEnv_Env {
	SESSION: import("@cloudflare/workers-types").KVNamespace;
	IMAGES: import("@cloudflare/workers-types").ImagesBinding;
	ASSETS: import("@cloudflare/workers-types").Fetcher;
	VITE_STRAPI_URL: string;
	RESEND_API_KEY: string;
	ORS_API_KEY: string;
	STRAPI_API_TOKEN: string;
	FORM_RATE_LIMITER: import("@cloudflare/workers-types").DurableObjectNamespace<import("./worker").FormRateLimiter>;
}
declare namespace Cloudflare {
	interface GlobalProps {
		mainModule: typeof import("./worker");
		durableNamespaces: "FormRateLimiter";
	}
	interface Env extends __BaseEnv_Env {}
}
interface Env extends __BaseEnv_Env {}
