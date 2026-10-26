import { fileURLToPath } from 'url';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { db } from './index';
import { diseases } from './schema';
import { eq } from 'drizzle-orm';

type DiseaseSeed = typeof diseases.$inferInsert;
type SeedDb = BetterSQLite3Database<typeof import('./schema')>;

export const diseaseSeeds: DiseaseSeed[] = [
	{
		name: 'Mildiou',
		latinName: 'Phytophthora infestans',
		symptoms: 'Taches huileuses vert foncé à brunes sur les feuilles, bordées d\'un duvet blanc sur la face inférieure. Les tiges noircissent et les fruits se couvrent de taches brunes fermes.',
		causes: 'Champignon-oomycète favorisé par une humidité élevée, des feuillages mouillés et des températures douces (15-25 °C). Se propage par les spores portées par le vent et la pluie.',
		treatments: 'Arracher et brûler les parties atteintes, ne pas composter. Pulvériser de la bouillie bordelaise (cuivre) en préventif, ou un extrait de prêle. Éviter tout arrosage sur le feuillage.',
		prevention: 'Espacer les plants pour aérer, pailler pour éviter les éclaboussures, arroser au pied le matin. Choisir des variétés résistantes et pratiquer une rotation de 3 ans hors solanacées.',
		hostPlants: JSON.stringify(['Tomate', 'Pomme de terre', 'Aubergine', 'Poivron']),
		photos: JSON.stringify(['https://commons.wikimedia.org/wiki/Special:FilePath/Phytophthora_infestans-effects.jpg'])
	},
	{
		name: 'Oïdium',
		latinName: 'Erysiphe spp.',
		symptoms: 'Feutrage blanc poudreux sur la face supérieure des feuilles, comme saupoudré de farine. Les jeunes pousses se déforment et le feuillage jaunit puis sèche.',
		causes: 'Champignon favorisé par un air chaud et sec, des nuits fraîches et une humidité stagnante. Contrairement au mildiou, il n\'a pas besoin de feuilles mouillées.',
		treatments: 'Supprimer les feuilles atteintes, pulvériser une décoction de prêle ou du soufre (hors floraison), ou un mélange lait/eau (1 pour 9).',
		prevention: 'Aérer les cultures, éviter les excès d\'azote, arroser régulièrement sans mouiller le feuillage. Choisir des variétés tolérantes et ne pas serrer les plants.',
		hostPlants: JSON.stringify(['Courgette', 'Concombre', 'Melon', 'Vigne']),
		photos: JSON.stringify(['https://commons.wikimedia.org/wiki/Special:FilePath/UncinulaNecatorOnGrapes.JPG'])
	},
	{
		name: 'Rouille',
		latinName: 'Puccinia spp.',
		symptoms: 'Petites pustules orange à brun-rouille sur la face inférieure des feuilles, avec des taches jaunes sur la face supérieure. Les feuilles se dessèchent prématurément.',
		causes: 'Champignon favorisé par un feuillage humide, une atmosphère confinée et des températures douces. Il hiverne sur les résidus de culture et les plantes vivaces.',
		treatments: 'Retirer et détruire les feuilles atteintes, pulvériser une décoction de prêle ou de la bouillie bordelaise à faible dose. Renforcer les plants avec un purin d\'ortie dilué.',
		prevention: 'Rotation des cultures, élimination des résidus en fin de saison, espacement suffisant et arrosage au pied. Éviter l\'excès d\'humidité sur le feuillage.',
		hostPlants: JSON.stringify(['Haricot', 'Poireau', 'Ail', 'Betterave']),
		photos: JSON.stringify([])
	},
	{
		name: 'Pourriture grise',
		latinName: 'Botrytis cinerea',
		symptoms: 'Duvet gris cendré sur les fleurs, fruits et tiges, souvent accompagné d\'une pourriture molle brune. Les fraises et les fruits charnus moisissent rapidement.',
		causes: 'Champignon opportuniste favorisé par une forte humidité, une mauvaise aération et des blessures. Il s\'installe sur les fleurs fanées et les tissus affaiblis.',
		treatments: 'Supprimer les organes atteints avec un outil désinfecté, aérer la culture, réduire l\'arrosage. Pulvériser une décoction de prêle en préventif.',
		prevention: 'Pailler pour isoler les fruits du sol, espacer les plants, retirer les fleurs fanées. Éviter les blessures et les excès d\'azote.',
		hostPlants: JSON.stringify(['Fraisier', 'Tomate', 'Vigne', 'Courgette']),
		photos: JSON.stringify([])
	},
	{
		name: 'Cloque du pêcher',
		latinName: 'Taphrina deformans',
		symptoms: 'Feuilles cloquées, épaissies, rouges à violettes qui se recroquevillent puis tombent. Les jeunes pousses sont déformées et la fructification diminue.',
		causes: 'Champignon qui contamine les bourgeons lors des pluies de fin d\'hiver et de début de printemps. Une humidité prolongée entre 5 et 16 °C est idéale pour son développement.',
		treatments: 'Retirer et brûler les feuilles atteintes dès leur apparition (ne pas composter). Appliquer une bouillie bordelaise à la chute des feuilles puis au débourrement.',
		prevention: 'Tailler pour aérer la ramure, ramasser les feuilles mortes, éviter les arrosages sur le feuillage. Traiter au cuivre en fin d\'hiver avant l\'ouverture des bourgeons.',
		hostPlants: JSON.stringify(['Pêcher', 'Nectarinier', 'Abricotier']),
		photos: JSON.stringify([])
	},
	{
		name: 'Tavelure',
		latinName: 'Venturia inaequalis',
		symptoms: 'Taches olive à brun noir sur les feuilles et les fruits, souvent liégeuses et craquelées sur les pommes. Les feuilles atteintes jaunissent et tombent.',
		causes: 'Champignon qui hiverne dans les feuilles mortes et contamine au printemps lors des pluies. Les périodes humides et douces au printemps sont les plus propices.',
		treatments: 'Ramassez et détruire les feuilles mortes, supprimer les rameaux atteints. Pulvériser de la bouillie bordelaise au débourrement puis après la floraison.',
		prevention: 'Choisir des variétés résistantes, tailler pour aérer, ramasser les feuilles mortes en automne. Éviter les excès d\'humidité et les tailles trop sévères.',
		hostPlants: JSON.stringify(['Pommier', 'Poirier']),
		photos: JSON.stringify([])
	},
	{
		name: 'Alternariose',
		latinName: 'Alternaria spp.',
		symptoms: 'Taches brunes concentriques en forme de cible sur les feuilles et les fruits, entourées d\'un halo jaune. Les tissus atteints se nécrosent et les fruits pourrissent.',
		causes: 'Champignon favorisé par un temps chaud et humide, les blessures et les résidus de culture. Les spores se dispersent par le vent et les éclaboussures.',
		treatments: 'Retirer les feuilles atteintes, aérer et réduire l\'humidité. Pulvériser une décoction de prêle ou de la bouillie bordelaise en préventif.',
		prevention: 'Rotation de 3 ans, destruction des résidus, arrosage au pied et paillage. Éviter les blessures lors des récoltes.',
		hostPlants: JSON.stringify(['Tomate', 'Carotte', 'Pomme de terre']),
		photos: JSON.stringify([])
	},
	{
		name: 'Fusariose',
		latinName: 'Fusarium spp.',
		symptoms: 'Jaunissement puis flétrissement des feuilles, souvent d\'un seul côté de la plante. Les vaisseaux de la tige brunissent et la plante dépérit sans se rétablir.',
		causes: 'Champignon du sol qui pénètre par les racines blessées et se conserve plusieurs années dans la terre. Favorisé par les sols lourds, humides et les rotations courtes.',
		treatments: 'Arracher et détruire les plants atteints avec leurs racines. Aucun traitement curatif fiable : désinfecter les outils et éviter de replanter au même endroit.',
		prevention: 'Rotation longue (4 ans), sol bien drainé, greffage sur porte-greffe résistant. Éviter les excès d\'eau et les blessures racinaires.',
		hostPlants: JSON.stringify(['Tomate', 'Melon', 'Basilic', 'Aubergine']),
		photos: JSON.stringify([])
	},
	{
		name: 'Fonte des semis',
		latinName: 'Pythium spp. / Rhizoctonia solani',
		symptoms: 'Les jeunes plants s\'affaissent à la base, la tige devient fine et brune, et les semis disparaissent en quelques jours. Des moisissures blanchâtres apparaissent sur le terreau.',
		causes: 'Champignons du sol favorisés par un substrat trop humide, tassé, froid et une atmosphère confinée. Le semis trop dense aggrave la contamination.',
		treatments: 'Retirer les plants atteints, aérer et laisser sécher la surface du substrat. Saupoudrer de cannelle ou de charbon végétal, repiquer les plants sains.',
		prevention: 'Utiliser un terreau neuf et léger, semer clair, arroser par capillarité et maintenir une bonne ventilation. Désinfecter les godets et éviter l\'excès d\'humidité.',
		hostPlants: JSON.stringify(['Laitue', 'Betterave', 'Tomate', 'Chou']),
		photos: JSON.stringify([])
	},
	{
		name: 'Pucerons',
		latinName: 'Aphidoidea',
		symptoms: 'Amas de petits insectes verts, noirs ou gris sur les jeunes pousses et sous les feuilles. Le feuillage se recroqueville, devient collant (miellat) et attire les fourmis.',
		causes: 'Insectes piqueurs-suceurs qui se multiplient rapidement au printemps, favorisés par les excès d\'azote et l\'absence de prédateurs. Certains sont vecteurs de virus.',
		treatments: 'Lâcher des coccinelles ou des larves de chrysopes, pulvériser de l\'eau savonneuse noire ou un purin d\'ortie dilué. Renouveler tous les 3 jours.',
		prevention: 'Favoriser les auxiliaires (fleurs mellifères, hôtels à insectes), éviter les excès d\'azote et les plantations trop denses. Surveiller les jeunes pousses au printemps.',
		hostPlants: JSON.stringify(['Tomate', 'Haricot', 'Chou', 'Rosier']),
		photos: JSON.stringify([])
	},
	{
		name: 'Doryphore',
		latinName: 'Leptinotarsa decemlineata',
		symptoms: 'Coléoptère à rayures jaunes et noires, larves rouges ventrues qui dévorent les feuilles. Les plants de pomme de terre peuvent être défoliés en quelques jours.',
		causes: 'Insecte qui hiverne dans le sol et apparaît au printemps. Il se nourrit exclusivement de solanacées et pond ses œufs sous les feuilles.',
		treatments: 'Ramasser à la main les adultes, larves et pontes (jaunes orangés). Pulvériser du Bacillus thuringiensis var. tenebrionis sur les jeunes larves.',
		prevention: 'Rotation des cultures, buttage régulier, associations avec le haricot ou l\'œillet d\'Inde. Inspecter les feuilles dès le printemps et détruire les pontes.',
		hostPlants: JSON.stringify(['Pomme de terre', 'Aubergine', 'Tomate']),
		photos: JSON.stringify(['https://commons.wikimedia.org/wiki/Special:FilePath/Colorado_potato_beetle.jpg'])
	},
	{
		name: 'Limaces et escargots',
		latinName: 'Deroceras spp. / Helix spp.',
		symptoms: 'Feuilles perforées, jeunes plants sectionnés net et traces de bave argentée. Les dégâts sont surtout nocturnes et par temps humide.',
		causes: 'Mollusques attirés par l\'humidité, les abris frais (paillis épais, planches, herbes hautes) et les jeunes pousses tendres. Actifs la nuit et après la pluie.',
		treatments: 'Ramasser à la main au crépuscule, poser des pièges à bière, utiliser des barrières de cendre ou de coquilles d\'œufs broyées. Le phosphate de fer est autorisé en bio.',
		prevention: 'Arroser le matin, dégager les abords, attirer les hérissons et les oiseaux. Éviter les paillis trop épais autour des jeunes plants.',
		hostPlants: JSON.stringify(['Laitue', 'Fraisier', 'Chou', 'Courgette']),
		photos: JSON.stringify([])
	},
	{
		name: 'Piéride du chou',
		latinName: 'Pieris brassicae',
		symptoms: 'Papillon blanc aux ailes noirées, chenilles jaunes et noires qui rongent le feuillage. Les choux peuvent être réduits à la nervure centrale.',
		causes: 'Papillon qui pond ses œufs en amas jaunes sous les feuilles de brassicacées. Les chenilles se nourrissent en groupe et se multiplient en plusieurs générations.',
		treatments: 'Écraser les pontes et ramasser les chenilles, pulvériser du Bacillus thuringiensis. Installer un filet anti-insectes dès la plantation.',
		prevention: 'Filet de protection à mailles fines sur les choux, association avec la tomate ou le céleri. Surveiller le revers des feuilles et favoriser les oiseaux.',
		hostPlants: JSON.stringify(['Chou', 'Brocoli', 'Navet', 'Roquette']),
		photos: JSON.stringify([])
	},
	{
		name: 'Altises',
		latinName: 'Phyllotreta spp.',
		symptoms: 'Petits trous ronds dans les feuilles, comme des impacts de plombs de chasse. Les jeunes plants peuvent être entièrement criblés et dépérir.',
		causes: 'Petits coléoptères sauteurs qui attaquent les brassicacées, surtout par temps sec et chaud. Ils hivernent dans le sol et les débris végétaux.',
		treatments: 'Pulvériser une décoction d\'ail ou de tanaisie, arroser régulièrement pour maintenir un sol humide. Poser un filet anti-insectes sur les jeunes plants.',
		prevention: 'Semer dense puis éclaircir, associer avec la tomate ou l\'arroche, pailler et arroser. Éviter les sols secs et les cultures trop espacées.',
		hostPlants: JSON.stringify(['Radis', 'Chou', 'Roquette', 'Navet']),
		photos: JSON.stringify([])
	},
	{
		name: 'Mouche de la carotte',
		latinName: 'Psila rosae',
		symptoms: 'Galeries brunes dans les racines, feuillage jaunissant et rougeâtre. Les carottes deviennent véreuses et impropres à la consommation.',
		causes: 'Mouche dont les larves creusent les racines des apiacées. Elle pond près du sol et se multiplie lors des étés humides.',
		treatments: 'Arracher et détruire les racines atteintes, ne pas les composter. Pulvériser un purin de tanaisie ou installer des voiles anti-insectes.',
		prevention: 'Associer avec l\'oignon, le poireau ou l\'ail, semer clair et échelonner les semis. Utiliser un filet anti-insectes et pratiquer la rotation.',
		hostPlants: JSON.stringify(['Carotte', 'Céleri', 'Persil', 'Panais']),
		photos: JSON.stringify([])
	},
	{
		name: 'Araignées rouges',
		latinName: 'Tetranychus urticae',
		symptoms: 'Fines toiles soyeuses sous les feuilles, points jaunes puis bronze sur le feuillage. Les feuilles se dessèchent et la croissance s\'arrête.',
		causes: 'Acariens microscopiques favorisés par un air chaud et sec, notamment sous serre. Ils se multiplient très vite et apprécient les plantes stressées par la sécheresse.',
		treatments: 'Brumiser le feuillage (les acariens fuient l\'humidité), pulvériser de l\'eau savonneuse ou un extrait de neem. Introduire des prédateurs comme Phytoseiulus.',
		prevention: 'Maintenir une humidité ambiante suffisante, aérer la serre et éviter les stress hydriques. Surveiller le revers des feuilles en été.',
		hostPlants: JSON.stringify(['Concombre', 'Aubergine', 'Fraisier', 'Haricot']),
		photos: JSON.stringify([])
	},
	{
		name: 'Thrips',
		latinName: 'Thysanoptera',
		symptoms: 'Feuilles argentées ou marbrées de petites taches blanches, avec de minuscules insectes allongés dans les fleurs et les jeunes pousses. Les fleurs avortent.',
		causes: 'Insectes piqueurs-suceurs favorisés par la chaleur et la sécheresse. Ils se cachent dans les fleurs et les replis du feuillage.',
		treatments: 'Pulvériser de l\'eau savonneuse ou une décoction de tanaisie, poser des pièges bleus englués. Introduire des punaises prédatrices (Orius).',
		prevention: 'Arroser régulièrement, pailler et maintenir une humidité modérée. Éliminer les mauvaises herbes refuges et pratiquer la rotation.',
		hostPlants: JSON.stringify(['Poireau', 'Oignon', 'Concombre', 'Fraisier']),
		photos: JSON.stringify([])
	},
	{
		name: 'Cochenilles',
		latinName: 'Coccoidea',
		symptoms: 'Petits boucliers bruns ou blancs collés aux tiges et sous les feuilles, miellat collant et fumagine noire. Les rameaux s\'affaiblissent et dépérissent.',
		causes: 'Insectes suceurs protégés par un bouclier cireux, favorisés par un air sec et des plantes confinées. Ils hivernent sur les végétaux persistants.',
		treatments: 'Brosser les rameaux avec un chiffon imbibé d\'alcool ou d\'huile blanche, pulvériser de l\'eau savonneuse. Renouveler l\'opération toutes les semaines.',
		prevention: 'Aérer les plantes d\'intérieur et de serre, éviter les excès d\'azote. Surveiller les végétaux persistants en hiver et tailler les rameaux infestés.',
		hostPlants: JSON.stringify(['Rosier', 'Olivier', 'Agrumes', 'Fuchsia']),
		photos: JSON.stringify([])
	},
	{
		name: 'Noctuelles',
		latinName: 'Noctuidae',
		symptoms: 'Chenilles vertes ou brunes actives la nuit qui perforent fruits et feuilles. Les tomates et poivrons présentent des trous et des galeries internes.',
		causes: 'Papillons nocturnes qui pondent sur les cultures estivales. Les chenilles se cachent le jour dans le sol ou les fruits et sortent la nuit pour se nourrir.',
		treatments: 'Ramasser les chenilles à la lampe le soir, pulvériser du Bacillus thuringiensis. Poser des pièges à phéromones pour limiter les pontes.',
		prevention: 'Rotation des cultures, travail du sol en hiver, filet anti-insectes sur les cultures sensibles. Favoriser les chauves-souris et les oiseaux insectivores.',
		hostPlants: JSON.stringify(['Tomate', 'Poivron', 'Laitue', 'Maïs']),
		photos: JSON.stringify([])
	},
	{
		name: 'Nématodes',
		latinName: 'Meloidogyne spp.',
		symptoms: 'Plants chétifs et jaunissants, racines couvertes de petites nodosités (galles). Le système racinaire est perturbé et la plante flétrit aux heures chaudes.',
		causes: 'Vers microscopiques du sol qui pénètrent les racines et se nourrissent de la sève. Ils se conservent dans le sol et sont favorisés par les sols sableux et les rotations courtes.',
		treatments: 'Arracher et détruire les plants infestés avec leurs racines. Aucun traitement curatif : apporter du compost mûr et des engrais verts nématicides (tagète, moutarde).',
		prevention: 'Rotation longue avec des céréales, culture de tagètes ou d\'œillets d\'Inde, apport de matière organique. Éviter les sols trop légers et les cultures répétées de solanacées.',
		hostPlants: JSON.stringify(['Tomate', 'Carotte', 'Betterave', 'Melon']),
		photos: JSON.stringify([])
	},
	{
		name: 'Carence en azote',
		latinName: 'Carence nutritionnelle (N)',
		symptoms: 'Feuilles anciennes jaunissant uniformément, croissance lente, tiges grêles et feuillage pâle. Les nouvelles feuilles restent petites et la production chute.',
		causes: 'Sol pauvre en matière organique, lessivage par les pluies, excès de paillage carboné (paille, copeaux) qui bloque l\'azote. Fréquent après une culture exigeante.',
		treatments: 'Apporter un purin d\'ortie ou de consoude dilué (1 pour 10), du compost mûr ou du fumier bien décomposé. Arroser après l\'apport pour faciliter l\'assimilation.',
		prevention: 'Enrichir le sol en compost chaque année, pratiquer les associations avec les légumineuses. Éviter d\'enfouir de la paille fraîche sans azote complémentaire.',
		hostPlants: JSON.stringify(['Tomate', 'Chou', 'Courgette', 'Laitue']),
		photos: JSON.stringify([])
	},
	{
		name: 'Carence en magnésium',
		latinName: 'Carence nutritionnelle (Mg)',
		symptoms: 'Décoloration entre les nervures des feuilles anciennes (chlorose internervaire), qui restent vertes. Les bords se nécrosent et les fruits peuvent être marbrés.',
		causes: 'Sol acide ou lessivé, excès de potassium ou de calcium qui bloquent l\'absorption du magnésium. Fréquent sur tomate et rosier en pleine production.',
		treatments: 'Pulvériser une solution de sulfate de magnésium (20 g/L) sur le feuillage, renouveler après 15 jours. Apporter de la dolomie ou du compost riche en magnésium.',
		prevention: 'Corriger le pH par du chaulage si nécessaire, apporter régulièrement du compost. Éviter les excès de potassium et alterner les cultures.',
		hostPlants: JSON.stringify(['Tomate', 'Pomme de terre', 'Rosier', 'Fraisier']),
		photos: JSON.stringify([])
	}
];

