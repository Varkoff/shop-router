import { prisma } from "~/server/db.server";

const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");

const randomPrice = (min: number, max: number) => {
	return (Math.random() * (max - min) + min).toFixed(2);
};

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

	console.log(
		"Seed: création de 10 produits aléatoires associés aux catégories...",
	);

	const adjectives = [
		"Confortable",
		"Élégant",
		"Compact",
		"Premium",
		"Léger",
		"Robuste",
		"Chic",
		"Coloré",
	];
	const nouns = [
		"T-shirt",
		"Casquette",
		"Mug",
		"Sac",
		"Coussin",
		"Chaussure",
		"Lampe",
		"Écharpe",
	];

	for (let i = 0; i < 10; i++) {
		const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
			nouns[Math.floor(Math.random() * nouns.length)]
		}`;
		const slug = `${slugify(name)}-${i}`;
		const priceStr = randomPrice(5, 200);
		const stock = Math.floor(Math.random() * 100);

		// Choisir 1 à 3 catégories au hasard
		const shuffled = categories.sort(() => 0.5 - Math.random());
		const take = 1 + Math.floor(Math.random() * 3);
		const chosen = shuffled.slice(0, take);

		await prisma.product.create({
			data: {
				name,
				slug,
				description: `Produit généré: ${name}`,
				// price: priceStr,
				// price
				priceCents: Number(priceStr) * 100,
				stock,
				isActive: true,
				currency: "EUR",
				categories: {
					connect: chosen.map((c) => ({ id: c.id })),
				},
			},
		});
	}

	console.log("Seed terminé: 3 catégories et 10 produits créés.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
