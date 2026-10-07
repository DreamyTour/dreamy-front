import worker from "../../src/worker";

export default {
	async fetch(...args: Parameters<typeof worker.fetch>) {
		const result = await worker.fetch(...args);
		const response = new Response(result.body, result);
		response.headers.set("X-Test-Worker-Invoked", "yes");
		return response;
	},
};
