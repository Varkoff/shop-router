import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { parseFormData } from '@mjackson/form-data-parser';
import { Copy, ExternalLink, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { data, Form, useFetcher, useNavigation } from 'react-router';
import { z } from 'zod';
import { ErrorList } from '~/components/forms';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { createImageFromUrl } from '~/server/db.server';
import {
    deleteFileFromS3,
    generateFileKey,
    listS3Objects,
    type S3Object,
    uploadFileToS3,
} from '~/server/s3.server';
import type { Route } from './+types/library';

const MAX_SIZE = 1024 * 1024 * 10; // 10MB

const DeleteImageSchema = z.object({
    intent: z.literal('delete'),
    key: z.string().min(1, 'Clé requise'),
});

const UploadImageSchema = z.object({
    intent: z.literal('upload'),
    files: z
        .array(z.instanceof(File))
        .min(1, 'Veuillez sélectionner au moins un fichier')
        .refine(
            (files) => files.every(file => file.size > 0),
            'Tous les fichiers doivent être valides'
        )
        .refine(
            (files) => files.every(file => file.type.startsWith('image/')),
            'Seules les images sont autorisées'
        )
        .refine(
            (files) => files.every(file => file.size <= MAX_SIZE),
            'Tous les fichiers doivent faire moins de 10MB'
        )
        .refine(
            (files) => files.length <= 10,
            'Maximum 10 fichiers à la fois'
        ),
});

const LibraryFormSchema = z.discriminatedUnion('intent', [
    DeleteImageSchema,
    UploadImageSchema,
]);

export async function loader() {
    const s3Result = await listS3Objects();

    if (!s3Result.success) {
        throw new Response(s3Result.error || 'Erreur lors du chargement des images', {
            status: 500,
        });
    }

    return data({
        images: s3Result.objects || [],
    });
}

export async function action({ request }: Route.ActionArgs) {
    const formData = await parseFormData(request, { maxFileSize: MAX_SIZE });

    const submission = await parseWithZod(formData, {
        schema: LibraryFormSchema.transform(async (data) => {
            if (data.intent === 'delete') {
                return { intent: 'delete', key: data.key };
            }

            if (data.files.length === 0 || data.files.some(file => file.size <= 0)) return z.NEVER;

            // Upload all files to S3 and create Image records
            const uploadResults = await Promise.all(
                data.files.map(async (file) => {
                    const key = generateFileKey({
                        originalName: file.name,
                        folder: 'library',
                    });

                    const uploadResult = await uploadFileToS3({ file, key });

                    if (!uploadResult.success || !uploadResult.url) {
                        throw new Error(`Erreur lors de l'upload de ${file.name}: ${uploadResult.error}`);
                    }

                    // Créer l'enregistrement Image en base de données
                    const imageRecord = await createImageFromUrl({
                        input: {
                            url: uploadResult.url,
                            alt: file.name,
                        }
                    });

                    return {
                        key,
                        fileName: file.name,
                        url: uploadResult.url,
                        imageId: imageRecord.id
                    };
                })
            );

            return {
                intent: data.intent,
                uploadedFiles: uploadResults,
            };
        }),
        async: true,
    });

    if (submission.status !== 'success') {
        return data(
            { result: submission.reply() },
            { status: submission.status === 'error' ? 400 : 200 }
        );
    }

    const { intent } = submission.value;

    if (intent === 'delete') {
        const { key } = submission.value;
        const deleteResult = await deleteFileFromS3({ key });

        if (!deleteResult.success) {
            return data(
                {
                    result: submission.reply({
                        formErrors: [deleteResult.error || 'Erreur lors de la suppression'],
                    }),
                },
                { status: 500 }
            );
        }

        return data({
            result: submission.reply(),
            success: 'Image supprimée avec succès !',
        });
    }

    const { uploadedFiles } = submission.value;
    const fileCount = uploadedFiles?.length || 0;
    const successMessage = fileCount === 1
        ? 'Image uploadée avec succès !'
        : `${fileCount} images uploadées avec succès !`;

    return data({
        result: submission.reply({ resetForm: true }),
        success: successMessage,
    });
}

const ImageCard = ({ image }: { image: S3Object }) => {
    const deleteFetcher = useFetcher();
    const isDeleting = deleteFetcher.state === 'submitting';
    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(image.url);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date: Date): string => {
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                />

                {/* Actions en icônes dans le coin supérieur droit */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Voir l'image"
                        className="w-8 h-8 bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm rounded-md flex items-center justify-center transition-colors"
                    >
                        <ExternalLink className="w-4 h-4 text-gray-900" />
                    </a>

                    <Button
                        onClick={copyToClipboard}
                        size="sm"
                        variant="outline"
                        className={`w-8 h-8 p-0 shadow-lg backdrop-blur-sm transition-colors ${isCopied
                            ? 'bg-green-500/90 hover:bg-green-500 text-white border-green-500'
                            : 'bg-white/90 hover:bg-white text-gray-900 border-white/50'
                            }`}
                        title={isCopied ? 'Copié !' : 'Copier l\'URL'}
                    >
                        <Copy className="w-4 h-4" />
                    </Button>

                    <deleteFetcher.Form method="post" className="inline-block">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="key" value={image.key} />
                        <Button
                            type="submit"
                            size="sm"
                            variant="destructive"
                            disabled={isDeleting}
                            className="w-8 h-8 p-0 shadow-lg"
                            title={isDeleting ? 'Suppression...' : 'Supprimer l\'image'}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </deleteFetcher.Form>
                </div>

                {/* Badge de taille en bas à droite */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    {formatFileSize(image.size)}
                </div>
            </div>

            <CardContent className="p-4">
                <div className="space-y-2">
                    <h3 className="font-semibold text-base truncate" title={image.name}>
                        {image.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Image
                        </span>
                        <span>{formatDate(image.lastModified)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function Library({ loaderData, actionData }: Route.ComponentProps) {
    const { images } = loaderData;
    const lastResult = actionData?.result;
    const successMessage = actionData && 'success' in actionData ? actionData.success as string : undefined;

    const navigation = useNavigation();
    const isUploading = navigation.state === 'submitting' && navigation.formData?.get('intent') === 'upload';

    const [newImagesSrc, setNewImagesSrc] = useState<string[]>([]);
    const [hasSelectedFiles, setHasSelectedFiles] = useState(false);

    const [form, fields] = useForm({
        id: 'library-form',
        constraint: getZodConstraint(LibraryFormSchema),
        lastResult,
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: LibraryFormSchema });
        },
        shouldRevalidate: 'onBlur',
    });

    // Réinitialiser l'état après un upload réussi
    useEffect(() => {
        if (successMessage) {
            setNewImagesSrc([]);
            setHasSelectedFiles(false);
        }
    }, [successMessage]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Bibliothèque d'images</h1>
                    <p className="text-muted-foreground">
                        Gérez vos images hébergées sur S3
                    </p>
                </div>

                {successMessage && (
                    <Alert className="mb-6">
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}

                {/* Upload Form */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Uploader une nouvelle image
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form
                            method="post"
                            encType="multipart/form-data"
                            {...getFormProps(form)}
                            onReset={() => setNewImagesSrc([])}
                        >
                            <ErrorList id={form.errorId} errors={form.errors} />

                            <input type="hidden" name="intent" value="upload" />

                            <div className="space-y-4">
                                {newImagesSrc.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            {newImagesSrc.length} image{newImagesSrc.length > 1 ? 's' : ''} sélectionnée{newImagesSrc.length > 1 ? 's' : ''}
                                        </p>
                                        <div className="flex flex-row gap-2">
                                            {newImagesSrc.map((src, index) => (
                                                <div key={`preview-${src.slice(-20)}-${index}`} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border">
                                                    <img
                                                        src={src}
                                                        alt={`Prévisualisation ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <input
                                    {...getInputProps(fields.files, { type: 'file' })}
                                    accept="image/*"
                                    multiple
                                    className="peer sr-only"
                                    onChange={(e) => {
                                        const files = Array.from(e.currentTarget.files || []);
                                        if (files.length > 0) {
                                            setHasSelectedFiles(true);

                                            // Lire tous les fichiers pour la prévisualisation
                                            const readers = files.map(file => {
                                                return new Promise<string>((resolve) => {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        resolve(event.target?.result?.toString() ?? '');
                                                    };
                                                    reader.readAsDataURL(file);
                                                });
                                            });

                                            Promise.all(readers).then(setNewImagesSrc);
                                        } else {
                                            setHasSelectedFiles(false);
                                            setNewImagesSrc([]);
                                        }
                                    }}
                                />

                                <ErrorList errors={fields.files.errors} id={fields.files.id} />

                                <div className="flex gap-4">
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="cursor-pointer peer-valid:hidden peer-focus-within:ring-2 peer-focus-visible:ring-2"
                                    >
                                        <label htmlFor={fields.files.id} className="gap-2 flex items-center">
                                            <Upload className="w-4 h-4" />
                                            <span>Sélectionner des images</span>
                                        </label>
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={!hasSelectedFiles || isUploading}
                                        isLoading={isUploading}
                                        className="peer-invalid:hidden gap-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        {isUploading ? 'Upload en cours...' : `Uploader ${newImagesSrc.length > 0 ? `(${newImagesSrc.length})` : ''}`}
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </CardContent>
                </Card>

                {/* Images Grid */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            Images ({images.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {images.length === 0 ? (
                            <div className="text-center py-12">
                                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    Aucune image trouvée. Uploadez votre première image !
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {images.map((image) => (
                                    <ImageCard key={image.key} image={image} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
