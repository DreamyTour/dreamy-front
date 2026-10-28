// Import platform types without adding Worker globals to browser components.
declare module "cloudflare:workers" {
	export const env: Cloudflare.Env;
	export const DurableObject: typeof import("@cloudflare/workers-types").CloudflareWorkersModule.DurableObject;
}
