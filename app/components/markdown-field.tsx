'use client';
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    CodeToggle,
    CreateLink,
    DialogButton,
    diffSourcePlugin,
    DiffSourceToggleWrapper,
    type DirectiveDescriptor,
    directivesPlugin,
    frontmatterPlugin,
    headingsPlugin,
    imagePlugin,
    insertDirective$,
    InsertImage,
    InsertTable,
    InsertThematicBreak,
    linkDialogPlugin,
    linkPlugin,
    listsPlugin,
    ListsToggle,
    markdownShortcutPlugin,
    MDXEditor,
    type MDXEditorMethods,
    type MDXEditorProps,
    quotePlugin,
    Separator,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
    UndoRedo,
    usePublisher
} from '@mdxeditor/editor';
import { Youtube } from 'lucide-react';
import { type ForwardedRef, forwardRef, useId, useRef } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { ErrorList, type ListOfErrors } from '~/components/forms';
import { Label } from '~/components/ui/label';
import { Skeleton } from '~/components/ui/skeleton';

// Composant MDXEditor initialisé avec tous les plugins
const InitializedMDXEditor = forwardRef<
    MDXEditorMethods,
    { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps
>(({ editorRef, ...props }, ref) => {
    return (
        <MDXEditor
            plugins={[
                // Plugins de base
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                thematicBreakPlugin(),
                markdownShortcutPlugin(),

                // Plugins avancés
                linkPlugin(),
                linkDialogPlugin(),
                imagePlugin({
                    imageAutocompleteSuggestions: [
                        'https://via.placeholder.com/150',
                        'https://picsum.photos/200/300',
                    ],
                }),
                tablePlugin(),
                // codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
                // codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text', tsx: 'TypeScript' } }),
                diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: '' }),
                frontmatterPlugin(),
                directivesPlugin({ directiveDescriptors: [YoutubeDirectiveDescriptor] }),

                // Toolbar plugin avec tous les contrôles
                toolbarPlugin({
                    toolbarContents: () => (
                        <>
                            <DiffSourceToggleWrapper>
                                <UndoRedo />
                                <Separator />
                                <BoldItalicUnderlineToggles />
                                <CodeToggle />
                                <Separator />
                                <BlockTypeSelect />
                                <Separator />
                                <CreateLink />
                                <InsertImage />
                                <Separator />
                                <ListsToggle />
                                <InsertTable />
                                <InsertThematicBreak />
                                <Separator />
                                <YouTubeButton />
                                <Separator />
                            </DiffSourceToggleWrapper>
                        </>
                    ),
                }),
            ]}
            contentEditableClassName='prose max-w-none min-h-[200px] p-4 border border-input rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
            {...props}
            ref={editorRef || ref}
        />
    );
});

InitializedMDXEditor.displayName = 'InitializedMDXEditor';

// YouTube Directive Descriptor
const YoutubeDirectiveDescriptor: DirectiveDescriptor = {
    name: 'youtube',
    testNode(node) {
        return node.name === 'youtube';
    },
    attributes: ['id'],
    hasChildren: false,
    Editor: ({ mdastNode }) => {
        const videoId = mdastNode.attributes?.id;
        return (
            <div className="my-4 flex justify-center">
                <div className="w-full max-w-2xl aspect-video">
                    {videoId ? (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="rounded-lg"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                            Invalid YouTube video ID
                        </div>
                    )}
                </div>
            </div>
        );
    }
};

// YouTube Button Component
const YouTubeButton = () => {
    const insertDirective = usePublisher(insertDirective$);

    return (
        <DialogButton
            tooltipTitle="Insert YouTube video"
            submitButtonTitle="Insert video"
            dialogInputPlaceholder="Paste the YouTube video URL"
            buttonContent={<Youtube strokeWidth={0.5} className='size-7 shrink-0 fill-red-500 text-white' />}
            onSubmit={(url) => {
                try {
                    const videoId = new URL(url).searchParams.get('v');
                    if (videoId) {
                        insertDirective({
                            name: 'youtube',
                            type: 'leafDirective',
                            attributes: { id: videoId }
                        });
                    } else {
                        alert('Invalid YouTube URL. Please make sure it contains a video ID (v parameter).');
                    }
                } catch {
                    alert('Invalid URL format. Please paste a valid YouTube URL.');
                }
            }}
        />
    );
};

export const MarkdownField = ({
    labelProps,
    textareaProps,
    errors,
    className,
    onContentChange,
    content,
}: {
    labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
    textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
    errors?: ListOfErrors;
    className?: string;
    onContentChange: (markdown: string) => void;
    content: string;
}) => {
    const fallbackId = useId();
    const id = textareaProps.id ?? textareaProps.name ?? fallbackId;
    const errorId = errors?.length ? `${id}-error` : undefined;
    const editorRef = useRef<MDXEditorMethods | null>(null);

    return (
        <div className={className}>
            <Label htmlFor={id} {...labelProps} />

            <textarea {...textareaProps} className='hidden' value={content} />

            <ClientOnly
                fallback={
                    <div className='mt-2'>
                        {/* Toolbar skeleton */}
                        <div className='border border-input rounded-t-md p-2 bg-muted/30'>
                            <div className='flex items-center gap-2'>
                                <Skeleton className='h-8 w-16' />
                                <div className='w-px h-6 bg-border' />
                                <Skeleton className='h-8 w-8' />
                                <Skeleton className='h-8 w-8' />
                                <Skeleton className='h-8 w-8' />
                                <div className='w-px h-6 bg-border' />
                                <Skeleton className='h-8 w-24' />
                                <div className='w-px h-6 bg-border' />
                                <Skeleton className='h-8 w-8' />
                                <Skeleton className='h-8 w-8' />
                            </div>
                        </div>
                        {/* Editor skeleton */}
                        <div className='min-h-[200px] p-4 border-x border-b border-input rounded-b-md'>
                            <Skeleton className='h-4 w-3/4 mb-3' />
                            <Skeleton className='h-4 w-1/2 mb-3' />
                            <Skeleton className='h-4 w-2/3 mb-3' />
                            <Skeleton className='h-4 w-1/3' />
                        </div>
                    </div>
                }
            >
                {() => (
                    <div
                        id={id}
                        aria-invalid={errorId ? true : undefined}
                        aria-describedby={errorId}
                        className='mt-2'
                    >
                        <InitializedMDXEditor
                            editorRef={editorRef}
                            markdown={content}
                            onChange={onContentChange}
                        />
                    </div>
                )}
            </ClientOnly>

            <div className='min-h-[32px] px-4 pt-1 pb-3'>
                {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
            </div>
        </div>
    );
};




