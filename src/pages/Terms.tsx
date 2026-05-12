import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="container py-8 max-w-3xl flex-1">
        <Card className="p-6 sm:p-8 space-y-5 prose prose-sm max-w-none">
          <h1 className="text-2xl font-bold">Terms of Service</h1>
          <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
            <p>By accessing or using LearnLocal ("the Service"), you agree to be bound by these Terms. If you do not agree, please do not use the Service.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">2. The Service</h2>
            <p>LearnLocal is a marketplace that connects learners with independent tutors, classes, and activity providers. We are <strong>not a party</strong> to any agreement, class, payment, or relationship between learners and tutors. We do not employ tutors and do not guarantee the quality, safety, or legality of any class listed.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">3. Eligibility</h2>
            <p>You must be at least 18 years old to create an account. Parents and legal guardians may create kid profiles for minors in their care and are responsible for that activity.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">4. User Accounts</h2>
            <p>You are responsible for keeping your login credentials confidential and for all activity under your account. Provide accurate information and keep it up to date.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">5. Listings, Reviews, and Conduct</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tutors are responsible for the accuracy of their listings, qualifications, and the conduct of their classes.</li>
              <li>Reviews must reflect genuine first-hand experience. Fake, paid, or retaliatory reviews are prohibited.</li>
              <li>You agree not to post content that is illegal, harmful, hateful, harassing, sexually explicit, or that violates anyone's rights.</li>
              <li>We may remove content or suspend accounts at our discretion to protect the community.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">6. Payments</h2>
            <p>Class fees are arranged directly between the learner and the tutor. Optional paid features within LearnLocal (such as listing boosts or premium subscriptions) are billed as displayed and are non-refundable except where required by law.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">7. Intellectual Property</h2>
            <p>All trademarks, logos, and software on the Service are owned by LearnLocal or its licensors. You retain ownership of content you post but grant us a worldwide, royalty-free license to display and distribute it as part of operating the Service.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">8. Disclaimer of Warranties</h2>
            <p>The Service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant uninterrupted access, accuracy, or fitness for any particular purpose.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, LearnLocal will not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Service or any class booked through it.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">10. Termination</h2>
            <p>We may suspend or terminate your access at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">11. Changes</h2>
            <p>We may update these Terms from time to time. Material changes will be communicated through the Service. Continued use means acceptance of the updated Terms.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">12. Contact</h2>
            <p>Questions? Reach us through the in-app support channel.</p>
          </section>

          <p className="text-xs text-muted-foreground pt-4 border-t">
            See also our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
          </p>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
