export function computeStatus(sowingDate: string | null, plantingDate: string | null, harvestDate: string | null): string {
	if (harvestDate) return 'harvested';
	if (plantingDate) return 'planted';
	if (sowingDate) return 'sown';
	return 'planned';
}
