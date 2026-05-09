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
        <p className="mt-2 text-sm text-white/40">Derni&egrave;re mise &agrave; jour&nbsp;: mai 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Qu&rsquo;est-ce qu&rsquo;un cookie&nbsp;?</h2>
            <p className="mt-3">
              Un cookie est un petit fichier texte d&eacute;pos&eacute; sur votre appareil lors de la visite d&rsquo;un site web.
              Il permet au site de m&eacute;moriser certaines informations pour am&eacute;liorer votre exp&eacute;rience de navigation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Cookies essentiels (toujours actifs)</h2>
            <p className="mt-3">
              Ces cookies sont strictement n&eacute;cessaires au fonctionnement du site. Ils ne n&eacute;cessitent pas votre
              consentement conform&eacute;ment &agrave; l&rsquo;article 82 de la loi Informatique et Libert&eacute;s.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 pr-4 text-white">Nom</th>
                    <th className="py-2 pr-4 text-white">Finalit&eacute;</th>
                    <th className="py-2 text-white">Dur&eacute;e</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">better-auth.session_token</td>
                    <td className="py-2 pr-4">Authentification des restaurateurs (admin)</td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">tz</td>
                    <td className="py-2 pr-4">D&eacute;tection du fuseau horaire pour les rapports analytiques</td>
                    <td className="py-2">1 an</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">admin_locale</td>
                    <td className="py-2 pr-4">Langue d&rsquo;affichage de l&rsquo;interface admin</td>
                    <td className="py-2">1 an</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">carte_intro_seen</td>
                    <td className="py-2 pr-4">&Eacute;vite de r&eacute;afficher l&rsquo;introduction du mascotte Cloch&eacute;</td>
                    <td className="py-2">1 an</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">cf_clearance</td>
                    <td className="py-2 pr-4">V&eacute;rification anti-bot Cloudflare Turnstile (s&eacute;curit&eacute;)</td>
                    <td className="py-2">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Stockage local (localStorage / sessionStorage)</h2>
            <p className="mt-3">
              Ces donn&eacute;es restent enti&egrave;rement sur votre appareil et ne sont jamais transmises &agrave; nos serveurs&nbsp;:
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 pr-4 text-white">Cl&eacute;</th>
                    <th className="py-2 pr-4 text-white">Type</th>
                    <th className="py-2 text-white">Finalit&eacute;</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">carte-analytics-consent</td>
                    <td className="py-2 pr-4">localStorage</td>
                    <td className="py-2">Stocke votre choix de consentement (accept&eacute; / refus&eacute;)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">carte_wishlist</td>
                    <td className="py-2 pr-4">Cookie</td>
                    <td className="py-2">Sauvegarde vos plats favoris (liste de souhaits)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">carte_review_nudged</td>
                    <td className="py-2 pr-4">sessionStorage</td>
                    <td className="py-2">&Eacute;vite de r&eacute;afficher la suggestion d&rsquo;avis Google dans la m&ecirc;me session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Cookies analytiques (n&eacute;cessitent votre consentement)</h2>
            <p className="mt-3">
              Lorsque vous acceptez les cookies analytiques, nous collectons des &eacute;v&eacute;nements d&rsquo;utilisation
              anonymis&eacute;s pour am&eacute;liorer le service. Ces donn&eacute;es sont stock&eacute;es dans notre propre
              base de donn&eacute;es et <strong className="text-white">ne sont jamais partag&eacute;es avec des tiers</strong>.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 pr-4 text-white">&Eacute;v&eacute;nement</th>
                    <th className="py-2 text-white">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">scan</td>
                    <td className="py-2">Un QR code est scann&eacute; (ouverture de page)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">recommend_view</td>
                    <td className="py-2">Des recommandations sont affich&eacute;es</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">dwell</td>
                    <td className="py-2">Temps pass&eacute; sur la page (en secondes)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">adoption</td>
                    <td className="py-2">Un plat recommand&eacute; est command&eacute;</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">mode_switch</td>
                    <td className="py-2">Changement de mode de recommandation</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">culture_match</td>
                    <td className="py-2">D&eacute;tection automatique du mode groupe</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">wishlist_heart</td>
                    <td className="py-2">Un plat est ajout&eacute; ou retir&eacute; des favoris</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs text-emerald-400">share</td>
                    <td className="py-2">Le lien du restaurant est partag&eacute;</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Chaque &eacute;v&eacute;nement est associ&eacute; &agrave; un identifiant de session al&eacute;atoire (UUID g&eacute;n&eacute;r&eacute; c&ocirc;t&eacute; client, non li&eacute; &agrave; votre identit&eacute;).
              <strong className="text-white"> Aucune adresse IP, aucun cookie tiers, aucun identifiant publicitaire</strong> n&rsquo;est collect&eacute;.
            </p>
            <p className="mt-2">
              Si vous refusez les cookies analytiques, <strong className="text-white">aucun &eacute;v&eacute;nement n&rsquo;est envoy&eacute;</strong> et le site fonctionne normalement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Cookies tiers</h2>
            <p className="mt-3">
              CarteAI <strong className="text-white">n&rsquo;utilise aucun cookie publicitaire, de suivi ou d&rsquo;analyse tiers</strong>.
              Nous n&rsquo;int&eacute;grons pas Google Analytics, Facebook Pixel, ni aucun autre outil de tracking tiers.
              Le seul service tiers pouvant d&eacute;poser un cookie est Cloudflare Turnstile (protection anti-bot), class&eacute; comme essentiel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Gestion et retrait du consentement</h2>
            <p className="mt-3">
              Vous pouvez &agrave; tout moment modifier votre choix en cliquant sur le lien
              <strong className="text-emerald-400"> &laquo;&nbsp;Param&egrave;tres cookies&nbsp;&raquo;</strong> en bas de chaque page.
              Ce lien r&eacute;initialise votre consentement et r&eacute;affiche la banni&egrave;re de cookies.
            </p>
            <p className="mt-2">
              Vous pouvez &eacute;galement supprimer tous les cookies via les param&egrave;tres de votre navigateur.
              Notez que cela pourrait affecter le fonctionnement du site (d&eacute;connexion, perte de pr&eacute;f&eacute;rences).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Base l&eacute;gale</h2>
            <p className="mt-3">
              Cookies essentiels&nbsp;: article 82 de la loi Informatique et Libert&eacute;s (exemption de consentement).<br />
              Cookies analytiques&nbsp;: article 82 de la loi Informatique et Libert&eacute;s + lignes directrices CNIL du 1er octobre 2020
              (consentement pr&eacute;alable requis, possibilit&eacute; de refus &eacute;quivalente &agrave; l&rsquo;acceptation).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Contact</h2>
            <p className="mt-3">
              Pour toute question relative aux cookies, contactez-nous &agrave;{" "}
              <a href="mailto:privacy@carte-ai.link" className="text-emerald-400 hover:underline">privacy@carte-ai.link</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
