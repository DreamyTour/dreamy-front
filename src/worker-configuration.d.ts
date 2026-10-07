/* eslint-disable */
// Generated from wrangler.jsonc with wrangler types --include-runtime=false.
interface __BaseEnv_Env {
	ASSETS: import("@cloudflare/workers-types").Fetcher;
}
declare namespace Cloudflare {
	interface GlobalProps {
		mainModule: typeof import("./worker");
	}
	interface Env extends __BaseEnv_Env {}
}
interface Env extends __BaseEnv_Env {}
