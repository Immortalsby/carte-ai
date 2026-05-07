import Link from "next/link";
import Image from "next/image";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <Image src="/images/logo-icon.png" alt="CarteAI" width={24} height={24} className="rounded" />
        <span className="font-medium">CarteAI</span>
        <span>&larr; Back to home</span>
      </Link>
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. What We Collect</h2>
          <p className="mt-2">
            CarteAI collects the minimum data needed to provide its service:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>Restaurant owners:</strong> Name, email address, and restaurant information you provide during registration.</li>
            <li><strong>Diners:</strong> Anonymous usage data (language preference, recommendation mode, allergen filters). We do not require login or collect personal identifiers from diners.</li>
            <li><strong>Google Sign-In:</strong> If you sign in with Google, we receive your name, email, and profile picture from Google. We do not access your contacts, calendar, or other Google data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. How We Use Data</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>To provide AI-powered menu recommendations to diners.</li>
            <li>To show restaurant owners analytics about menu usage.</li>
            <li>To improve our recommendation engine.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Data Sharing</h2>
          <p className="mt-2">
            We do not sell personal data. We share data only with:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Cloud infrastructure providers (Vercel, Neon) for hosting.</li>
            <li>AI model providers (Anthropic, OpenAI) for generating recommendations — only menu data is sent, never personal information.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Data Retention</h2>
          <p className="mt-2">
            Analytics events are retained for 90 days. Account data is retained until you delete your account. You can request data deletion by emailing us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Cookies</h2>
          <p className="mt-2">
            We use essential cookies for authentication sessions only. We do not use tracking cookies or third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Contact</h2>
          <p className="mt-2">
            For privacy questions, contact us at privacy@carte-ai.link.
          </p>
        </section>
      </div>
    </main>
  );
}