/**
 * Insert the reference disease sheets. Existing rows (matched by name) are kept
 * unless `force` is set, in which case they are overwritten. Returns the number
 * of rows inserted or updated.
 */
export function seedDiseases(target: SeedDb, force = false): number {
	let count = 0;
	for (const d of diseaseSeeds) {
		const existing = target.select().from(diseases).where(eq(diseases.name, d.name!)).all();
		if (existing.length === 0) {
			target.insert(diseases).values(d).run();
			count++;
		} else if (force) {
			target.update(diseases)
				.set({ ...d, updatedAt: new Date().toISOString() })
				.where(eq(diseases.name, d.name!))
				.run();
			count++;
		}
	}
	return count;
}

async function main() {
	const force = process.argv.includes('--force');
	console.log(`🩺 Seeding disease database...${force ? ' (force mode)' : ''}`);

	for (const d of diseaseSeeds) {
		const existing = db.select().from(diseases).where(eq(diseases.name, d.name!)).all();
		if (existing.length === 0) {
			db.insert(diseases).values(d).run();
			console.log(`  ✓ ${d.name}`);
		} else if (force) {
			db.update(diseases)
				.set({ ...d, updatedAt: new Date().toISOString() })
				.where(eq(diseases.name, d.name!))
				.run();
			console.log(`  ↻ ${d.name} (mis à jour)`);
		} else {
			console.log(`  - ${d.name} (déjà existant)`);
		}
	}

	console.log(`✅ ${diseaseSeeds.length} maladies traitées`);
	process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main().catch((err) => {
		console.error('❌ Seed failed:', err);
		process.exit(1);
	});
}
