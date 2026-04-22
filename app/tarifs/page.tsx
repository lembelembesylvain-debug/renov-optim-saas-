export default function Tarifs() {  
  return (  
    <main className="max-w-5xl mx-auto px-6 py-12">  
      <h1 className="text-3xl font-bold text-center mb-4">Nos Tarifs</h1>  
      <p className="text-center text-gray-500 mb-12">Essai gratuit 14 jours - Sans carte bancaire</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        <div className="border rounded-xl p-8">  
          <h2 className="text-xl font-bold mb-2">Starter</h2>  
          <p className="text-3xl font-bold mb-4">49 EUR<span className="text-sm font-normal">/mois</span></p>  
          <ul className="text-gray-600 mb-8 space-y-2">  
            <li>50 simulations/mois</li>  
            <li>MaPrimeRenov + CEE</li>  
            <li>Export PDF</li>  
            <li>Support email</li>  
          </ul>  
          <a href="/signup" className="block text-center bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">  
            Essai gratuit 14 jours  
          </a>  
        </div>

        <div className="border-2 border-green-500 rounded-xl p-8 relative">  
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full">Populaire</span>  
          <h2 className="text-xl font-bold mb-2">Pro</h2>  
          <p className="text-3xl font-bold mb-4">99 EUR<span className="text-sm font-normal">/mois</span></p>  
          <ul className="text-gray-600 mb-8 space-y-2">  
            <li>Simulations illimitees</li>  
            <li>MaPrimeRenov + CEE + Eco-PTZ</li>  
            <li>Export PDF + Excel</li>  
            <li>Aides locales incluses</li>  
            <li>Support prioritaire</li>  
          </ul>  
          <a href="/signup" className="block text-center bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">  
            Essai gratuit 14 jours  
          </a>  
        </div>

        <div className="border rounded-xl p-8">  
          <h2 className="text-xl font-bold mb-2">Agence</h2>  
          <p className="text-3xl font-bold mb-4">199 EUR<span className="text-sm font-normal">/mois</span></p>  
          <ul className="text-gray-600 mb-8 space-y-2">  
            <li>Tout le plan Pro</li>  
            <li>5 utilisateurs inclus</li>  
            <li>API acces</li>  
            <li>Marque blanche</li>  
            <li>Account manager dedie</li>  
          </ul>  
          <a href="/signup" className="block text-center bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">  
            Essai gratuit 14 jours  
          </a>  
        </div>

      </div>

      <p className="text-center text-gray-400 text-sm mt-12">  
        Sans engagement - Resiliation a tout moment - contact@energia-conseils.com  
      </p>  
    </main>  
  )  
}  
