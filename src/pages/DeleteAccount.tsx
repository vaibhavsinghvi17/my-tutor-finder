import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";

export default function DeleteAccount() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="container py-8 max-w-3xl flex-1">
        <Card className="p-6 sm:p-8 space-y-5 prose prose-sm max-w-none">
          <h1 className="text-2xl font-bold">Account Deletion Request – The Scholarr</h1>
          <p className="text-xs text-muted-foreground">Last Updated: June 3, 2026</p>

          <p>
            The Scholarr respects your privacy and provides users with the ability to request deletion of their account
            and associated personal data.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">How to Request Account Deletion</h2>
            <p>To request deletion of your account, please use one of the following methods:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Send an email to:{" "}
                <a href="mailto:support@thescholarr.com" className="text-primary underline">
                  support@thescholarr.com
                </a>
              </li>
              <li>Include your registered email address and/or mobile number.</li>
              <li>Use the subject line: "Account Deletion Request".</li>
            </ol>
            <p>Our support team will verify your request and process it within 7 business days.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">What Data Will Be Deleted</h2>
            <p>Upon successful verification and processing of your request, we will delete:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>User account information</li>
              <li>Profile information</li>
              <li>Contact details</li>
              <li>Uploaded documents and files</li>
              <li>Chat and communication records (where applicable)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Data That May Be Retained</h2>
            <p>Certain information may be retained for a limited period where required for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Legal compliance</li>
              <li>Fraud prevention</li>
              <li>Security investigations</li>
              <li>Financial or tax record keeping</li>
            </ul>
            <p>Any retained data will be securely stored and deleted when the applicable retention period expires.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Retention Period</h2>
            <p>
              Account deletion requests are normally completed within 7 business days. Any legally required retained
              information may be kept for up to 90 days or longer where required by applicable law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Contact Us</h2>
            <p>If you have questions regarding account deletion or privacy, please contact:</p>
            <p>
              Email:{" "}
              <a href="mailto:support@thescholarr.com" className="text-primary underline">
                support@thescholarr.com
              </a>
            </p>
            <p>The Scholarr</p>
          </section>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
