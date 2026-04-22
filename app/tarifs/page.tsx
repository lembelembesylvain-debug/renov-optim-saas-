export default function Tarifs() {  
  return (  
    <main className="max-w-5xl mx-auto px-6 py-12">  
      <h1 className="text-3xl font-bold text-center mb-4">Nos Tarifs</h1>  
      <p className="text-center text-gray-500 mb-12">Sans engagement - Resiliation a tout moment</p>  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">  
        <div className="border rounded-xl p-8">  
          <h2 className="text-xl font-bold mb-1">Essentiel</h2>  
          <p className="text-sm text-gray-500 mb-4">Petites structures, premiers dossiers digitalises.</p>  
          <p className="text-3xl font-bold mb-6">99 EUR<span className="text-sm font-normal">/mois</span></p>  
          <ul className="text-gray-600 mb-8 space-y-2">  
            <li>✓ Jusqu a 30 dossiers/mois</li>  
            <li>✓ MPR + CEE (estimation)</li>  
            <li>✓ 1 utilisateur</li>  
            <li>✓ Support e-mail</li>  
          </ul>  
          <a href="/signup" className="block text-center border border-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-50">  
            Choisir Essentiel  
          </a>  
        </div>  
        <div className="border-2 border-green-500 rounded-xl p-8 relative">  
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full">Populaire</span>  
          <h2 className="text-xl font-bold mb-1">Professionnel</h2>  
          <p className="text-sm text-gray-500 mb-4">Equipes commerciales et techniques.</p>  
          <p className="text-3xl font-bold mb-6">199 EUR<span className="text-sm font-normal">/mois</span></p>  
          <ul className="text-gray-600 mb-8 space-y-2">  
            <li>✓ Dossiers illimites</li>  
            <li>✓ Exports PDF et marque blanche legere</li>  
            <li>✓ Jusqu a 5 utilisateurs</li>  
            <li>✓ Priorite support</li>  
          </ul>  
          <a href="/signup" className="block text-center bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">  
            Choisir Professionnel  
          </a>  
        </div>  
        <div className="border rounded-xl p-8">  
          <h2 className="text-xl font-bold mb-1">Expert MAR</h2>  
          <p className="text-sm text-gray-500 mb-4">Bureaux d etudes et MAR : volume et conformite.</p>  
          <p className="text-3xl font-bold mb-6">399 EUR<span className="text-sm font-normal">/mois</span></p>  
          <ul className="text-gray-600 mb-8 space-y-2">  
            <li>✓ Tout Professionnel +</li>  
            <li>✓ API et integrations (a venir)</li>  
            <li>✓ Utilisateurs illimites</li>  
            <li>✓ Accompagnement onboarding</li>  
          </ul>  
          <a href="/signup" className="block text-center border border-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-50">  
            Choisir Expert MAR  
          </a>  
        </div>  
      </div>  
      <p className="text-center text-gray-400 text-sm mt-12">  
        Sans engagement - Resiliation a tout moment - contact@energia-conseils.com  
      </p>  
    </main>  
  )  
}  