import type { Root } from 'mdast';
import Markdown from 'react-markdown';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

// Plugin to handle YouTube directives
function remarkYouTube() {
    return (tree: Root) => {
        visit(tree, (node) => {
            if (
                node.type === 'containerDirective' ||
                node.type === 'leafDirective' ||
                node.type === 'textDirective'
            ) {

                const directiveNode = node

                if (directiveNode.name !== 'youtube') return;

                const data = directiveNode.data || {};
                if (!directiveNode.data) {
                    directiveNode.data = data;
                }

                const videoId = directiveNode.attributes?.id;

                if (directiveNode.type === 'textDirective') {
                    return;
                }

                if (!videoId) {
                    return;
                }

                data.hName = 'div';
                data.hProperties = {
                    className: 'my-4 flex justify-center'
                };
                data.hChildren = [
                    {
                        type: 'element',
                        tagName: 'div',
                        properties: { className: 'w-full max-w-2xl aspect-video' },
                        children: [
                            {
                                type: 'element',
                                tagName: 'iframe',
                                properties: {
                                    width: '100%',
                                    height: '100%',
                                    src: `https://www.youtube.com/embed/${videoId}`,
                                    title: 'YouTube video player',
                                    frameBorder: 0,
                                    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                                    allowFullScreen: true,
                                    className: 'rounded-lg'
                                },
                                children: []
                            }
                        ]
                    }
                ];
            }
        });
    };
}

export function MarkdownComponent({ content }: { content: string }) {
    return <div className="prose text-gray-700 font-light">
        <Markdown remarkPlugins={[remarkGfm, remarkDirective, remarkYouTube]}  >
            {content}
        </Markdown>
    </div>
}