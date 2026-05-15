import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="container py-8 max-w-3xl flex-1">
        <Card className="p-6 sm:p-8 space-y-5 prose prose-sm max-w-none">
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">1. Who We Are</h2>
            <p>Scholarr ("we", "us") operates a marketplace that connects learners with local tutors and activity providers. This policy explains what personal information we collect and how we use it.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account info:</strong> name, email, phone (when verified), profile photo, password (hashed), authentication provider IDs.</li>
              <li><strong>Profile info:</strong> city, area, pin code, bio, interests, languages, free-time availability, kid profiles you add (name, age).</li>
              <li><strong>Tutor info:</strong> business name, classes you list, schedule, location, pricing, social links.</li>
              <li><strong>Activity:</strong> listings viewed, contact clicks, requests, messages, reviews, reports.</li>
              <li><strong>Device & location:</strong> IP address, browser type, and approximate location if you use "Fetch live location".</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">3. How We Use It</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and operate your account and match you with relevant classes.</li>
              <li>To enable communication between learners and tutors.</li>
              <li>To show analytics to tutors about their listings (aggregated and anonymised where possible).</li>
              <li>To detect abuse, prevent fraud, and enforce our Terms.</li>
              <li>To send transactional emails (e.g. account verification, request updates).</li>
              <li>To improve the Service.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">4. Sharing</h2>
            <p>We share information with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Other users</strong> as part of normal product use — e.g. a tutor sees a learner's name and contact details when the learner sends a request.</li>
              <li><strong>Service providers</strong> that host our infrastructure, send emails, or process payments. They access data only to perform services for us.</li>
              <li><strong>Legal authorities</strong> when required by law or to protect rights and safety.</li>
            </ul>
            <p>We do <strong>not</strong> sell your personal data.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">5. Cookies & Local Storage</h2>
            <p>We use cookies and browser storage to keep you signed in, remember your preferences, and measure usage.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">6. Children</h2>
            <p>The Service is intended for adults. Parents may add child profiles to browse classes for their kids. We do not knowingly collect personal information directly from children under 13.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">7. Your Rights</h2>
            <p>Depending on where you live, you may have the right to access, correct, export, or delete your personal data. You can edit most fields in your profile, or contact us to request deletion of your account.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">8. Data Retention</h2>
            <p>We keep your information for as long as your account is active and as needed to provide the Service. After account deletion, some data may be retained for legal, fraud-prevention, and dispute-resolution purposes.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">9. Security</h2>
            <p>We use industry-standard practices including encryption in transit, hashed passwords, and row-level security. No system is 100% secure — please use a strong, unique password.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">10. Changes</h2>
            <p>We may update this policy. Material changes will be communicated through the Service.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">11. Contact</h2>
            <p>For privacy questions or data requests, reach us through the in-app support channel.</p>
          </section>

          <p className="text-xs text-muted-foreground pt-4 border-t">
            See also our <Link to="/terms" className="text-primary underline">Terms of Service</Link>.
          </p>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
