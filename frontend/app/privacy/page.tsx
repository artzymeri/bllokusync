import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - BllokuSync",
  description: "BllokuSync Privacy Policy - How we collect, use, and protect your data",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: November 7, 2024</p>

          <div className="space-y-8 text-gray-700">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to BllokuSync ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our apartment management platform, including our website and mobile application (collectively, the "Service").
              </p>
              <p>
                By using BllokuSync, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
              <p className="mb-4">We collect the following types of personal information:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Account Information:</strong> Name, surname, email address, phone number, and password when you create an account</li>
                <li><strong>Property Information:</strong> Apartment number/label, property address, monthly rent amount</li>
                <li><strong>Payment Information:</strong> Payment dates, amounts, and status (we do not store credit card details)</li>
                <li><strong>Communication Data:</strong> Messages, complaints, suggestions, and reports you submit through the Service</li>
                <li><strong>Profile Information:</strong> Any additional information you choose to provide in your profile</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Automatically Collected Information</h3>
              <p className="mb-4">When you use our Service, we automatically collect:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
                <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on the Service, access times and dates</li>
                <li><strong>Log Data:</strong> IP address, browser type, internet service provider, referring/exit pages</li>
                <li><strong>Push Notification Tokens:</strong> Device tokens to send you notifications about payments and property updates</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Cookies and Tracking Technologies</h3>
              <p className="mb-4">
                We use cookies and similar tracking technologies to track activity on our Service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Service Provision:</strong> To provide, maintain, and improve our apartment management services</li>
                <li><strong>Payment Management:</strong> To track and manage rental payments between tenants and property managers</li>
                <li><strong>Communication:</strong> To send you notifications about payment confirmations, payment reminders, and property updates</li>
                <li><strong>User Support:</strong> To respond to your inquiries, complaints, and provide customer support</li>
                <li><strong>Security:</strong> To monitor and prevent fraudulent activity and ensure the security of our Service</li>
                <li><strong>Analytics:</strong> To analyze usage patterns and improve our Service features and user experience</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and respond to legal requests</li>
              </ul>
            </section>

            {/* Push Notifications */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Push Notifications</h2>
              <p className="mb-4">
                With your consent, we send push notifications to your mobile device to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Confirm when your rental payment has been received and verified</li>
                <li>Remind you of upcoming payment due dates (sent 7 days before due date)</li>
                <li>Notify you of important property updates and announcements</li>
                <li>Update you on the status of complaints or maintenance requests</li>
              </ul>
              <p className="mb-4">
                You can disable push notifications at any time through your device settings:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>iOS:</strong> Settings → Notifications → BllokuSync → Toggle off</li>
                <li><strong>Android:</strong> Settings → Apps → BllokuSync → Notifications → Toggle off</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. How We Share Your Information</h2>
              <p className="mb-4">We do not sell your personal information. We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Within the Service:</strong> Property managers can view tenant names, apartment labels, and payment information for properties they manage. Tenants can view their own payment history and property information.</li>
                <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf (e.g., hosting, email delivery, analytics). These providers are contractually obligated to protect your information.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or governmental regulation, or if we believe disclosure is necessary to protect our rights or the safety of users.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Encryption of data in transit using SSL/TLS protocols</li>
                <li>Secure password storage using industry-standard hashing algorithms</li>
                <li>Regular security audits and updates</li>
                <li>Access controls limiting who can view and process your data</li>
                <li>Secure server infrastructure with regular backups</li>
              </ul>
              <p>
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as necessary to provide you with our Service and fulfill the purposes outlined in this Privacy Policy. Specifically:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Active Accounts:</strong> We retain your account information while your account is active</li>
                <li><strong>Payment Records:</strong> Payment history is retained for accounting and legal compliance purposes (typically 7 years)</li>
                <li><strong>Deleted Accounts:</strong> When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal purposes</li>
                <li><strong>Backup Systems:</strong> Data in backup systems may be retained for up to 90 days after account deletion</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Privacy Rights</h2>
              <p className="mb-4">Depending on your location, you may have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Access:</strong> You can request access to the personal information we hold about you</li>
                <li><strong>Correction:</strong> You can update or correct your personal information through your account settings</li>
                <li><strong>Deletion:</strong> You can request deletion of your personal information (subject to legal retention requirements)</li>
                <li><strong>Data Portability:</strong> You can request a copy of your data in a portable format</li>
                <li><strong>Objection:</strong> You can object to certain types of data processing</li>
                <li><strong>Withdraw Consent:</strong> You can withdraw consent for data processing at any time</li>
              </ul>
              <p className="mb-4">
                To exercise any of these rights, please contact us using the information provided in the "Contact Us" section below.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="mb-4">
                Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we discover that we have collected personal information from a child under 13, we will take steps to delete that information as soon as possible.
              </p>
            </section>

            {/* International Data Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and maintained on servers located outside of your country or jurisdiction where data protection laws may differ. By using our Service, you consent to the transfer of your information to such locations. We will take appropriate measures to ensure your data receives adequate protection in accordance with this Privacy Policy.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Third-Party Services</h2>
              <p className="mb-4">
                Our Service may use third-party services that collect information used to identify you:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Expo Push Notifications:</strong> For sending push notifications to mobile devices</li>
                <li><strong>Email Service Provider:</strong> For sending email notifications and communications</li>
                <li><strong>Hosting Provider:</strong> For secure server infrastructure and data storage</li>
              </ul>
              <p>
                These third-party service providers have their own privacy policies. We encourage you to review their privacy practices.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last updated" date at the top of this Privacy Policy</li>
                <li>Sending you an email notification (for material changes)</li>
                <li>Displaying an in-app notification (for material changes)</li>
              </ul>
              <p>
                We encourage you to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>

            {/* GDPR Compliance */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. GDPR Compliance (European Users)</h2>
              <p className="mb-4">
                If you are located in the European Economic Area (EEA), you have certain data protection rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Legal Basis:</strong> We process your data based on your consent, contract performance, legal obligations, and legitimate interests</li>
                <li><strong>Data Controller:</strong> BllokuSync is the data controller responsible for your personal information</li>
                <li><strong>Right to Lodge a Complaint:</strong> You have the right to lodge a complaint with your local data protection authority</li>
                <li><strong>Data Protection Officer:</strong> You can contact our privacy team for any GDPR-related inquiries</li>
              </ul>
            </section>

            {/* California Privacy Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. California Privacy Rights (CCPA)</h2>
              <p className="mb-4">
                If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Right to Know:</strong> You can request information about the personal information we collect, use, and share</li>
                <li><strong>Right to Delete:</strong> You can request deletion of your personal information</li>
                <li><strong>Right to Opt-Out:</strong> You can opt-out of the sale of personal information (we do not sell personal information)</li>
                <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
              </ul>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Us</h2>
              <p className="mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="mb-2"><strong>Email:</strong> privacy@bllokusync.com</p>
                <p className="mb-2"><strong>Support:</strong> support@bllokusync.com</p>
                <p className="mb-4"><strong>Response Time:</strong> We aim to respond to all privacy inquiries within 48 hours</p>
                
                <p className="text-sm text-gray-600 mt-4">
                  For data access, correction, or deletion requests, please include your full name, email address associated with your account, and a detailed description of your request.
                </p>
              </div>
            </section>

            {/* Consent */}
            <section className="border-t pt-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Consent</h2>
              <p className="mb-4">
                By using BllokuSync, you acknowledge that you have read and understood this Privacy Policy and agree to its terms. If you do not agree with this Privacy Policy, please do not use our Service.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              This privacy policy is effective as of November 7, 2024 and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

