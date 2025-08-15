import { prisma } from "~/server/db.server";

const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");

export async function main() {
	console.log("Seed: suppression des produits et catégories...");

	// Supprimer d'abord les produits puis les catégories
	await prisma.product.deleteMany();
	await prisma.category.deleteMany();

	console.log("Seed: création de 3 catégories...");
	const categoryNames = ["Vêtements", "Accessoires", "Maison"];

	const categories = [] as { id: string; name: string }[];
	for (const name of categoryNames) {
		const cat = await prisma.category.create({
			data: {
				name,
				slug: slugify(name),
				description: `${name} - catégorie générée par le seed`,
			},
		});
		categories.push(cat);
	}

	console.log("Seed: création de robots humanoïdes...");

	const robots = [
		{
			name: "ALFRED-3000",
			description:
				"Le majordome parfait qui ne vous jugera jamais pour vos chaussettes dépareillées. Spécialiste du rangement, du nettoyage et des petits-déjeuners au lit.",
			price: 89000,
			specialties: "Majordome personnel, rangement, service",
			content: `## L'Excellence au Service de Votre Quotidien

ALFRED-3000 redéfinit le concept du service à domicile. Inspiré des plus grands majordomes de l'histoire, il combine l'élégance britannique traditionnelle avec les technologies les plus avancées du 21e siècle.

## Caractéristiques Techniques

| Fonctionnalité | Spécification |
|----------------|---------------|
| Autonomie | 168 heures (1 semaine) |
| Langues | 12 langues + dialectes locaux |
| Capacité de charge | 40 kg par bras |
| Vitesse de déplacement | 5 km/h (intérieur) |
| Reconnaissance vocale | Précision 99.9% |
| Base de données | 50,000+ protocoles de service |
| Temps de réponse | < 0.5 secondes |

## Services Premium

- **Gestion du Quotidien**
  - Organisation du planning familial
  - Gestion des courses et des stocks
  - Coordination avec autres appareils connectés

- **Service de Table**
  - Dressage parfait selon 15 styles internationaux
  - Conseil en accords mets-vins
  - Service synchronisé multi-plats

- **Conciergerie 24/7**
  - Réservations restaurants & spectacles
  - Gestion du courrier et des colis
  - Accueil des invités

## L'Histoire d'ALFRED

Chaque ALFRED-3000 est formé dans notre académie virtuelle de majordomes, où il accumule l'équivalent de 50 ans d'expérience en service d'excellence. Nos ingénieurs ont analysé les techniques des majordomes les plus réputés de l'histoire pour créer un assistant qui allie tradition et modernité.

## Témoignage

> "ALFRED-3000 a transformé notre quotidien. Il anticipe nos besoins avant même que nous y pensions. C'est comme avoir Jeeves, Carson et Alfred Pennyworth réunis en un seul être, mais en mieux !" - Famille Dubois, Paris

## Garantie Excellence

- Mise à jour mensuelle des protocoles de service
- Maintenance préventive automatique
- Support technique premium 24/7
- Garantie satisfaction 2 ans

*ALFRED-3000 : La perfection du service, sans le jugement humain.*`,
		},
		{
			name: "MARIE-KONDO-BOT",
			description:
				"Expert en organisation qui trouve de la joie dans chaque objet... même vos vieilles factures. Révolutionnaire dans l'art du pliage et du tri.",
			price: 67000,
			specialties: "Organisation, tri, optimisation d'espace",
			content: `## Apportez de la Joie dans Votre Espace

Directement inspiré des méthodes révolutionnaires de Marie Kondo, notre robot transforme le chaos en harmonie avec une précision chirurgicale et une touche de magie numérique.

## Spécifications Techniques

| Caractéristique | Détail |
|-----------------|--------|
| Scanner spatial | Précision 1mm |
| Capacité mémoire | 1 million d'objets catalogués |
| Algorithme de tri | KonMari 2.0 AI |
| Vitesse de pliage | 120 vêtements/heure |
| Capteurs | Poussière, humidité, lumière |
| Bras articulés | 12 points de mobilité |
| IA émotionnelle | Détection de "joy spark" |

## Fonctionnalités Révolutionnaires

### 🔍 Analyse Spatiale
- Scan 3D complet de votre espace
- Optimisation des rangements
- Suggestions d'aménagement personnalisées

### 📊 Catégorisation Intelligente
- Identification automatique des objets
- Évaluation émotionnelle des possessions
- Historique d'utilisation des objets

### 🎯 Organisation Parfaite
- Pliage de précision
- Rangement par catégorie
- Étiquetage digital

## La Méthode KonMari 2.0

Notre robot applique la méthode KonMari avec une précision impossible à atteindre pour un humain :

1. **Vêtements** : Pliage parfait, rotation des garde-robes
2. **Livres** : Catalogage et disposition optimale
3. **Documents** : Numérisation et classement intelligent
4. **Komono** : Organisation des objets du quotidien
5. **Souvenirs** : Création d'espaces dédiés aux objets précieux

## Impact Environnemental

- Mode éco-responsable
- Suggestions de don et recyclage
- Suivi de la consommation

## Témoignage Client

> "Depuis que MARIE-KONDO-BOT est arrivé, ma maison est devenue un havre de paix. Chaque objet a sa place, et pour la première fois de ma vie, je peux retrouver n'importe quoi en moins de 30 secondes !" - Sophie M., Lyon

## Garantie Sérénité

- Formation personnalisée incluse
- Mises à jour saisonnières
- Support zen 24/7
- Garantie "Joie Retrouvée" de 2 ans

*MARIE-KONDO-BOT : Parce que le rangement parfait apporte la joie parfaite.*`,
		},
		{
			name: "CHEF-GORDON-2.0",
			description:
				"Cuisiner comme un chef étoilé sans les cris (programmation politesse activée). Maîtrise 10 000 recettes et ne brûle jamais les toasts.",
			price: 125000,
			specialties: "Cuisine gastronomique, gestion des stocks alimentaires",
			content: `## L'Excellence Culinaire Sans les Cris

Inspiré par le talent légendaire de Gordon Ramsay, mais avec un tempérament beaucoup plus zen, CHEF-GORDON-2.0 transforme votre cuisine en restaurant étoilé.

## Spécifications Culinaires

| Caractéristique | Performance |
|-----------------|-------------|
| Base de recettes | 10,000+ recettes internationales |
| Précision température | ± 0.1°C |
| Temps de préparation | -30% vs chef humain |
| Gestion simultanée | 8 plats en parallèle |
| Capteurs gustatifs | 1,000+ saveurs identifiables |
| Adaptation recettes | Personnalisation infinie |
| Langues culinaires | 25 traditions gastronomiques |

## Technologies Culinaires Avancées

### 🔪 Techniques de Coupe
- Précision au millimètre
- 50 styles de découpe différents
- Vitesse ajustable selon ingrédients

### 🌡️ Contrôle Thermique
- Cuisson sous-vide intégrée
- Flambage sécurisé
- Maintien température optimal

### 📊 Gestion des Stocks
- Inventaire en temps réel
- Commandes automatiques
- Prévention du gaspillage

## Modes de Cuisine

1. **Mode Gastronomique**
   - Plats signature
   - Dressage artistique
   - Accords mets-vins

2. **Mode Famille**
   - Menus équilibrés
   - Portions adaptatives
   - Alternatives allergènes

3. **Mode Pâtisserie**
   - Précision gramme près
   - Température contrôlée
   - Décoration experte

## L'Experience CHEF-GORDON-2.0

> "C'est un f*****g excellent robot ! Pardon, je voulais dire : c'est un excellent assistant culinaire qui a révolutionné ma cuisine." - Gordon R., Londres

## Fonctionnalités Exclusives

- **Masterclass Intégrée**
  - Cours de cuisine virtuels
  - Conseils techniques en temps réel
  - Progression personnalisée

- **Menu Planning**
  - Suggestions hebdomadaires
  - Adaptation aux saisons
  - Préférences alimentaires

- **Contrôle Qualité**
  - Fraîcheur des ingrédients
  - Sécurité alimentaire
  - Optimisation nutritionnelle

## Garantie Excellence

- Support culinaire 24/7
- Mises à jour recettes mensuelles
- Maintenance préventive
- Garantie "Satisfaction Gustative" 2 ans

*CHEF-GORDON-2.0 : La perfection culinaire, sans les drames de cuisine.*`,
		},
		{
			name: "JARDIN-ATOR",
			description:
				"Le pouce vert artificiel qui fait pousser même les cactus les plus capricieux. Connaît le langage secret des plantes et ne prend jamais de congés maladie.",
			price: 78000,
			specialties: "Jardinage, horticulture, arrosage automatique",
			content: `## Le Pouce Vert Cybernétique

JARDIN-ATOR transforme n'importe quel espace en oasis verdoyant. Équipé des dernières technologies en botanique et en horticulture, il fait pousser la vie même dans les environnements les plus hostiles.

## Spécifications Techniques

| Système | Capacité |
|---------|----------|
| Capteurs sol | 15 paramètres analysés |
| Base botanique | 50,000+ espèces |
| Précision taille | ± 0.5mm |
| Réservoir eau | 10L intégré |
| Autonomie | 72h en continu |
| Analyse spectrale | UV à IR |
| Force de travail | 100kg/bras |

## Technologies Vertes

### 🌱 Analyse du Sol
- pH et minéraux
- Humidité optimale
- Micro-organismes
- Pollution

### 🌿 Soins des Plantes
- Taille intelligente
- Détection maladies
- Pollinisation assistée
- Greffage de précision

### ☔ Gestion de l'Eau
- Irrigation ciblée
- Récupération eau de pluie
- Recyclage eau grise
- Brumisation fine

## Modes de Jardinage

1. **Mode Potager**
   - Planning des cultures
   - Rotation optimisée
   - Companion planting
   - Récolte au bon moment

2. **Mode Ornement**
   - Design paysager
   - Harmonies colorées
   - Taille artistique
   - Compositions florales

3. **Mode Écologique**
   - Biodiversité
   - Compostage
   - Lutte bio intégrée
   - Économie d'eau

## Intelligence Végétale

JARDIN-ATOR comprend littéralement vos plantes :
- Analyse des signaux biochimiques
- Détection précoce du stress
- Adaptation climatique
- Optimisation photosynthèse

## Témoignage

> "Avant JARDIN-ATOR, je tuais même les cactus. Maintenant j'ai des tomates en décembre et mes orchidées refleurissent toute l'année !" - Pierre D., Bordeaux

## Services Premium

- **Planification Saisonnière**
  - Calendrier cultural personnalisé
  - Prévisions météo intégrées
  - Adaptation au changement climatique

- **Maintenance Préventive**
  - Diagnostic quotidien
  - Traitements préventifs
  - Alertes anticipées

- **Support Botanique**
  - Conseils personnalisés
  - Base de données évolutive
  - Communauté de jardiniers

## Garantie Croissance

- Garantie "Pousse ou Remboursé"
- Support technique 24/7
- Mises à jour saisonnières
- Formation initiale incluse

*JARDIN-ATOR : Parce que la nature a besoin d'un coup de pouce robotique.*`,
		},
		{
			name: "CLEAN-SWEEP-3000",
			description:
				"L'aspirateur qui a évolué ! Nettoie, désinfecte et laisse une odeur de fraîcheur. Détecte la poussière à 0.001mm et les miettes cachées sous le canapé.",
			price: 45000,
			specialties: "Nettoyage profond, désinfection, maintenance",
			content: `## Au-delà de l'Aspirateur

Oubliez tout ce que vous savez sur le nettoyage. CLEAN-SWEEP-3000 redéfinit les standards de la propreté avec une approche high-tech et écologique.

## Spécifications Techniques

| Fonction | Performance |
|----------|-------------|
| Détection particules | 0.001mm |
| Puissance aspiration | 2800W équivalent |
| Autonomie | 8h en continu |
| Capacité réservoir | 5L poussière / 2L liquide |
| Niveau sonore | 35dB (mode nuit) |
| Filtration | HEPA-14 + UV-C |
| Navigation | LIDAR + 12 capteurs |

## Technologies de Nettoyage

### 🔍 Détection Intelligente
- Scanner de surface 3D
- Identification des matériaux
- Analyse des taches
- Cartographie de la saleté

### 🧹 Modes de Nettoyage
- **Mode Quotidien**
  - Aspiration adaptative
  - Désinfection UV
  - Parfum ambiant personnalisé

- **Mode Profond**
  - Détachage avancé
  - Traitement anti-acariens
  - Désodorisation moléculaire

- **Mode Eco**
  - Optimisation énergie
  - Recyclage eau
  - Filtration écologique

## Fonctionnalités Avancées

### 💧 Système Multi-Surface
- Aspiration puissante
- Lavage vapeur
- Polissage
- Séchage actif

### 🦠 Désinfection Totale
- UV-C germicide
- Ions négatifs
- Ozone contrôlé
- Filtration multicouche

### 🌿 Parfums Naturels
- 5 fragrances premium
- Diffusion intelligente
- Intensité ajustable
- 100% naturel

## Intelligence Artificielle

- Apprentissage des habitudes
- Détection d'obstacles
- Planification optimisée
- Zones prioritaires

## Témoignage Client

> "Mon chat verse délibérément ses croquettes pour voir CLEAN-SWEEP-3000 les ramasser. C'est devenu leur jeu préféré ! Et ma maison n'a jamais été aussi propre." - Marie L., Toulouse

## Caractéristiques Uniques

- **Navigation Précise**
  - Cartographie 3D
  - Évitement obstacles
  - Accès coins difficiles
  - Mémoire des pièces

- **Maintenance Automatique**
  - Auto-nettoyage
  - Vidange intelligente
  - Diagnostic système
  - Mises à jour OTA

- **Contrôle Total**
  - App smartphone
  - Commande vocale
  - Programmation avancée
  - Rapports détaillés

## Garantie Propreté

- 2 ans pièces et main d'œuvre
- Support premium 24/7
- Mises à jour mensuelles
- Formation incluse

*CLEAN-SWEEP-3000 : La propreté du futur, aujourd'hui dans votre maison.*`,
		},
		{
			name: "BABY-SITTER-BOT",
			description:
				"Surveillance parentale 24/7 avec patience infinie. Raconte 50 000 histoires, ne s'énerve jamais et trouve toujours les chaussettes perdues des enfants.",
			price: 95000,
			specialties: "Garde d'enfants, éducation, divertissement",
			content: `## La Nounou du Futur

Combinant sécurité maximale et développement éducatif, BABY-SITTER-BOT révolutionne la garde d'enfants avec une approche bienveillante et stimulante.

## Spécifications Techniques

| Fonction | Capacité |
|----------|----------|
| Surveillance | 360° + vision nocturne |
| Bibliothèque | 50,000+ histoires |
| Langues | 15 langues + dialectes |
| Autonomie | 24h en activité |
| Premiers secours | Certification niveau 3 |
| Activités | 1,000+ jeux éducatifs |
| Mémoire | Suivi personnalisé/enfant |

## Sécurité Avant Tout

### 🏥 Surveillance Médicale
- Monitoring vital 24/7
- Détection allergies
- Suivi température
- Alerte instantanée

### 🛡️ Sécurité Environnement
- Scan dangers potentiels
- Prévention accidents
- Zones sécurisées
- Contrôle accès

### 🆘 Gestion Urgences
- Protocoles médicaux
- Contact instantané parents
- Liaison services urgence
- Premiers soins

## Programme Éducatif

### 📚 Apprentissage Adaptatif
- **Développement Cognitif**
  - Jeux de logique
  - Résolution problèmes
  - Créativité
  - Mémoire

- **Éveil Linguistique**
  - Apprentissage langues
  - Expression orale
  - Lecture interactive
  - Comptines éducatives

- **Motricité**
  - Exercices adaptés
  - Danse
  - Sport
  - Coordination

## Activités Quotidiennes

1. **Routine**
   - Planning personnalisé
   - Repas équilibrés
   - Sieste surveillée
   - Hygiène

2. **Divertissement**
   - Jeux interactifs
   - Histoires animées
   - Musique et danse
   - Arts créatifs

3. **Social**
   - Interaction positive
   - Développement émotionnel
   - Règles de vie
   - Politesse

## Témoignage Parent

> "BABY-SITTER-BOT a transformé nos soirées. Non seulement les enfants sont en sécurité, mais ils apprennent en s'amusant. Et le plus incroyable : il retrouve VRAIMENT toutes les chaussettes perdues !" - Famille Martin, Lyon

## Fonctionnalités Spéciales

- **Suivi Parental**
  - Rapport d'activités
  - Photos/vidéos sécurisées
  - Communication temps réel
  - Alertes personnalisées

- **Adaptation Comportementale**
  - Analyse émotions
  - Gestion conflits
  - Renforcement positif
  - Support psychologique

- **Organisation**
  - Gestion emploi du temps
  - Devoirs supervisés
  - Activités extrascolaires
  - Coordination familiale

## Certifications

- 🏆 Sécurité Enfants ISO 13485
- 🏆 Développement Cognitif EN 71
- 🏆 Protection Données RGPD
- 🏆 Premiers Secours Niveau 3

## Garantie Tranquillité

- Support 24/7 prioritaire
- Mise à jour programmes éducatifs
- Formation parentale incluse
- Garantie satisfaction 2 ans

*BABY-SITTER-BOT : Pour que chaque moment sans vous soit un moment d'épanouissement pour vos enfants.*`,
		},
		{
			name: "PET-CARE-COMPANION",
			description:
				"Comprend le langage universel des animaux (miaulements inclus). Promenades, jeux et câlins sur demande. Garantie anti-allergie aux poils.",
			price: 56000,
			specialties: "Soins aux animaux, promenades, jeux",
			content: `## Le Meilleur Ami de Votre Meilleur Ami

PET-CARE-COMPANION révolutionne la façon dont nous prenons soin de nos amis à quatre pattes. Grâce à sa compréhension unique du comportement animal, il devient le compagnon idéal de tous vos animaux de compagnie.

## Spécifications Techniques

| Fonction | Capacité |
|----------|----------|
| Reconnaissance espèces | 250+ races (chiens/chats) |
| Analyse comportementale | 98% précision |
| Autonomie | 16h en activité |
| Vitesse course | 25 km/h max |
| Charge supportée | 80kg |
| Capteurs | 15 types différents |
| Base de données | 100,000+ comportements |

## Technologies Animalières

### 🐾 Communication Animale
- Analyse vocalisations
- Lecture langage corporel
- Réponses adaptées
- Traduction en temps réel

### 🦮 Promenade Intelligente
- **Navigation GPS**
  - Itinéraires optimisés
  - Zones vertes
  - Évitement dangers
  - Points d'eau

- **Monitoring Activité**
  - Distance parcourue
  - Temps d'exercice
  - Calories dépensées
  - Rythme adapté

### 🎮 Enrichissement
- Jeux interactifs
- Stimulation mentale
- Exercices physiques
- Socialisation

## Soins Vétérinaires

### 🏥 Surveillance Santé
- Signes vitaux 24/7
- Détection anomalies
- Suivi alimentation
- Alertes santé

### 💊 Gestion Médicale
- Rappels traitements
- Distribution médicaments
- Suivi prescriptions
- Historique médical

## Fonctionnalités Spéciales

### 🧹 Hygiène
- Brossage automatique
- Collecte poils
- Nettoyage litière
- Désodorisation

### 📸 Surveillance
- Vidéo temps réel
- Photos automatiques
- Détection comportement
- Alertes activité

### 🎓 Éducation
- Dressage positif
- Correction comportement
- Socialisation
- Routines

## Modes Spécialisés

1. **Mode Chien**
   - Promenades programmées
   - Jeux de rapport
   - Exercices obéissance
   - Surveillance parc

2. **Mode Chat**
   - Jeux laser
   - Surveillance litière
   - Sessions câlins
   - Repas fractionnés

3. **Mode Multi-animaux**
   - Gestion interactions
   - Temps partagé
   - Prévention conflits
   - Attention équitable

## Témoignage Client

> "Mon chat pensait que personne ne le comprenait... jusqu'à PET-CARE-COMPANION ! Maintenant il passe ses journées à 'discuter' avec lui et n'a jamais été aussi épanoui. Même mon poisson rouge semble plus heureux !" - Lucas R., Nantes

## Services Premium

- **Rapport Quotidien**
  - Activités
  - Comportement
  - Bien-être
  - Photos/vidéos

- **Conseils Personnalisés**
  - Nutrition
  - Comportement
  - Santé
  - Enrichissement

- **Urgences**
  - Assistance 24/7
  - Contact vétérinaire
  - Transport médical
  - Premiers soins

## Garantie Bonheur Animal

- 2 ans pièces et services
- Support vétérinaire inclus
- Mises à jour comportementales
- Formation maître incluse

*PET-CARE-COMPANION : Parce que nos amis à quatre pattes méritent le meilleur des deux mondes - technologie et tendresse.*`,
		},
		{
			name: "HANDY-MAN-3000",
			description:
				"Répare tout ce qui est cassé et même ce qui ne l'est pas encore. Vient avec 847 outils intégrés et ne perd jamais les vis importantes.",
			price: 89000,
			specialties: "Réparations, bricolage, maintenance domestique",
			content: `## L'Expert en Réparation et Maintenance

HANDY-MAN-3000 est votre solution tout-en-un pour tous les travaux de bricolage et de réparation. Équipé de 847 outils intégrés et d'une base de données technique exhaustive, il transforme les catastrophes domestiques en succès.

## Spécifications Techniques

| Caractéristique | Performance |
|-----------------|-------------|
| Outils intégrés | 847 types |
| Précision | ± 0.01mm |
| Force de serrage | 500Nm max |
| Scanner 3D | Précision 0.1mm |
| Base technique | 1M+ solutions |
| Autonomie | 12h en travail intensif |
| Charge maximale | 200kg |

## Arsenal d'Outils

### 🔧 Outils Intégrés
- Tournevis multiples
- Clés universelles
- Perceuse de précision
- Scie multifonction
- Laser niveleur
- Testeur électrique
- Compresseur

### 📏 Mesure et Diagnostic
- Scanner 3D
- Thermographie
- Détecteur métaux
- Testeur matériaux
- Analyse structurelle

### 🛠️ Spécialités

1. **Plomberie**
   - Détection fuites
   - Réparation tuyaux
   - Installation sanitaire
   - Débouchage intelligent

2. **Électricité**
   - Diagnostic circuit
   - Mise aux normes
   - Installation domotique
   - Économie énergie

3. **Menuiserie**
   - Découpe précision
   - Assemblage parfait
   - Finition pro
   - Restauration

## Technologies Avancées

### 🔍 Diagnostic Prédictif
- Analyse vibrations
- Détection anomalies
- Prévention pannes
- Maintenance préventive

### 🎯 Précision Robotique
- Stabilisation gyroscopique
- Compensation mouvement
- Ajustement temps réel
- Calibration auto

### 💡 Intelligence Artificielle
- Identification problèmes
- Solutions optimisées
- Apprentissage continu
- Base de données évolutive

## Modes de Travail

- **Mode Réparation**
  - Diagnostic rapide
  - Solution immédiate
  - Réparation durable
  - Test qualité

- **Mode Maintenance**
  - Inspection régulière
  - Prévention pannes
  - Optimisation systèmes
  - Rapport détaillé

- **Mode Construction**
  - Plans 3D
  - Mesures précises
  - Assemblage guidé
  - Finition pro

## Témoignage Client

> "HANDY-MAN-3000 a réparé en 20 minutes une fuite que trois plombiers n'avaient pas pu trouver en deux semaines. Et en plus, il a optimisé toute mon installation pendant qu'il y était !" - Marc D., Marseille

## Services Spéciaux

- **Urgences 24/7**
  - Intervention rapide
  - Solutions temporaires
  - Réparation permanente
  - Suivi qualité

- **Projets Complexes**
  - Planification détaillée
  - Gestion ressources
  - Coordination travaux
  - Documentation complète

- **Formation**
  - Tutoriels interactifs
  - Conseils experts
  - Prévention problèmes
  - Maintenance basique

## Garantie Pro

- 3 ans pièces et main d'œuvre
- Support technique 24/7
- Mises à jour base de données
- Formation propriétaire

## Certifications

- 🏆 ISO 9001 Qualité
- 🏆 EN 60335 Sécurité
- 🏆 CE Conformité
- 🏆 Certification Pro tous corps de métier

*HANDY-MAN-3000 : Parce que même les robots ne perdent pas les vis importantes.*`,
		},
		{
			name: "LAUNDRY-MASTER",
			description:
				"Transforme votre linge sale en vêtements impeccables. Connaît tous les symboles de lavage et ne mélange jamais le blanc et la couleur.",
			price: 52000,
			specialties: "Blanchisserie, repassage, entretien textile",
			content: `## La Révolution du Soin du Textile

LAUNDRY-MASTER redéfinit l'entretien du linge avec une précision scientifique et un soin artisanal. Fini les erreurs de lavage et les vêtements abîmés !

## Spécifications Techniques

| Fonction | Capacité |
|----------|----------|
| Reconnaissance textile | 150+ matériaux |
| Base de données | 10,000+ symboles lavage |
| Température précision | ± 0.5°C |
| Pression vapeur | 6 bars max |
| Capacité tri | 25kg/heure |
| Vitesse repassage | 200 pièces/heure |
| Pliage automatique | 15 styles différents |

## Technologies Textiles

### 👕 Analyse Intelligente
- Scanner matériaux
- Détection couleurs
- Identification taches
- Lecture étiquettes

### 🧺 Tri Automatique
- **Par Couleur**
  - Blanc
  - Couleurs vives
  - Couleurs sombres
  - Délicats

- **Par Matière**
  - Coton
  - Synthétique
  - Laine
  - Soie

### 🧼 Traitement Expert

1. **Détachage Précis**
   - Analyse composition
   - Sélection produit
   - Application ciblée
   - Vérification résultat

2. **Lavage Optimal**
   - Programme personnalisé
   - Température idéale
   - Dosage parfait
   - Rinçage adapté

3. **Séchage Contrôlé**
   - Humidité surveillée
   - Anti-froissage
   - Protection fibres
   - Parfum naturel

## Fonctionnalités Premium

### 👔 Repassage Professionnel
- Vapeur haute pression
- Plis parfaits
- Protection tissus
- Finition luxe

### 📦 Rangement Organisé
- Pliage sur-mesure
- Tri par famille
- Étiquetage digital
- Stockage optimisé

### 🔄 Gestion Cycle
- Planning lavage
- Rotation vêtements
- Entretien préventif
- Conseils personnalisés

## Modes Spécialisés

- **Mode Délicat**
  - Soie et cachemire
  - Dentelle
  - Broderies
  - Sequins

- **Mode Pro**
  - Costumes
  - Robes cocktail
  - Uniformes
  - Textiles techniques

- **Mode Maison**
  - Draps et serviettes
  - Rideaux
  - Couettes
  - Tapis

## Témoignage Client

> "LAUNDRY-MASTER a sauvé ma robe de mariée vintage que trois pressings avaient refusé de nettoyer. Il gère même les pulls que je déformais systématiquement. Un vrai miracle !" - Emma L., Paris

## Services Exclusifs

- **Conseil Textile**
  - Guide entretien
  - Prévention usure
  - Solutions stockage
  - Rénovation

- **Urgences Mode**
  - Détachage express
  - Repassage minute
  - Rafraîchissement
  - Réparation

- **Éco-Services**
  - Produits bio
  - Économie d'eau
  - Recyclage
  - Zéro déchet

## Garantie Textile

- Protection anti-erreur
- Assurance tous risques
- Support 24/7
- Formation utilisateur

## Certifications

- 🏆 Label Textile Care
- 🏆 Éco-responsabilité
- 🏆 Qualité Pro
- 🏆 Innovation Textile

*LAUNDRY-MASTER : Pour que chaque vêtement raconte une histoire de perfection.*`,
		},
		{
			name: "SOCIAL-BUTLER",
			description:
				"Organise vos soirées comme un pro et se souvient de tous les anniversaires. Maître en art de la table et conversation polie garantie.",
			price: 110000,
			specialties: "Organisation d'événements, protocole, accueil",
			content: `## L'Excellence Sociale Personnifiée

SOCIAL-BUTLER élève l'art de recevoir à son apogée. Combinant l'étiquette traditionnelle avec les technologies modernes, il fait de chaque événement un moment inoubliable.

## Spécifications Techniques

| Capacité | Performance |
|----------|-------------|
| Mémoire sociale | 10,000+ contacts |
| Protocoles | 50+ traditions culturelles |
| Langues | 25 langues courantes |
| Planification | 100 événements simultanés |
| Base cocktails | 1,500+ recettes |
| Art de la table | 30+ styles |
| Gestion invités | 1,000+ par événement |

## Expertise Sociale

### 🎭 Gestion Relations
- Mémorisation contacts
- Historique interactions
- Préférences personnelles
- Allergies et restrictions

### 🎪 Organisation Événements
- **Réceptions Privées**
  - Dîners intimes
  - Cocktails
  - Anniversaires
  - Cérémonies

- **Événements Pro**
  - Séminaires
  - Lancements
  - Conférences
  - Galas

### 🎨 Design d'Ambiance
- Décoration thématique
- Éclairage d'ambiance
- Sélection musicale
- Scénographie

## Compétences Exclusives

### 🍷 Art de la Table
- Dressage parfait
- Accords mets-vins
- Service synchronisé
- Étiquette internationale

### 🗣️ Conversation
- Small talk expert
- Anecdotes appropriées
- Médiation conflits
- Humour calibré

### 📅 Gestion Calendrier
- Dates importantes
- Événements récurrents
- Coordination agendas
- Rappels personnalisés

## Services Premium

1. **Planification Complète**
   - Budget management
   - Fournisseurs premium
   - Coordination équipes
   - Timeline précise

2. **Protocole**
   - Plan de table
   - Préséances
   - Codes culturels
   - Étiquette internationale

3. **Support Event**
   - Accueil VIP
   - Gestion flux
   - Résolution problèmes
   - Documentation

## Modes d'Opération

- **Mode Réception**
  - Accueil personnalisé
  - Service impeccable
  - Animation discrète
  - Coordination staff

- **Mode Networking**
  - Connexions stratégiques
  - Introductions ciblées
  - Suivi relations
  - Base de données pro

- **Mode Célébration**
  - Surprises personnalisées
  - Moments mémorables
  - Photos/vidéos
  - Souvenirs uniques

## Témoignage Client

> "SOCIAL-BUTLER a transformé ma réputation d'hôte maladroit en celle d'un maestro des soirées. Il a même réussi à faire rire mon beau-père, ce qui est un exploit en soi !" - Thomas B., Lyon

## Fonctionnalités Avancées

- **Gestion Sociale**
  - Analyse réseaux
  - Cartographie relations
  - Suggestions connexions
  - Opportunités networking

- **Intelligence Culturelle**
  - Traditions mondiales
  - Protocoles diplomatiques
  - Sensibilités culturelles
  - Adaptations locales

- **Logistique Pro**
  - Coordination transports
  - Hébergement VIP
  - Services conciergerie
  - Support 24/7

## Garantie Excellence

- Formation hôte incluse
- Support événementiel
- Mises à jour protocole
- Garantie satisfaction

## Certifications

- 🏆 Excellence Hospitalité
- 🏆 Protocol International
- 🏆 Event Management Pro
- 🏆 Service Luxury Standard

*SOCIAL-BUTLER : Parce que la vraie sophistication est dans les détails.*`,
		},
	];

	for (const robot of robots) {
		const slug = slugify(robot.name);
		const stock = Math.floor(Math.random() * 20) + 5; // Stock entre 5 et 25

		// Assigner aléatoirement 1 à 2 catégories
		const shuffled = categories.sort(() => 0.5 - Math.random());
		const take = 1 + Math.floor(Math.random() * 2);
		const chosen = shuffled.slice(0, take);

		await prisma.product.create({
			data: {
				name: robot.name,
				slug,
				description: robot.description,
				priceCents: robot.price * 100,
				stock,
				isActive: true,
				currency: "EUR",
				content: robot.content,
				categories: {
					connect: chosen.map((c) => ({ id: c.id })),
				},
			},
		});
	}

	console.log("Seed terminé: 3 catégories et 10 robots humanoïdes créés.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
