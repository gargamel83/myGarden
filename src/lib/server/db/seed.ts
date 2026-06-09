import { db } from './index';
import { plants as plantsTable } from './schema';
import { eq } from 'drizzle-orm';

const seeds = [
	// ========== Solanaceae ==========
	{
		commonName: 'Tomate',
		latinName: 'Solanum lycopersicum',
		family: 'Solanaceae',
		description: 'Plante fruitière incontournable du potager. Nécessite chaleur et soleil. Très productive, nombreuses variétés.',
		sowingStart: '03-15', sowingEnd: '04-30',
		plantingStart: '05-15', plantingEnd: '06-15',
		harvestStart: '07-15', harvestEnd: '09-30',
		floweringStart: '06-01', floweringEnd: '09-01',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 50, rowSpacing: 80,
		companions: '["Basilic","Carotte","Persil","Oignon"]',
		antagonists: '["Pomme de terre","Fenouil","Chou"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg"]'
	},
	{
		commonName: 'Aubergine',
		latinName: 'Solanum melongena',
		family: 'Solanaceae',
		description: 'Fruit exigeant en chaleur. Culture similaire à la tomate mais plus thermophile.',
		sowingStart: '02-15', sowingEnd: '04-15',
		plantingStart: '05-15', plantingEnd: '06-10',
		harvestStart: '07-15', harvestEnd: '10-15',
		floweringStart: '06-01', floweringEnd: '09-01',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 50, rowSpacing: 70,
		companions: '["Haricot","Thym","Estragon"]',
		antagonists: '["Pomme de terre","Fenouil"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/7/76/Solanum_melongena_24_08_2012_%281%29.JPG"]'
	},
	{
		commonName: 'Poivron',
		latinName: 'Capsicum annuum',
		family: 'Solanaceae',
		description: 'Légume-fruit d\'été, très sensible au froid. Demande chaleur et soleil.',
		sowingStart: '02-01', sowingEnd: '04-01',
		plantingStart: '05-15', plantingEnd: '06-10',
		harvestStart: '07-15', harvestEnd: '10-01',
		floweringStart: '06-01', floweringEnd: '09-01',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 45, rowSpacing: 60,
		companions: '["Basilic","Carotte","Persil"]',
		antagonists: '["Fenouil","Chou"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/8/85/Green-Yellow-Red-Pepper-2009.jpg"]'
	},
	{
		commonName: 'Pomme de terre',
		latinName: 'Solanum tuberosum',
		family: 'Solanaceae',
		description: 'Tubercule facile de culture. Éviter de planter après d\'autres Solanacées.',
		sowingStart: null, sowingEnd: null,
		plantingStart: '03-15', plantingEnd: '05-01',
		harvestStart: '06-15', harvestEnd: '09-30',
		floweringStart: '06-01', floweringEnd: '07-31',
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'faible',
		spacing: 30, rowSpacing: 70,
		companions: '["Haricot","Maïs","Œillet d\'Inde"]',
		antagonists: '["Tomate","Aubergine","Fenouil","Tournesol"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/a/ab/Patates.jpg"]'
	},
	{
		commonName: 'Piment',
		latinName: 'Capsicum annuum',
		family: 'Solanaceae',
		description: 'Légume-fruit très épicé. Aime la chaleur et les sols riches. Très décoratif.',
		sowingStart: '02-01', sowingEnd: '04-01',
		plantingStart: '05-15', plantingEnd: '06-10',
		harvestStart: '07-01', harvestEnd: '10-15',
		floweringStart: '06-01', floweringEnd: '09-01',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 40, rowSpacing: 60,
		companions: '["Basilic","Carotte","Persil"]',
		antagonists: '["Fenouil","Haricot"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/5/50/Madame_Jeanette_and_other_chillies.jpg"]'
	},
	{
		commonName: 'Tomate cerise',
		latinName: 'Solanum lycopersicum var. cerasiforme',
		family: 'Solanaceae',
		description: 'Variété à petits fruits très sucrés. Productive et facile, idéale pour les enfants et les balcons.',
		sowingStart: '03-01', sowingEnd: '04-30',
		plantingStart: '05-01', plantingEnd: '06-15',
		harvestStart: '07-01', harvestEnd: '10-15',
		floweringStart: '05-15', floweringEnd: '09-15',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 40, rowSpacing: 60,
		companions: '["Basilic","Carotte","Capucine"]',
		antagonists: '["Pomme de terre","Fenouil"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/1/10/Tomates_cerises_Luc_Viatour.jpg"]'
	},

	// ========== Brassicaceae ==========
	{
		commonName: 'Chou cabus',
		latinName: 'Brassica oleracea',
		family: 'Brassicaceae',
		description: 'Chou pommé classique. Rustique, supporte le froid.',
		sowingStart: '03-01', sowingEnd: '05-31',
		plantingStart: '05-01', plantingEnd: '07-15',
		harvestStart: '08-01', harvestEnd: '11-30',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'lourd', watering: 'moyen',
		spacing: 50, rowSpacing: 70,
		companions: '["Betterave","Céleri","Haricot","Camomille"]',
		antagonists: '["Tomate","Fraise","Poireau","Ail"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/6/6f/Cabbage_and_cross_section_on_white.jpg"]'
	},
	{
		commonName: 'Chou-fleur',
		latinName: 'Brassica oleracea var. botrytis',
		family: 'Brassicaceae',
		description: 'Culture délicate, demande un sol riche et frais.',
		sowingStart: '03-01', sowingEnd: '05-31',
		plantingStart: '05-01', plantingEnd: '07-01',
		harvestStart: '07-01', harvestEnd: '10-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'élevé',
		spacing: 60, rowSpacing: 80,
		companions: '["Betterave","Céleri","Épinard"]',
		antagonists: '["Tomate","Fraise","Poireau"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/2/2f/Chou-fleur_02.jpg"]'
	},
	{
		commonName: 'Brocoli',
		latinName: 'Brassica oleracea var. italica',
		family: 'Brassicaceae',
		description: 'Produit des têtes vertes comestibles. Aime les températures fraîches.',
		sowingStart: '03-01', sowingEnd: '06-15',
		plantingStart: '04-01', plantingEnd: '07-15',
		harvestStart: '06-01', harvestEnd: '10-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 45, rowSpacing: 60,
		companions: '["Betterave","Céleri","Camomille"]',
		antagonists: '["Tomate","Fraise"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/0/03/Broccoli_and_cross_section_edit.jpg"]'
	},
	{
		commonName: 'Radis',
		latinName: 'Raphanus sativus',
		family: 'Brassicaceae',
		description: 'Culture rapide (3-4 semaines). Idéal pour intercaler entre deux cultures longues.',
		sowingStart: '03-01', sowingEnd: '09-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '04-01', harvestEnd: '10-15',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'élevé',
		spacing: 5, rowSpacing: 20,
		companions: '["Carotte","Laitue","Haricot","Capucine"]',
		antagonists: '["Chou"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/0/0c/Radish_3371103037_4ab07db0bf_o.jpg"]'
	},
	{
		commonName: 'Navet',
		latinName: 'Brassica rapa',
		family: 'Brassicaceae',
		description: 'Racine comestible semi-rustique. Aime les sols frais et meubles.',
		sowingStart: '03-15', sowingEnd: '05-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '05-15', harvestEnd: '07-15',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'moyen',
		spacing: 10, rowSpacing: 30,
		companions: '["Pois","Laitue","Haricot"]',
		antagonists: '["Radis","Chou"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/d/d3/Turnip_2622027.jpg"]'
	},
	{
		commonName: 'Chou de Bruxelles',
		latinName: 'Brassica oleracea var. gemmifera',
		family: 'Brassicaceae',
		description: 'Produit des petits choux le long de la tige. Culture longue, rustique. Meilleur après les gelées.',
		sowingStart: '03-01', sowingEnd: '05-01',
		plantingStart: '05-01', plantingEnd: '06-15',
		harvestStart: '10-01', harvestEnd: '02-28',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'lourd', watering: 'moyen',
		spacing: 60, rowSpacing: 80,
		companions: '["Betterave","Céleri","Haricot","Camomille"]',
		antagonists: '["Tomate","Fraise","Poireau"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/2/23/Brussels_sprout_closeup.jpg"]'
	},
	{
		commonName: 'Chou-rave',
		latinName: 'Brassica oleracea var. gongylodes',
		family: 'Brassicaceae',
		description: 'Boule comestible aérienne au goût de navet doux. Croissance rapide, facile.',
		sowingStart: '04-01', sowingEnd: '07-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '06-01', harvestEnd: '10-01',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'moyen',
		spacing: 25, rowSpacing: 40,
		companions: '["Betterave","Haricot","Laitue"]',
		antagonists: '["Tomate","Poireau"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/9/98/Brassica_oleracea_var._gongylodes_%28kohlrabi%29.jpg"]'
	},
	{
		commonName: 'Radis noir',
		latinName: 'Raphanus sativus var. niger',
		family: 'Brassicaceae',
		description: 'Racine longue à chair noire et blanche. Piquant et riche en vitamine C. Culture d\'automne.',
		sowingStart: '07-01', sowingEnd: '08-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '09-01', harvestEnd: '12-15',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'moyen',
		spacing: 15, rowSpacing: 30,
		companions: '["Carotte","Laitue","Épinard"]',
		antagonists: '["Chou","Navet"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/0/00/Rettichschwarzrund.jpg"]'
	},
	{
		commonName: 'Roquette',
		latinName: 'Eruca sativa',
		family: 'Brassicaceae',
		description: 'Salade au goût poivré et piquant. Croissance très rapide. Se mange jeune.',
		sowingStart: '03-01', sowingEnd: '09-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '04-01', harvestEnd: '10-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'mi_ombre', soilType: 'meuble', watering: 'moyen',
		spacing: 5, rowSpacing: 20,
		companions: '["Laitue","Mâche","Betterave"]',
		antagonists: '["Chou","Fraise"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/1/1c/Eruca_sativa_sl11.jpg"]'
	},

	// ========== Fabaceae ==========
	{
		commonName: 'Haricot vert',
		latinName: 'Phaseolus vulgaris',
		family: 'Fabaceae',
		description: 'Légume-gousse facile. Fixe l\'azote dans le sol, excellent précédent cultural.',
		sowingStart: '05-01', sowingEnd: '07-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '07-01', harvestEnd: '09-30',
		floweringStart: '06-01', floweringEnd: '08-31',
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'moyen',
		spacing: 10, rowSpacing: 40,
		companions: '["Maïs","Carotte","Chou","Betterave"]',
		antagonists: '["Oignon","Ail","Poireau","Fenouil"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/a/a0/Heaps_of_beans.jpg"]'
	},
	{
		commonName: 'Petit pois',
		latinName: 'Pisum sativum',
		family: 'Fabaceae',
		description: 'Culture de saison fraîche. Fixe l\'azote, prépare le sol pour les cultures exigeantes.',
		sowingStart: '03-01', sowingEnd: '05-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '06-01', harvestEnd: '07-31',
		floweringStart: '05-01', floweringEnd: '07-15',
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'moyen',
		spacing: 5, rowSpacing: 30,
		companions: '["Carotte","Laitue","Radis"]',
		antagonists: '["Oignon","Ail","Poireau"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/1/11/Peas_in_pods_-_Studio.jpg"]'
	},
	{
		commonName: 'Fève',
		latinName: 'Vicia faba',
		family: 'Fabaceae',
		description: 'Légumineuse rustique de début de saison. Enrichit le sol en azote.',
		sowingStart: '02-01', sowingEnd: '04-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '06-01', harvestEnd: '07-31',
		floweringStart: '04-01', floweringEnd: '06-30',
		sunExposure: 'plein_soleil', soilType: 'lourd', watering: 'moyen',
		spacing: 15, rowSpacing: 50,
		companions: '["Maïs","Carotte","Laitue"]',
		antagonists: '["Oignon","Ail"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/e/e1/Illustration_Vicia_faba1.jpg"]'
	},

	// ========== Apiaceae ==========
	{
		commonName: 'Carotte',
		latinName: 'Daucus carota',
		family: 'Apiaceae',
		description: 'Légume-racine très cultivé. Nécessite un sol meuble et profond sans cailloux.',
		sowingStart: '03-01', sowingEnd: '07-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '06-01', harvestEnd: '10-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'moyen',
		spacing: 5, rowSpacing: 25,
		companions: '["Tomate","Pois","Radis","Ciboulette","Romarin"]',
		antagonists: '["Aneth","Fenouil","Menthe"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/a/a2/Vegetable-Carrot-Bundle-wStalks.jpg"]'
	},
	{
		commonName: 'Céleri',
		latinName: 'Apium graveolens',
		family: 'Apiaceae',
		description: 'Culture longue qui demande un sol riche et frais. Arrosage régulier indispensable.',
		sowingStart: '03-01', sowingEnd: '04-30',
		plantingStart: '05-15', plantingEnd: '06-15',
		harvestStart: '08-01', harvestEnd: '10-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'élevé',
		spacing: 30, rowSpacing: 40,
		companions: '["Chou","Tomate","Haricot","Poireau"]',
		antagonists: '["Carotte","Pomme de terre","Persil"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/0/0d/Celery_1.jpg"]'
	},
	{
		commonName: 'Fenouil',
		latinName: 'Foeniculum vulgare',
		family: 'Apiaceae',
		description: 'Légume au goût anisé. Aime le soleil et les sols légers.',
		sowingStart: '04-01', sowingEnd: '06-30',
		plantingStart: null, plantingEnd: null,
		harvestStart: '07-01', harvestEnd: '10-15',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'moyen',
		spacing: 30, rowSpacing: 50,
		companions: '["Sauge"]',
		antagonists: '["Tomate","Carotte","Haricot","Fenouil","Coriandre"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/c/c0/Foeniculum_July_2011-1a.jpg"]'
	},
	{
		commonName: 'Persil',
		latinName: 'Petroselinum crispum',
		family: 'Apiaceae',
		description: 'Aromatique bisannuelle. Germe lentement. Se plaît en bordure ou entre les rangs.',
		sowingStart: '03-01', sowingEnd: '08-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '05-01', harvestEnd: '11-15',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'mi_ombre', soilType: 'riche', watering: 'moyen',
		spacing: 10, rowSpacing: 25,
		companions: '["Tomate","Carotte","Radis","Fraise"]',
		antagonists: '["Laitue"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/e/e4/Petroselinum.jpg"]'
	},
	{
		commonName: 'Aneth',
		latinName: 'Anethum graveolens',
		family: 'Apiaceae',
		description: 'Aromatique annuelle aux feuilles fines et au goût anisé. Attire les insectes utiles.',
		sowingStart: '04-01', sowingEnd: '07-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '06-01', harvestEnd: '09-30',
		floweringStart: '07-01', floweringEnd: '08-31',
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'faible',
		spacing: 20, rowSpacing: 30,
		companions: '["Chou","Carotte","Concombre","Laitue"]',
		antagonists: '["Fenouil","Tomate","Carotte"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/4/4b/Illustration_Anethum_graveolens_clean.jpg"]'
	},
	{
		commonName: 'Cerfeuil',
		latinName: 'Anthriscus cerefolium',
		family: 'Apiaceae',
		description: 'Aromatique délicate au goût subtil d\'anis. Apprécie la mi-ombre et les sols frais.',
		sowingStart: '03-01', sowingEnd: '08-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '04-15', harvestEnd: '10-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'mi_ombre', soilType: 'meuble', watering: 'moyen',
		spacing: 10, rowSpacing: 25,
		companions: '["Laitue","Radis","Carotte"]',
		antagonists: '["Lavande","Romarin"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/5/51/Illustration_Anthriscus_cerefolium0.jpg"]'
	},
	{
		commonName: 'Coriandre',
		latinName: 'Coriandrum sativum',
		family: 'Apiaceae',
		description: 'Aromatique aux feuilles (cilantro) et graines (coriandre) utilisées en cuisine. Monte vite à graines.',
		sowingStart: '03-15', sowingEnd: '08-01',
		plantingStart: null, plantingEnd: null,
		harvestStart: '05-01', harvestEnd: '09-15',
		floweringStart: '06-01', floweringEnd: '07-31',
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'faible',
		spacing: 10, rowSpacing: 25,
		companions: '["Laitue","Tomate","Épinard"]',
		antagonists: '["Fenouil"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/1/13/Coriandrum_sativum_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-193.jpg"]'
	},

	// ========== Cucurbitaceae ==========
	{
		commonName: 'Concombre',
		latinName: 'Cucumis sativus',
		family: 'Cucurbitaceae',
		description: 'Plante grimpante très productive. Nécessite chaleur et arrosage régulier.',
		sowingStart: '04-15', sowingEnd: '06-15',
		plantingStart: '05-15', plantingEnd: '06-20',
		harvestStart: '07-01', harvestEnd: '09-30',
		floweringStart: '06-01', floweringEnd: '08-31',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'élevé',
		spacing: 40, rowSpacing: 100,
		companions: '["Maïs","Haricot","Tournesol","Aneth"]',
		antagonists: '["Pomme de terre","Menthe"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/9/96/ARS_cucumber.jpg"]'
	},
	{
		commonName: 'Courgette',
		latinName: 'Cucurbita pepo',
		family: 'Cucurbitaceae',
		description: 'Plante généreuse. Un seul pied suffit pour une famille. Arrosage au pied.',
		sowingStart: '04-15', sowingEnd: '06-01',
		plantingStart: '05-15', plantingEnd: '06-15',
		harvestStart: '07-01', harvestEnd: '10-01',
		floweringStart: '06-01', floweringEnd: '09-01',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'élevé',
		spacing: 80, rowSpacing: 120,
		companions: '["Maïs","Haricot","Œillet d\'Inde"]',
		antagonists: '["Pomme de terre"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/9/92/CSA-Striped-Zucchini.jpg"]'
	},
	{
		commonName: 'Potiron',
		latinName: 'Cucurbita maxima',
		family: 'Cucurbitaceae',
		description: 'Courge d\'hiver. Conservation longue. Très gourmand en espace et nutriments.',
		sowingStart: '04-15', sowingEnd: '06-01',
		plantingStart: '05-15', plantingEnd: '06-15',
		harvestStart: '09-01', harvestEnd: '10-31',
		floweringStart: '07-01', floweringEnd: '09-01',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 100, rowSpacing: 150,
		companions: '["Maïs","Haricot"]',
		antagonists: '["Pomme de terre"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/5/5c/FrenchMarketPumpkinsB.jpg"]'
	},
	{
		commonName: 'Melon',
		latinName: 'Cucumis melo',
		family: 'Cucurbitaceae',
		description: 'Fruit exigeant en chaleur. Taille nécessaire pour obtenir de beaux fruits.',
		sowingStart: '04-01', sowingEnd: '05-15',
		plantingStart: '05-15', plantingEnd: '06-10',
		harvestStart: '07-15', harvestEnd: '09-15',
		floweringStart: '06-01', floweringEnd: '08-31',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 60, rowSpacing: 100,
		companions: '["Maïs","Tournesol"]',
		antagonists: '["Concombre","Courgette"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/e/e7/Cantaloupe_and_canary_melon.jpg"]'
	},
	{
		commonName: 'Courge butternet',
		latinName: 'Cucurbita moschata',
		family: 'Cucurbitaceae',
		description: 'Courge d\'hiver à la chair douce et onctueuse. Forme en poire. Bonne conservation.',
		sowingStart: '04-15', sowingEnd: '06-01',
		plantingStart: '05-15', plantingEnd: '06-15',
		harvestStart: '09-01', harvestEnd: '10-31',
		floweringStart: '07-01', floweringEnd: '09-01',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 80, rowSpacing: 120,
		companions: '["Maïs","Haricot","Œillet d\'Inde"]',
		antagonists: '["Pomme de terre"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/7/77/Cucurbita_moschata_Butternut_2012_G2.jpg"]'
	},

	// ========== Amaryllidaceae ==========
	{
		commonName: 'Oignon',
		latinName: 'Allium cepa',
		family: 'Amaryllidaceae',
		description: 'Bulbe condimentaire de base. Se conserve longtemps. Aime les sols légers.',
		sowingStart: '02-01', sowingEnd: '04-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '06-01', harvestEnd: '08-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'faible',
		spacing: 10, rowSpacing: 25,
		companions: '["Carotte","Betterave","Laitue","Fraise"]',
		antagonists: '["Haricot","Pois","Chou"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/a/a2/Mixed_onions.jpg"]'
	},
	{
		commonName: 'Ail',
		latinName: 'Allium sativum',
		family: 'Amaryllidaceae',
		description: 'Bulbe aromatique. Se plante à l\'automne. Action antifongique au jardin.',
		sowingStart: null, sowingEnd: null,
		plantingStart: '10-01', plantingEnd: '12-15',
		harvestStart: '06-01', harvestEnd: '07-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'faible',
		spacing: 10, rowSpacing: 30,
		companions: '["Carotte","Betterave","Tomate","Fraise"]',
		antagonists: '["Haricot","Pois","Chou"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/3/39/Allium_sativum_Woodwill_1793.jpg"]'
	},
	{
		commonName: 'Poireau',
		latinName: 'Allium ampeloprasum',
		family: 'Amaryllidaceae',
		description: 'Légume d\'hiver par excellence. Rustique, supporte le gel.',
		sowingStart: '02-01', sowingEnd: '04-30',
		plantingStart: '05-01', plantingEnd: '07-15',
		harvestStart: '09-01', harvestEnd: '03-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 12, rowSpacing: 35,
		companions: '["Carotte","Céleri","Fraise","Tomate"]',
		antagonists: '["Betterave","Haricot","Pois"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/6/63/Leek_on_white_background_-_0947.jpg"]'
	},
	{
		commonName: 'Ciboulette',
		latinName: 'Allium schoenoprasum',
		family: 'Amaryllidaceae',
		description: 'Aromatique vivace aux feuilles fines. Fleurs comestibles. Repousse chaque année.',
		sowingStart: '03-01', sowingEnd: '05-15',
		plantingStart: '04-01', plantingEnd: '06-01',
		harvestStart: '04-01', harvestEnd: '10-31',
		floweringStart: '05-01', floweringEnd: '07-31',
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'faible',
		spacing: 20, rowSpacing: 30,
		companions: '["Carotte","Tomate","Fraise","Rosier"]',
		antagonists: '["Haricot","Pois"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/4/49/Allium_schoenoprasum_-_Bombus_lapidarius_-_Tootsi.jpg"]'
	},

	// ========== Asteraceae ==========
	{
		commonName: 'Laitue',
		latinName: 'Lactuca sativa',
		family: 'Asteraceae',
		description: 'Salade rapide. Semis échelonnés pour récolte continue. Supporte mi-ombre.',
		sowingStart: '03-01', sowingEnd: '09-15',
		plantingStart: '03-15', plantingEnd: '09-30',
		harvestStart: '04-15', harvestEnd: '11-01',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'mi_ombre', soilType: 'riche', watering: 'moyen',
		spacing: 25, rowSpacing: 30,
		companions: '["Carotte","Radis","Fraise","Concombre"]',
		antagonists: '["Persil","Céleri"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/d/da/Iceberg_lettuce_in_SB.jpg"]'
	},
	{
		commonName: 'Endive',
		latinName: 'Cichorium intybus',
		family: 'Asteraceae',
		description: 'Racine forcée pour produire des chicons en hiver. Aime les sols profonds.',
		sowingStart: '05-01', sowingEnd: '06-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '11-01', harvestEnd: '03-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'moyen',
		spacing: 20, rowSpacing: 30,
		companions: '["Carotte","Betterave","Laitue"]',
		antagonists: '["Tomate"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/0/00/Cichorium_endivia_-_Botanischer_Garten_Mainz_IMG_5453.JPG"]'
	},
	{
		commonName: 'Œillet d\'Inde',
		latinName: 'Tagetes patula',
		family: 'Asteraceae',
		description: 'Fleur compagne incontournable. Éloigne les nématodes. Fleurit tout l\'été.',
		sowingStart: '03-15', sowingEnd: '05-15',
		plantingStart: '05-01', plantingEnd: '06-15',
		harvestStart: null, harvestEnd: null,
		floweringStart: '06-01', floweringEnd: '10-01',
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'faible',
		spacing: 20, rowSpacing: 30,
		companions: '["Tomate","Aubergine","Pomme de terre","Rose"]',
		antagonists: '["Haricot"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/e/e7/French_marigold_Tagetes_patula.jpg"]'
	},
	{
		commonName: 'Rose d\'Inde',
		latinName: 'Tagetes erecta',
		family: 'Asteraceae',
		description: 'Grande fleur compagne au port érigé. Fleurs volumineuses, répulsive pour les nématodes.',
		sowingStart: '03-15', sowingEnd: '05-15',
		plantingStart: '05-01', plantingEnd: '06-15',
		harvestStart: null, harvestEnd: null,
		floweringStart: '06-01', floweringEnd: '10-01',
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'faible',
		spacing: 30, rowSpacing: 40,
		companions: '["Tomate","Pomme de terre","Poivron"]',
		antagonists: '["Haricot"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/b/b0/Tagetes_erecta_chendumalli_chedi.jpg"]'
	},
	{
		commonName: 'Souci',
		latinName: 'Calendula officinalis',
		family: 'Asteraceae',
		description: 'Fleur comestible et médicinale aux propriétés cicatrisantes. Attire les pollinisateurs.',
		sowingStart: '03-01', sowingEnd: '06-01',
		plantingStart: '04-01', plantingEnd: '06-15',
		harvestStart: null, harvestEnd: null,
		floweringStart: '05-01', floweringEnd: '10-01',
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'faible',
		spacing: 25, rowSpacing: 35,
		companions: '["Tomate","Haricot","Carotte","Laitue"]',
		antagonists: '["Pomme de terre"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/6/67/Calendula_January_2008-1_filtered.jpg"]'
	},

	// ========== Chenopodiaceae ==========
	{
		commonName: 'Betterave',
		latinName: 'Beta vulgaris',
		family: 'Chenopodiaceae',
		description: 'Racine comestible riche en fer. Se conserve bien en silo ou au frais.',
		sowingStart: '04-01', sowingEnd: '07-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '07-01', harvestEnd: '10-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'moyen',
		spacing: 10, rowSpacing: 35,
		companions: '["Chou","Haricot","Oignon","Laitue"]',
		antagonists: '["Poireau","Épinard"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/a/ae/Detroitdarkredbeets.png"]'
	},
	{
		commonName: 'Épinard',
		latinName: 'Spinacia oleracea',
		family: 'Chenopodiaceae',
		description: 'Légume-feuille riche en fer. Culture de saison fraîche, monte vite en graines quand il fait chaud.',
		sowingStart: '02-01', sowingEnd: '04-30',
		plantingStart: null, plantingEnd: null,
		harvestStart: '04-01', harvestEnd: '06-30',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'mi_ombre', soilType: 'riche', watering: 'élevé',
		spacing: 8, rowSpacing: 20,
		companions: '["Fraise","Chou","Haricot"]',
		antagonists: '["Betterave","Tomate"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/3/37/Spinacia_oleracea_Spinazie_bloeiend.jpg"]'
	},

	// ========== Poaceae ==========
	{
		commonName: 'Maïs',
		latinName: 'Zea mays',
		family: 'Poaceae',
		description: 'Céréale haute. Peut servir de tuteur pour les haricots. Très gourmand en azote.',
		sowingStart: '05-01', sowingEnd: '06-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '08-01', harvestEnd: '10-15',
		floweringStart: '07-01', floweringEnd: '08-31',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 30, rowSpacing: 70,
		companions: '["Haricot","Courgette","Concombre","Petit pois"]',
		antagonists: '["Tomate","Céleri"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/e/e3/Zea_mays_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-283.jpg"]'
	},
	{
		commonName: 'Citronnelle',
		latinName: 'Cymbopogon citratus',
		family: 'Poaceae',
		description: 'Graminée aromatique au parfum citronné. Non rustique, à cultiver en pot ou à protéger l\'hiver.',
		sowingStart: null, sowingEnd: null,
		plantingStart: '04-15', plantingEnd: '06-01',
		harvestStart: '06-01', harvestEnd: '10-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 60, rowSpacing: 80,
		companions: '["Tomate","Laitue"]',
		antagonists: '[]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/b/bd/YosriNov04Pokok_Serai.JPG"]'
	},

	// ========== Lamiaceae ==========
	{
		commonName: 'Basilic',
		latinName: 'Ocimum basilicum',
		family: 'Lamiaceae',
		description: 'Aromatique annuelle sensible au froid. Excellent compagnon de la tomate qu\'il protège.',
		sowingStart: '03-15', sowingEnd: '05-15',
		plantingStart: '05-15', plantingEnd: '06-15',
		harvestStart: '06-15', harvestEnd: '10-01',
		floweringStart: '07-01', floweringEnd: '09-01',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 20, rowSpacing: 30,
		companions: '["Tomate","Poivron","Aubergine"]',
		antagonists: '["Sauge","Rue"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/9/97/Ocimum_basilicum_8zz.jpg"]'
	},
	{
		commonName: 'Menthe',
		latinName: 'Mentha spicata',
		family: 'Lamiaceae',
		description: 'Aromatique vivace très envahissante. À cultiver de préférence en pot ou confinée.',
		sowingStart: null, sowingEnd: null,
		plantingStart: '03-01', plantingEnd: '05-31',
		harvestStart: '05-01', harvestEnd: '10-15',
		floweringStart: '06-01', floweringEnd: '09-01',
		sunExposure: 'mi_ombre', soilType: 'riche', watering: 'élevé',
		spacing: 40, rowSpacing: 50,
		companions: '["Chou","Tomate"]',
		antagonists: '["Carotte","Persil"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/4/4d/Mentha_spicata-IMG_6186.jpg"]'
	},
	{
		commonName: 'Lavande',
		latinName: 'Lavandula angustifolia',
		family: 'Lamiaceae',
		description: 'Arbrisseau aromatique méditerranéen. Fleurs parfumées. Attire les abeilles et repousse les nuisibles.',
		sowingStart: '03-01', sowingEnd: '05-15',
		plantingStart: '04-01', plantingEnd: '06-15',
		harvestStart: null, harvestEnd: null,
		floweringStart: '06-01', floweringEnd: '08-15',
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'faible',
		spacing: 30, rowSpacing: 40,
		companions: '["Rose","Thym","Romarin"]',
		antagonists: '["Menthe"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/4/40/Lavandula_angustifolia_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-087.jpg"]'
	},
	{
		commonName: 'Mélisse',
		latinName: 'Melissa officinalis',
		family: 'Lamiaceae',
		description: 'Aromatique vivace au parfum citronné. Calmante, attire les abeilles.'
		+ ' Envahissante si non contrôlée.',
		sowingStart: '03-01', sowingEnd: '06-01',
		plantingStart: '04-01', plantingEnd: '06-15',
		harvestStart: '05-01', harvestEnd: '10-01',
		floweringStart: '06-01', floweringEnd: '08-31',
		sunExposure: 'mi_ombre', soilType: 'meuble', watering: 'faible',
		spacing: 40, rowSpacing: 50,
		companions: '["Tomate","Chou","Fraise"]',
		antagonists: '[]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/7/70/Lemon_balm_plant.jpg"]'
	},
	{
		commonName: 'Sauge',
		latinName: 'Salvia officinalis',
		family: 'Lamiaceae',
		description: 'Aromatique vivace méditerranéenne. Feuilles veloutées. Fleurs violettes décoratives.',
		sowingStart: '03-01', sowingEnd: '05-15',
		plantingStart: '04-01', plantingEnd: '06-01',
		harvestStart: '05-01', harvestEnd: '10-01',
		floweringStart: '05-01', floweringEnd: '07-31',
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'faible',
		spacing: 40, rowSpacing: 50,
		companions: '["Carotte","Tomate","Romarin"]',
		antagonists: '["Concombre","Basilic"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/5/5a/Salvia_officinalis0.jpg"]'
	},
	{
		commonName: 'Thym',
		latinName: 'Thymus vulgaris',
		family: 'Lamiaceae',
		description: 'Sous-arbrisseau aromatique méditerranéen. Très rustique. Fleurs mellifères.',
		sowingStart: '03-01', sowingEnd: '05-15',
		plantingStart: '04-01', plantingEnd: '06-01',
		harvestStart: '04-01', harvestEnd: '10-01',
		floweringStart: '05-01', floweringEnd: '07-31',
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'faible',
		spacing: 25, rowSpacing: 35,
		companions: '["Tomate","Aubergine","Carotte","Chou"]',
		antagonists: '["Menthe"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/e/ea/Thyme-Bundle.jpg"]'
	},

	// ========== Rosaceae ==========
	{
		commonName: 'Fraisier',
		latinName: 'Fragaria × ananassa',
		family: 'Rosaceae',
		description: 'Fruit rouge emblématique du printemps. Se plaît en bordure ou en pot. Produit des stolons.',
		sowingStart: '01-01', sowingEnd: '03-31',
		plantingStart: '03-01', plantingEnd: '05-15',
		harvestStart: '05-01', harvestEnd: '07-31',
		floweringStart: '04-01', floweringEnd: '06-30',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 30, rowSpacing: 40,
		companions: '["Laitue","Épinard","Haricot","Ail"]',
		antagonists: '["Chou","Fenouil"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/4/4c/Garden_strawberry_%28Fragaria_%C3%97_ananassa%29_single2.jpg"]'
	},
	{
		commonName: 'Framboisier',
		latinName: 'Rubus idaeus',
		family: 'Rosaceae',
		description: 'Arbuste fruitier produisant des framboises. Rustique. Se multiplie par drageons.',
		sowingStart: null, sowingEnd: null,
		plantingStart: '10-01', plantingEnd: '03-31',
		harvestStart: '06-15', harvestEnd: '09-30',
		floweringStart: '05-01', floweringEnd: '07-31',
		sunExposure: 'plein_soleil', soilType: 'riche', watering: 'moyen',
		spacing: 50, rowSpacing: 150,
		companions: '["Ail","Capucine","Œillet d\'Inde"]',
		antagonists: '["Tomate","Pomme de terre","Fraise"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/a/a7/Raspberry_-_halved_%28Rubus_idaeus%29.jpg"]'
	},

	// ========== Asparagaceae ==========
	{
		commonName: 'Asperge',
		latinName: 'Asparagus officinalis',
		family: 'Asparagaceae',
		description: 'Légume vivace de longue durée (10-15 ans). Demandeur de patience : récolte à partir de la 3e année.',
		sowingStart: '03-01', sowingEnd: '04-30',
		plantingStart: '03-15', plantingEnd: '04-30',
		harvestStart: '04-01', harvestEnd: '06-15',
		floweringStart: '06-01', floweringEnd: '07-31',
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'faible',
		spacing: 40, rowSpacing: 100,
		companions: '["Tomate","Persil","Basilic","Fraise"]',
		antagonists: '["Oignon","Ail","Pomme de terre"]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/4/4b/Asparagus_vegetable.jpg"]'
	},

	// ========== Boraginaceae ==========
	{
		commonName: 'Bourrache',
		latinName: 'Borago officinalis',
		family: 'Boraginaceae',
		description: 'Plante compagne mellifère. Fleurs bleues comestibles. Feuilles au goût de concombre.',
		sowingStart: '03-01', sowingEnd: '06-01',
		plantingStart: null, plantingEnd: null,
		harvestStart: '05-01', harvestEnd: '09-30',
		floweringStart: '05-01', floweringEnd: '09-01',
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'faible',
		spacing: 30, rowSpacing: 40,
		companions: '["Tomate","Courgette","Fraise","Chou"]',
		antagonists: '[]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/2/26/Borago_officinalis_%282025%29.jpg"]'
	},

	// ========== Tropaeolaceae ==========
	{
		commonName: 'Capucine',
		latinName: 'Tropaeolum majus',
		family: 'Tropaeolaceae',
		description: 'Fleur comestible au goût poivré. Piège à pucerons. Repousse les aleurodes.',
		sowingStart: '04-01', sowingEnd: '06-01',
		plantingStart: null, plantingEnd: null,
		harvestStart: '06-01', harvestEnd: '10-01',
		floweringStart: '06-01', floweringEnd: '10-01',
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'faible',
		spacing: 30, rowSpacing: 40,
		companions: '["Radis","Chou","Concombre","Courgette"]',
		antagonists: '[]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/a/ab/TropaeolumMajusOrange.jpg"]'
	},

	// ========== Convolvulaceae ==========
	{
		commonName: 'Ipomée',
		latinName: 'Ipomoea tricolor',
		family: 'Convolvulaceae',
		description: 'Plante grimpante ornementale à fleurs en trompette. Croissance rapide. Fleurit de l\'été à l\'automne.',
		sowingStart: '04-01', sowingEnd: '05-15',
		plantingStart: '05-15', plantingEnd: '06-15',
		harvestStart: null, harvestEnd: null,
		floweringStart: '06-01', floweringEnd: '10-01',
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'moyen',
		spacing: 30, rowSpacing: 50,
		companions: '["Haricot","Maïs","Capucine"]',
		antagonists: '[]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/9/90/Ipomoea_tricolor_%27Heavenly_Blue%27.jpg"]'
	},

	// ========== Valerianaceae ==========
	{
		commonName: 'Mâche',
		latinName: 'Valerianella locusta',
		family: 'Valerianaceae',
		description: 'Salade d\'hiver douce et croquante. Semis en fin d\'été pour récolte automne/hiver. Très rustique.',
		sowingStart: '07-15', sowingEnd: '09-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: '09-01', harvestEnd: '03-31',
		floweringStart: null, floweringEnd: null,
		sunExposure: 'mi_ombre', soilType: 'meuble', watering: 'faible',
		spacing: 5, rowSpacing: 15,
		companions: '["Betterave","Carotte","Laitue"]',
		antagonists: '[]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/1/1e/Valerianella_locusta.jpeg"]'
	},

	// ========== Papaveraceae ==========
	{
		commonName: 'Pavot',
		latinName: 'Papaver somniferum',
		family: 'Papaveraceae',
		description: 'Fleur ornementale aux pétales soyeux. Graines comestibles. Attire les pollinisateurs.',
		sowingStart: '03-01', sowingEnd: '05-15',
		plantingStart: null, plantingEnd: null,
		harvestStart: null, harvestEnd: null,
		floweringStart: '05-01', floweringEnd: '07-31',
		sunExposure: 'plein_soleil', soilType: 'meuble', watering: 'faible',
		spacing: 20, rowSpacing: 30,
		companions: '["Carotte","Laitue","Capucine"]',
		antagonists: '[]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/c/ce/Papaver_somniferum_flowers.jpg"]'
	},

	// ========== Verbenaceae ==========
	{
		commonName: 'Verveine citronnelle',
		latinName: 'Aloysia citrodora',
		family: 'Verbenaceae',
		description: 'Arbuste aromatique au puissant parfum citronné. Fleurs blanches ou mauves. Non rustique.',
		sowingStart: '03-01', sowingEnd: '05-01',
		plantingStart: '05-01', plantingEnd: '06-15',
		harvestStart: '06-01', harvestEnd: '10-01',
		floweringStart: '07-01', floweringEnd: '09-01',
		sunExposure: 'plein_soleil', soilType: 'léger', watering: 'faible',
		spacing: 50, rowSpacing: 60,
		companions: '["Thym","Sauge","Mélisse"]',
		antagonists: '[]',
		photos: '["https://upload.wikimedia.org/wikipedia/commons/a/a6/Aloysia_citriodora_002.jpg"]'
	}
];

async function main() {
	const force = process.argv.includes('--force');
	console.log(`🌱 Seeding database...${force ? ' (force mode)' : ''}`);

	for (const s of seeds) {
		const existing = db.select()
			.from(plantsTable)
			.where(eq(plantsTable.commonName, s.commonName))
			.all();

		if (existing.length === 0) {
			db.insert(plantsTable).values(s).run();
			console.log(`  ✓ ${s.commonName}`);
		} else if (force) {
			db.update(plantsTable).set(s).where(eq(plantsTable.commonName, s.commonName)).run();
			console.log(`  ↻ ${s.commonName} (mis à jour)`);
		} else {
			console.log(`  - ${s.commonName} (déjà existant)`);
		}
	}

	console.log(`✅ ${seeds.length} plantes traitées`);
	process.exit(0);
}

main().catch((err) => {
	console.error('❌ Seed failed:', err);
	process.exit(1);
});
