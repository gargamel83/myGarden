export const CARE_TIP_KEYS = ['watering', 'fertilizing', 'pruning', 'harvest', 'misc', 'mulching', 'staking', 'thinning', 'storage'] as const;

export type CareTipKey = (typeof CARE_TIP_KEYS)[number];

export type CareTips = Partial<Record<CareTipKey, string>>;

/**
 * Parse the `plants.careTips` JSON column defensively: anything invalid
 * (null, broken JSON, array, wrong value types) yields an empty object.
 */
export function parseCareTips(raw: string | null | undefined): CareTips {
	if (!raw) return {};
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return {};
	}
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

	const result: CareTips = {};
	for (const key of CARE_TIP_KEYS) {
		const value = (parsed as Record<string, unknown>)[key];
		if (typeof value === 'string' && value.trim()) {
			result[key] = value.trim();
		}
	}
	return result;
}

/**
 * Serialize care tips for storage: only known keys, trimmed, empty values dropped.
 */
export function serializeCareTips(tips: CareTips | null | undefined): string {
	const clean: CareTips = {};
	if (tips) {
		for (const key of CARE_TIP_KEYS) {
			const value = tips[key];
			if (typeof value === 'string' && value.trim()) clean[key] = value.trim();
		}
	}
	return JSON.stringify(clean);
}

export function hasCareTips(tips: CareTips | null | undefined): boolean {
	return CARE_TIP_KEYS.some((key) => typeof tips?.[key] === 'string' && !!tips[key]?.trim());
}

