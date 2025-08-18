// import { captureException } from '@sentry/react-router'
import { type ReactElement } from 'react'
import {
    type ErrorResponse,
    isRouteErrorResponse,
    useNavigate,
    useParams,
    useRouteError,
} from 'react-router'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { getErrorMessage } from '~/lib/utils'

type StatusHandler = (info: {
    error: ErrorResponse
    params: Record<string, string | undefined>
}) => ReactElement | null

export const NotFoundPage = () => {
    const navigate = useNavigate()
    return (
        <div className="min-h-screen bg-white text-black">
            <main className="container mx-auto px-6 py-12">
                <div className="max-w-5xl mx-auto">
                    {/* Error Code */}
                    <div className="text-center mb-12">
                        <h1 className="text-8xl md:text-9xl font-extralight mb-6 tracking-tight leading-none text-gray-300">
                            404
                        </h1>

                        <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight leading-none">
                            Page
                            <br />
                            <span className="font-light">introuvable</span>
                        </h2>

                        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
                            La page que vous recherchez semble avoir été déplacée ou n'existe plus
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <Button
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-12 py-4 font-medium"
                            onClick={() => navigate(-1)}
                        >
                            Retour
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-12 py-4 font-medium border-gray-300 hover:bg-gray-50"
                            onClick={() => navigate('/')}
                        >
                            Accueil
                        </Button>
                    </div>

                    {/* Suggestions */}
                    <div className="grid md:grid-cols-3 gap-6 mb-20">
                        <Card className="p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300 bg-white">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6 flex items-center justify-center">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full" />
                            </div>
                            <h3 className="text-xl font-light mb-2">Nos Robots</h3>
                            <p className="text-gray-500 font-light">Découvrez notre gamme complète</p>
                        </Card>

                        <Card className="p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300 bg-white">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-6 flex items-center justify-center">
                                <div className="w-6 h-6 bg-gradient-to-br from-green-600 to-blue-600 rounded-full" />
                            </div>
                            <h3 className="text-xl font-light mb-2">Support</h3>
                            <p className="text-gray-500 font-light">Besoin d'aide ? Contactez-nous</p>
                        </Card>

                        <Card className="p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300 bg-white">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6 flex items-center justify-center">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full" />
                            </div>
                            <h3 className="text-xl font-light mb-2">Actualités</h3>
                            <p className="text-gray-500 font-light">Les dernières innovations</p>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}

export function GeneralErrorBoundary({
    defaultStatusHandler = ({ error }) => (
        <p>
            {error.status} {error.data}
        </p>
    ),
    statusHandlers,
    unexpectedErrorHandler = (error) => <p>{getErrorMessage(error)}</p>,
}: {
    defaultStatusHandler?: StatusHandler
    statusHandlers?: Record<number, StatusHandler>
    unexpectedErrorHandler?: (error: unknown) => ReactElement | null
}) {
    const error = useRouteError()
    const params = useParams()
    const isResponse = isRouteErrorResponse(error)

    if (typeof document !== 'undefined') {
        console.error(error)
    }

    // useEffect(() => {
    // 	if (isResponse) return

    // 	// captureException(error)
    // }, [isResponse])

    // Handle 404 specifically
    if (isResponse && error.status === 404) {
        return <NotFoundPage />
    }

    return (
        <div className="text-h2 container flex items-center justify-center p-20">
            {isResponse
                ? (statusHandlers?.[error.status] ?? defaultStatusHandler)({
                    error,
                    params,
                })
                : unexpectedErrorHandler(error)}
        </div>
    )
}