import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: November 25, 2024</p>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Acceptance of Terms</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    By accessing and using Sui Infrastructure Service Discovery ("the Platform"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
                  </p>
                  <p>
                    We reserve the right to modify these terms at any time. Your continued use of the Platform after changes constitutes acceptance of the modified terms.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. User Accounts</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    You must create an account to access certain features. You are responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized access</li>
                    <li>Providing accurate and up-to-date information</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Service Subscriptions</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    <strong>For Developers:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Subscriptions are billed according to the pricing tier selected</li>
                    <li>Payments are processed via smart contracts on the Sui blockchain</li>
                    <li>You may cancel subscriptions at any time with no penalties</li>
                    <li>Refunds are subject to individual provider policies</li>
                    <li>You are responsible for monitoring your quota usage</li>
                  </ul>
                  <p className="mt-4">
                    <strong>For Providers:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You retain ownership of your infrastructure services</li>
                    <li>You set your own pricing and service terms</li>
                    <li>The Platform charges a 5% fee on all transactions</li>
                    <li>You must deliver services as advertised</li>
                    <li>You are responsible for service uptime and quality</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Payment Terms</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    All payments are processed through smart contracts on the Sui blockchain:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Accepted tokens: SUI, USDC, USDT</li>
                    <li>Gas fees are the responsibility of the user</li>
                    <li>Transactions are irreversible once confirmed on-chain</li>
                    <li>Providers receive 95% of subscription revenue</li>
                    <li>Platform fee: 5% per transaction</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Prohibited Activities</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>You may not:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Violate any laws or regulations</li>
                    <li>Infringe on intellectual property rights</li>
                    <li>Distribute malware or harmful code</li>
                    <li>Attempt to gain unauthorized access to the Platform</li>
                    <li>Manipulate or abuse the rating system</li>
                    <li>Engage in fraudulent activities</li>
                    <li>Spam or harass other users</li>
                    <li>Resell or redistribute services without authorization</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Service Availability</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    While we strive for maximum uptime, the Platform is provided "as is" without warranties. We do not guarantee:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Uninterrupted service availability</li>
                    <li>Error-free operation</li>
                    <li>Specific service provider performance</li>
                    <li>Compatibility with all systems</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. Intellectual Property</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    The Platform and its original content, features, and functionality are owned by Sui Infrastructure Service Discovery and protected by international copyright, trademark, and other intellectual property laws.
                  </p>
                  <p>
                    Service providers retain intellectual property rights to their listed services and content.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8. Limitation of Liability</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses resulting from:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your use or inability to use the Platform</li>
                    <li>Service provider performance or availability</li>
                    <li>Unauthorized access to your account</li>
                    <li>Smart contract interactions</li>
                    <li>Blockchain network issues</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>9. Dispute Resolution</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    Disputes between users and service providers should first be resolved through our platform's dispute resolution system. We act as a neutral mediator but are not responsible for resolving all disputes.
                  </p>
                  <p>
                    Any disputes with the Platform itself shall be resolved through binding arbitration in accordance with international arbitration rules.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>10. Termination</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    We reserve the right to terminate or suspend your account at any time for violations of these terms, with or without notice. Upon termination:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your access to the Platform will be revoked</li>
                    <li>Active subscriptions may be cancelled</li>
                    <li>Pending payments will be processed according to smart contract terms</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>11. Changes to Terms</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    We may update these Terms of Service from time to time. We will notify users of material changes via email or platform notification. Continued use of the Platform after changes constitutes acceptance.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>12. Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    For questions about these Terms of Service, please contact us:
                  </p>
                  <ul className="space-y-1">
                    <li>Email: legal@suidiscovery.io</li>
                    <li>Support: support@suidiscovery.io</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
