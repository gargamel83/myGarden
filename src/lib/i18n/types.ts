export type Translations = {
	[key: string]: string | Translations | PluralForm;
};

export interface PluralForm {
	one: string;
	other: string;
}
