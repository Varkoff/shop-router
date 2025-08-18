

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">

          {/* Main Headline */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-extralight mb-6 tracking-tight leading-none">
              L'avenir du
              <br />
              <span className="font-light">travail</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              Des robots humanoïdes conçus pour s'intégrer parfaitement dans votre quotidien
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center mb-16">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-12 py-4 font-medium"
            >
              Découvrir nos modèles
            </Button>
          </div>

          {/* Robot Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <Card className="p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300 bg-white">
              <div className="aspect-square bg-gray-50 rounded-2xl mb-6 flex items-center justify-center">
                <div className="w-20 h-28 bg-gradient-to-b from-gray-300 to-gray-400 rounded-lg" />
              </div>
              <h3 className="text-2xl font-light mb-2">NEXUS-01</h3>
              <p className="text-gray-500 font-light">Modèle phare</p>
              <p className="text-sm text-gray-400 mt-4 font-light">À partir de 89 000€</p>
            </Card>

            <Card className="p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300 bg-white">
              <div className="aspect-square bg-gray-50 rounded-2xl mb-6 flex items-center justify-center">
                <div className="w-16 h-24 bg-gradient-to-b from-gray-300 to-gray-400 rounded-lg" />
              </div>
              <h3 className="text-2xl font-light mb-2">ATLAS-02</h3>
              <p className="text-gray-500 font-light">Compact</p>
              <p className="text-sm text-gray-400 mt-4 font-light">À partir de 45 000€</p>
            </Card>

            <Card className="p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300 bg-white">
              <div className="aspect-square bg-gray-50 rounded-2xl mb-6 flex items-center justify-center">
                <div className="w-24 h-32 bg-gradient-to-b from-gray-300 to-gray-400 rounded-lg" />
              </div>
              <h3 className="text-2xl font-light mb-2">TITAN-03</h3>
              <p className="text-gray-500 font-light">Industriel</p>
              <p className="text-sm text-gray-400 mt-4 font-light">À partir de 150 000€</p>
            </Card>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-black rounded-full mx-auto" />
              <h3 className="text-xl font-light">Intelligence Avancée</h3>
              <p className="text-gray-500 font-light leading-relaxed">
                Capacités de traitement neuronal avec apprentissage en temps réel
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-black rounded-full mx-auto" />
              <h3 className="text-xl font-light">Mouvement Précis</h3>
              <p className="text-gray-500 font-light leading-relaxed">
                22 degrés de liberté avec contrôle moteur millimétrique
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-black rounded-full mx-auto" />
              <h3 className="text-xl font-light">Fonctionnement 24/7</h3>
              <p className="text-gray-500 font-light leading-relaxed">
                Opération continue avec gestion intelligente de l'énergie
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
