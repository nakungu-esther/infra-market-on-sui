import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: November 25, 2024</p>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Information We Collect</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    <strong>Account Information:</strong> When you create an account, we collect:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Email address</li>
                    <li>Name</li>
                    <li>User role (Developer, Provider, Admin)</li>
                    <li>Wallet address (for blockchain transactions)</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Usage Data:</strong> We automatically collect:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Service subscriptions and usage statistics</li>
                    <li>API calls and quota consumption</li>
                    <li>Transaction history (on-chain)</li>
                    <li>Browser type and IP address</li>
                    <li>Device information</li>
                    <li>Log files and analytics data</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. How We Use Your Information</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>We use collected information to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Provide and maintain the Platform</li>
                    <li>Process transactions and subscriptions</li>
                    <li>Track service usage and enforce quotas</li>
                    <li>Send service updates and notifications</li>
                    <li>Improve user experience and Platform features</li>
                    <li>Prevent fraud and ensure security</li>
                    <li>Comply with legal obligations</li>
                    <li>Resolve disputes between users</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Blockchain Transparency</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    Important: Certain information is stored on the Sui blockchain and is publicly accessible:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Wallet addresses involved in transactions</li>
                    <li>Transaction amounts and timestamps</li>
                    <li>Smart contract interactions</li>
                    <li>Service subscriptions (associated with wallet addresses)</li>
                  </ul>
                  <p className="mt-3">
                    <strong>Note:</strong> Blockchain data is immutable and cannot be deleted. We do not link wallet addresses to personal identities in our public-facing interfaces.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Data Sharing and Disclosure</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    We do not sell your personal information. We may share data with:
                  </p>
                  <p className="mt-3">
                    <strong>Service Providers:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>When you subscribe to a service, providers see your wallet address and usage statistics</li>
                    <li>Providers need this information to deliver services and enforce quotas</li>
                  </ul>
                  <p className="mt-3">
                    <strong>Third-Party Services:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Analytics providers (Google Analytics, etc.)</li>
                    <li>Cloud hosting services</li>
                    <li>Payment processors (blockchain only)</li>
                  </ul>
                  <p className="mt-3">
                    <strong>Legal Requirements:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>When required by law or legal process</li>
                    <li>To protect our rights and safety</li>
                    <li>To prevent fraud or abuse</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Data Security</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    We implement industry-standard security measures to protect your data:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Encrypted data transmission (HTTPS/TLS)</li>
                    <li>Encrypted data storage</li>
                    <li>Regular security audits</li>
                    <li>Access controls and authentication</li>
                    <li>Secure API key management</li>
                  </ul>
                  <p className="mt-3">
                    However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Your Privacy Rights</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your account</li>
                    <li>Export your data</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Object to certain data processing</li>
                  </ul>
                  <p className="mt-3">
                    <strong>Important:</strong> Data stored on the blockchain cannot be deleted due to its immutable nature.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. Cookies and Tracking</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    We use cookies and similar technologies to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Maintain your session</li>
                    <li>Remember your preferences</li>
                    <li>Analyze Platform usage</li>
                    <li>Improve performance</li>
                  </ul>
                  <p className="mt-3">
                    You can control cookies through your browser settings, but some Platform features may not function properly if cookies are disabled.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8. Children's Privacy</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    The Platform is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>9. International Data Transfers</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using the Platform, you consent to such transfers.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>10. Data Retention</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    We retain your information for as long as:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your account is active</li>
                    <li>Needed to provide services</li>
                    <li>Required for legal compliance</li>
                    <li>Necessary for dispute resolution</li>
                  </ul>
                  <p className="mt-3">
                    After account deletion, we may retain certain information for legal and operational purposes.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>11. Changes to Privacy Policy</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of material changes via email or platform notification. Continued use after changes constitutes acceptance of the updated policy.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>12. Contact Us</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3">
                  <p>
                    For privacy-related questions or to exercise your privacy rights:
                  </p>
                  <ul className="space-y-1">
                    <li>Email: privacy@suidiscovery.io</li>
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
