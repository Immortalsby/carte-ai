import Link from "next/link";
import Image from "next/image";
import { SUPPORTED_LANGUAGE_COUNT } from "@/lib/languages";

export default function CGVPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white/80">
      <div className="mx-auto max-w-2xl px-5 py-16">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors">
          <Image src="/images/logo-icon.png" alt="CarteAI" width={24} height={24} className="rounded" />
          <span className="font-medium text-white">CarteAI</span>
          <span>&larr; Retour</span>
        </Link>
        <h1 className="text-3xl font-bold text-white">Conditions G&eacute;n&eacute;rales de Vente</h1>
        <p className="mt-2 text-sm text-white/40">Derni&egrave;re mise &agrave; jour : mai 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Objet</h2>
            <p className="mt-3">
              Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales de Vente (CGV) r&eacute;gissent l&rsquo;acc&egrave;s et l&rsquo;utilisation du service CarteAI, une plateforme SaaS de conciergerie de menu aliment&eacute;e par intelligence artificielle, &eacute;dit&eacute;e par Boyuan SHI, micro-entrepreneur (SIRET 98963576800033).
            </p>
            <p className="mt-2">
              Le service s&rsquo;adresse exclusivement aux professionnels de la restauration (ci-apr&egrave;s &laquo;&nbsp;le Client&nbsp;&raquo;).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Description du service</h2>
            <p className="mt-3">CarteAI permet aux restaurateurs de :</p>
            <ul className="mt-3 list-disc pl-5 space-y-1.5">
              <li>Importer et num&eacute;riser leur carte (PDF, photo, CSV)</li>
              <li>G&eacute;n&eacute;rer un QR code pour consultation en salle</li>
              <li>Proposer &agrave; leurs clients des recommandations de plats personnalis&eacute;es par IA</li>
              <li>Afficher la carte en {SUPPORTED_LANGUAGE_COUNT} langues avec d&eacute;tection automatique</li>
              <li>G&eacute;rer les 14 allerg&egrave;nes europ&eacute;ens r&egrave;glementaires</li>
              <li>Acc&eacute;der &agrave; un tableau de bord analytique</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Offres et tarification</h2>
            <p className="mt-3">Le service est propos&eacute; sous forme d&rsquo;abonnement mensuel :</p>
            <ul className="mt-3 list-disc pl-5 space-y-1.5">
              <li><strong className="text-white">Essai gratuit :</strong> 14 jours, acc&egrave;s complet aux fonctionnalit&eacute;s &Agrave; La Carte, sans engagement ni carte bancaire</li>
              <li><strong className="text-white">&Agrave; La Carte :</strong> 19&nbsp;&euro; HT / mois — 1 restaurant, 5&nbsp;000 scans IA / mois</li>
              <li><strong className="text-white">Prix Fixe :</strong> 39&nbsp;&euro; HT / mois — jusqu&rsquo;&agrave; 5 restaurants, scans illimit&eacute;s, rapports avanc&eacute;s</li>
              <li><strong className="text-white">Sur Mesure :</strong> tarification personnalis&eacute;e</li>
            </ul>
            <p className="mt-2">
              Les prix s&rsquo;entendent hors taxes. En qualit&eacute; de micro-entrepreneur exon&eacute;r&eacute; de TVA (article 293 B du CGI), la TVA n&rsquo;est pas applicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Paiement</h2>
            <p className="mt-3">
              Le paiement est effectu&eacute; par carte bancaire via Stripe. L&rsquo;abonnement est renouvel&eacute; automatiquement chaque mois. Le Client peut r&eacute;silier &agrave; tout moment depuis son espace d&rsquo;administration ; la r&eacute;siliation prend effet &agrave; la fin de la p&eacute;riode en cours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Droit de r&eacute;tractation</h2>
            <p className="mt-3">
              Le service &eacute;tant destin&eacute; &agrave; des professionnels, le droit de r&eacute;tractation pr&eacute;vu aux articles L221-18 et suivants du Code de la consommation ne s&rsquo;applique pas.
            </p>
            <p className="mt-2">
              N&eacute;anmoins, le Client peut annuler son abonnement &agrave; tout moment. Aucun remboursement au prorata n&rsquo;est effectu&eacute; pour la p&eacute;riode en cours, mais le service reste accessible jusqu&rsquo;&agrave; la fin de la p&eacute;riode pay&eacute;e.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Obligations du Client</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1.5">
              <li>Fournir des informations exactes lors de l&rsquo;inscription</li>
              <li>Maintenir &agrave; jour les donn&eacute;es de sa carte, en particulier les informations relatives aux allerg&egrave;nes</li>
              <li>Ne pas utiliser le service &agrave; des fins illicites</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Responsabilit&eacute;</h2>
            <p className="mt-3">
              Les recommandations g&eacute;n&eacute;r&eacute;es par l&rsquo;IA sont indicatives et ne constituent pas un conseil di&eacute;t&eacute;tique ou m&eacute;dical. Le restaurateur reste seul responsable de l&rsquo;exactitude des informations relatives aux allerg&egrave;nes et aux ingr&eacute;dients de sa carte.
            </p>
            <p className="mt-2">
              CarteAI ne saurait &ecirc;tre tenu responsable des dommages indirects, pertes de donn&eacute;es ou manque &agrave; gagner r&eacute;sultant de l&rsquo;utilisation du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Donn&eacute;es personnelles</h2>
            <p className="mt-3">
              Le traitement des donn&eacute;es personnelles est d&eacute;crit dans notre{" "}
              <Link href="/privacy" className="text-emerald-400 hover:underline">Politique de confidentialit&eacute;</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Propri&eacute;t&eacute; intellectuelle</h2>
            <p className="mt-3">
              Le Client conserve la propri&eacute;t&eacute; de l&rsquo;ensemble des contenus qu&rsquo;il t&eacute;l&eacute;verse sur la plateforme (menus, photos, descriptions). CarteAI b&eacute;n&eacute;ficie d&rsquo;une licence d&rsquo;utilisation limit&eacute;e &agrave; la fourniture du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Modification des CGV</h2>
            <p className="mt-3">
              CarteAI se r&eacute;serve le droit de modifier les pr&eacute;sentes CGV. Le Client sera inform&eacute; par email au moins 30 jours avant l&rsquo;entr&eacute;e en vigueur des modifications. L&rsquo;utilisation continue du service vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Loi applicable et juridiction</h2>
            <p className="mt-3">
              Les pr&eacute;sentes CGV sont soumises au droit fran&ccedil;ais. Tout litige sera port&eacute; devant les tribunaux comp&eacute;tents de Nanterre.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">12. Contact</h2>
            <p className="mt-3">
              Pour toute question relative aux pr&eacute;sentes CGV, contactez-nous &agrave; <a href="mailto:legal@carte-ai.link" className="text-emerald-400 hover:underline">legal@carte-ai.link</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
