import Link from "next/link";
import Image from "next/image";

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white/80">
      <div className="mx-auto max-w-2xl px-5 py-16">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors">
          <Image src="/images/logo-icon.png" alt="CarteAI" width={24} height={24} className="rounded" />
          <span className="font-medium text-white">CarteAI</span>
          <span>&larr; Retour</span>
        </Link>
        <h1 className="text-3xl font-bold text-white">Politique de Cookies</h1>
        <p className="mt-2 text-sm text-white/40">Derni&egrave;re mise &agrave; jour : mai 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Qu&rsquo;est-ce qu&rsquo;un cookie ?</h2>
            <p className="mt-3">
              Un cookie est un petit fichier texte d&eacute;pos&eacute; sur votre appareil lors de la visite d&rsquo;un site web. Il permet au site de m&eacute;moriser certaines informations pour am&eacute;liorer votre exp&eacute;rience de navigation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Cookies utilis&eacute;s par CarteAI</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 pr-4 text-white">Nom</th>
                    <th className="py-2 pr-4 text-white">Type</th>
                    <th className="py-2 pr-4 text-white">Finalit&eacute;</th>
                    <th className="py-2 text-white">Dur&eacute;e</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">better-auth.session_token</td>
                    <td className="py-2 pr-4">Essentiel</td>
                    <td className="py-2 pr-4">Authentification des restaurateurs</td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">carte-tz</td>
                    <td className="py-2 pr-4">Essentiel</td>
                    <td className="py-2 pr-4">D&eacute;tection du fuseau horaire pour les rapports</td>
                    <td className="py-2">1 an</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">carte-cookie-consent</td>
                    <td className="py-2 pr-4">Essentiel</td>
                    <td className="py-2 pr-4">M&eacute;morisation du choix cookies</td>
                    <td className="py-2">1 an</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Cookies tiers</h2>
            <p className="mt-3">
              CarteAI <strong className="text-white">n&rsquo;utilise aucun cookie publicitaire, de suivi ou d&rsquo;analyse tiers</strong>. Nous n&rsquo;int&eacute;grons pas Google Analytics, Facebook Pixel, ni aucun autre outil de tracking tiers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Stockage local (localStorage)</h2>
            <p className="mt-3">
              Sur les pages de consultation du menu (/r/*), nous utilisons le localStorage du navigateur pour stocker vos pr&eacute;f&eacute;rences (langue, filtres d&rsquo;allerg&egrave;nes, liste de favoris). Ces donn&eacute;es restent sur votre appareil et ne sont jamais transmises &agrave; nos serveurs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Gestion de vos cookies</h2>
            <p className="mt-3">
              Les cookies essentiels sont n&eacute;cessaires au bon fonctionnement du service et ne peuvent pas &ecirc;tre d&eacute;sactiv&eacute;s. Vous pouvez cependant supprimer tous les cookies via les param&egrave;tres de votre navigateur. Notez que cela pourrait affecter le fonctionnement du site (d&eacute;connexion de votre session, perte de pr&eacute;f&eacute;rences).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Contact</h2>
            <p className="mt-3">
              Pour toute question relative aux cookies, contactez-nous &agrave; <a href="mailto:privacy@carte-ai.link" className="text-emerald-400 hover:underline">privacy@carte-ai.link</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
