import { Check, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { useFetcher } from 'react-router';
import { Button } from '~/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/components/ui/dialog';
import type { S3Object } from '~/server/s3.server';

interface ImageSelectorProps {
    images: S3Object[];
    selectedImages?: S3Object[];
    productId?: string;
    trigger?: React.ReactNode;
    title?: string;
    description?: string;
    multiple?: boolean;
}

export const ImageSelector = ({
    images,
    selectedImages = [],
    productId,
    trigger,
    title = 'Sélectionner des images',
    description = 'Choisissez une ou plusieurs images de votre bibliothèque',
    multiple = true,
}: ImageSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempSelectedImages, setTempSelectedImages] = useState<S3Object[]>(selectedImages);
    const fetcher = useFetcher();
    const linkImagesFetcher = useFetcher();

    const handleImageClick = (image: S3Object) => {
        if (!multiple) {
            setTempSelectedImages([image]);
            return;
        }

        const isSelected = tempSelectedImages.some(img => img.url === image.url);
        const wasInitiallySelected = selectedImages.some(img => img.url === image.url);

        if (isSelected) {
            setTempSelectedImages(prev => prev.filter(img => img.url !== image.url));

            // Si l'image était initialement sélectionnée, la déconnecter immédiatement
            if (wasInitiallySelected && productId) {
                const unlinkFormData = new FormData();
                unlinkFormData.append('intent', 'unlink-image');
                unlinkFormData.append('productId', productId);
                unlinkFormData.append('imageUrl', image.url);

                fetcher.submit(unlinkFormData, { method: 'POST' });
            }
        } else {
            setTempSelectedImages(prev => [...prev, image]);
        }
    };

    const handleConfirm = () => {
        if (!productId || tempSelectedImages.length === 0) {
            setIsOpen(false);
            return;
        }

        const formData = new FormData();
        formData.append('intent', 'link-images');
        formData.append('productId', productId);

        for (const image of tempSelectedImages) {
            formData.append('imageUrls', image.url);
        }

        linkImagesFetcher.submit(formData, { method: 'POST' });
        setIsOpen(false);
    };

    const handleCancel = () => {
        setTempSelectedImages(selectedImages);
        setIsOpen(false);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const defaultTrigger = (
        <Button variant="outline" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Sélectionner des images
        </Button>
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {images.length === 0 ? (
                        <div className="text-center py-12">
                            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                Aucune image trouvée. Uploadez votre première image dans la bibliothèque !
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                            {images.map((image) => {
                                const isSelected = tempSelectedImages.some(img => img.url === image.url);

                                return (
                                    <button
                                        key={image.key}
                                        type="button"
                                        className={`relative w-full cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:shadow-md ${isSelected
                                            ? 'border-primary shadow-md ring-2 ring-primary/20'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleImageClick(image)}
                                    >
                                        <div className="aspect-square bg-gray-100 relative">
                                            <img
                                                src={image.url}
                                                alt={image.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />

                                            {/* Selection overlay */}
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                                        <Check className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* File size badge */}
                                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                                {formatFileSize(image.size)}
                                            </div>
                                        </div>

                                        <div className="p-2">
                                            <p className="text-xs font-medium truncate" title={image.name}>
                                                {image.name}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {tempSelectedImages.length > 0 && (
                            <span>
                                {tempSelectedImages.length} image{tempSelectedImages.length > 1 ? 's' : ''} sélectionnée{tempSelectedImages.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <Button variant="outline" onClick={handleCancel}>
                        Annuler
                    </Button>
                    <Button onClick={handleConfirm} disabled={tempSelectedImages.length === 0}>
                        Confirmer la sélection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
