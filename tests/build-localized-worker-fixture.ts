import { createRouteMap } from "../src/lib/localizedRouteResolver";

const map = createRouteMap([
	{ kind: "post", documentId: "only-es", locale: "es", slug: "solo-es" },
	{
		kind: "post",
		documentId: "ambiguous-one",
		locale: "es",
		slug: "ambiguous",
	},
	{
		kind: "post",
		documentId: "ambiguous-two",
		locale: "pt",
		slug: "ambiguous",
	},
	{
		kind: "tour",
		documentId: "ambiguous-tour",
		locale: "es",
		slug: "ambiguous-root",
	},
	{
		kind: "page",
		documentId: "ambiguous-page",
		locale: "pt",
		slug: "ambiguous-root",
	},
	{
		kind: "category",
		documentId: "paginated",
		locale: "es",
		slug: "categoria-es",
		pages: 3,
	},
	{
		kind: "category",
		documentId: "paginated",
		locale: "en",
		slug: "category-en",
		pages: 2,
	},
]);
const result = await Bun.build({
	entrypoints: ["tests/fixtures/localized-worker.ts"],
	target: "browser",
	format: "esm",
	plugins: [
		{
			name: "fixture-imports",
			setup(build) {
				build.onResolve({ filter: /^virtual:localized-route-map$/ }, () => ({
					path: "map",
					namespace: "fixture",
				}));
				build.onResolve({ filter: /^@astrojs\/cloudflare\/handler$/ }, () => ({
					path: "handler",
					namespace: "fixture",
				}));
				build.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
					contents:
						path === "map"
							? `export default ${JSON.stringify(map)}`
							: 'export async function handle(request) { return new Response(request.method === "HEAD" ? null : "Astro fixture: not found", { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "X-Test-Astro-Handler": "yes", "Cache-Control": "no-store" } }); }',
					loader: "js",
				}));
			},
		},
	],
});
if (!result.success) throw new Error(result.logs.join("\n"));
await Bun.write(process.argv[2], result.outputs[0]);
