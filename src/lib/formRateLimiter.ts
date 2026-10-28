import { DurableObject } from "cloudflare:workers";

/** One object per endpoint/IP: serialized, persistent sliding ten-minute window. */
export class FormRateLimiter extends DurableObject {
	async consume() {
		return this.ctx.storage.transaction(async (storage) => {
			const now = Date.now();
			const recent = ((await storage.get<number[]>("attempts")) ?? []).filter(
				(time) => time > now - 600_000,
			);
			if (recent.length >= 5) return false;
			recent.push(now);
			await storage.put("attempts", recent);
			await storage.setAlarm(now + 600_000);
			return true;
		});
	}

	async alarm() {
		await this.ctx.storage.deleteAll();
	}
}
