import {
	DeleteObjectCommand,
	type DeleteObjectCommandInput,
	ListObjectsV2Command,
	type ListObjectsV2CommandInput,
	PutObjectCommand,
	type PutObjectCommandInput,
	S3Client,
} from "@aws-sdk/client-s3";
import { serverEnv } from "./env.server";

// Configuration du client S3
const s3Client = new S3Client({
	region: serverEnv.AWS_REGION,
	credentials: {
		accessKeyId: serverEnv.AWS_ACCESS_KEY_ID!,
		secretAccessKey: serverEnv.AWS_SECRET_ACCESS_KEY!,
	},
});

const BUCKET_NAME = serverEnv.AWS_S3_BUCKET_NAME!;

/**
 * Upload un fichier vers S3 avec accès public
 */
export const uploadFileToS3 = async ({
	file,
	key,
}: {
	file: File;
	key: string;
}): Promise<{ success: boolean; url?: string; error?: string }> => {
	try {
		// Convertir le File en buffer
		const buffer = await file.arrayBuffer();

		const uploadParams: PutObjectCommandInput = {
			Bucket: BUCKET_NAME,
			Key: key,
			Body: new Uint8Array(buffer),
			ContentType: file.type,
			CacheControl: "max-age=31536000, public",
		};

		const command = new PutObjectCommand(uploadParams);
		await s3Client.send(command);

		// Construire l'URL publique du fichier
		const publicUrl = `https://${BUCKET_NAME}.s3.${serverEnv.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

		return {
			success: true,
			url: publicUrl,
		};
	} catch (error) {
		console.error("Erreur lors de l'upload vers S3:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Erreur inconnue",
		};
	}
};

/**
 * Supprime un fichier de S3
 */
export const deleteFileFromS3 = async ({
	key,
}: {
	key: string;
}): Promise<{ success: boolean; error?: string }> => {
	try {
		const deleteParams: DeleteObjectCommandInput = {
			Bucket: BUCKET_NAME,
			Key: key,
		};

		const command = new DeleteObjectCommand(deleteParams);
		await s3Client.send(command);

		return {
			success: true,
		};
	} catch (error) {
		console.error("Erreur lors de la suppression du fichier S3:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Erreur inconnue",
		};
	}
};

/**
 * Génère une clé unique pour le fichier basée sur le timestamp et nom original
 */
export const generateFileKey = ({
	originalName,
	folder = "uploads",
}: {
	originalName: string;
	folder?: string;
}): string => {
	const timestamp = Date.now();
	const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
	return `${folder}/${timestamp}_${sanitizedName}`;
};

/**
 * Liste les fichiers dans un dossier S3
 */
export const listS3Objects = async ({
	prefix = "library/",
}: {
	prefix?: string;
} = {}): Promise<{
	success: boolean;
	objects?: S3Object[];
	error?: string;
}> => {
	try {
		const listParams: ListObjectsV2CommandInput = {
			Bucket: BUCKET_NAME,
			Prefix: prefix,
		};

		const command = new ListObjectsV2Command(listParams);
		const response = await s3Client.send(command);

		const objects: S3Object[] = (response.Contents || [])
			.filter((obj) => obj.Key && obj.Size && obj.Size > 0) // Exclure les dossiers vides
			.map((obj) => ({
				key: obj.Key!,
				url: `https://${BUCKET_NAME}.s3.${serverEnv.AWS_REGION}.amazonaws.com/${obj.Key}`,
				size: obj.Size!,
				lastModified: obj.LastModified!,
				name: obj.Key!.split("/").pop() || obj.Key!,
			}));

		return {
			success: true,
			objects,
		};
	} catch (error) {
		console.error("Erreur lors de la liste des objets S3:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Erreur inconnue",
		};
	}
};

export type S3Object = {
	key: string;
	url: string;
	size: number;
	lastModified: Date;
	name: string;
};

/**
 * Extrait la clé du fichier depuis une URL S3
 */
export const extractKeyFromS3Url = ({
	url,
}: {
	url: string;
}): string | null => {
	try {
		const urlObj = new URL(url);
		// Retire le premier slash
		return urlObj.pathname.substring(1);
	} catch {
		return null;
	}
};
