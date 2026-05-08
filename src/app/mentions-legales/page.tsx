import Link from "next/link";
import Image from "next/image";

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white/80">
      <div className="mx-auto max-w-2xl px-5 py-16">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors">
          <Image src="/images/logo-icon.png" alt="CarteAI" width={24} height={24} className="rounded" />
          <span className="font-medium text-white">CarteAI</span>
          <span>&larr; Retour</span>
        </Link>
        <h1 className="text-3xl font-bold text-white">Mentions L&eacute;gales</h1>
        <p className="mt-2 text-sm text-white/40">Derni&egrave;re mise &agrave; jour : mai 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. &Eacute;diteur du site</h2>
            <ul className="mt-3 space-y-1.5">
              <li><strong className="text-white">Raison sociale :</strong> Boyuan SHI — Micro-entrepreneur</li>
              <li><strong className="text-white">SIRET :</strong> 98963576800033</li>
              <li><strong className="text-white">SIREN :</strong> 989635768</li>
              <li><strong className="text-white">Code NAF :</strong> 6201Z — Programmation informatique</li>
              <li><strong className="text-white">Adresse :</strong> 12 rue Louis Pergaud, 92350 Le Plessis-Robinson, France</li>
              <li><strong className="text-white">Email :</strong> <a href="mailto:contact@carte-ai.link" className="text-emerald-400 hover:underline">contact@carte-ai.link</a></li>
              <li><strong className="text-white">Directeur de la publication :</strong> Boyuan SHI</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. H&eacute;bergeur</h2>
            <ul className="mt-3 space-y-1.5">
              <li><strong className="text-white">Raison sociale :</strong> Vercel Inc.</li>
              <li><strong className="text-white">Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, &Eacute;tats-Unis</li>
              <li><strong className="text-white">Site web :</strong> vercel.com</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Propri&eacute;t&eacute; intellectuelle</h2>
            <p className="mt-3">
              L&rsquo;ensemble du contenu du site carte-ai.link (textes, images, logos, logiciels) est prot&eacute;g&eacute; par le droit d&rsquo;auteur. Toute reproduction, m&ecirc;me partielle, est interdite sans autorisation pr&eacute;alable &eacute;crite de l&rsquo;&eacute;diteur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Donn&eacute;es personnelles</h2>
            <p className="mt-3">
              Le traitement des donn&eacute;es personnelles est d&eacute;crit dans notre{" "}
              <Link href="/privacy" className="text-emerald-400 hover:underline">Politique de confidentialit&eacute;</Link>.
              Conform&eacute;ment au R&egrave;glement G&eacute;n&eacute;ral sur la Protection des Donn&eacute;es (RGPD), vous disposez d&rsquo;un droit d&rsquo;acc&egrave;s, de rectification, d&rsquo;effacement et de portabilit&eacute; de vos donn&eacute;es, ainsi que d&rsquo;un droit de limitation et d&rsquo;opposition au traitement. Pour exercer ces droits, contactez-nous &agrave; <a href="mailto:privacy@carte-ai.link" className="text-emerald-400 hover:underline">privacy@carte-ai.link</a>.
            </p>
            <p className="mt-2">
              Vous pouvez &eacute;galement introduire une r&eacute;clamation aupr&egrave;s de la CNIL (Commission Nationale de l&rsquo;Informatique et des Libert&eacute;s) : <span className="text-white">cnil.fr</span>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Cookies</h2>
            <p className="mt-3">
              Le site utilise des cookies essentiels au fonctionnement du service (authentification, pr&eacute;f&eacute;rences de langue). Aucun cookie publicitaire ou de suivi tiers n&rsquo;est utilis&eacute;. Pour en savoir plus, consultez notre{" "}
              <Link href="/cookies" className="text-emerald-400 hover:underline">Politique de cookies</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Loi applicable</h2>
            <p className="mt-3">
              Le pr&eacute;sent site est soumis au droit fran&ccedil;ais. En cas de litige, les tribunaux comp&eacute;tents de Nanterre seront seuls comp&eacute;tents.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
