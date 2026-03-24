import { useState } from 'react';
import { FileText, X } from 'lucide-react';

type PageType = 'terms' | 'privacy' | null;

export function LegalPages() {
  const [currentPage, setCurrentPage] = useState<PageType>(null);

  return (
    <>
      <div className="flex gap-4 text-sm">
        <button
          onClick={() => setCurrentPage('terms')}
          className="text-gray-600 hover:text-gray-900 underline"
        >
          Terms of Service
        </button>
        <button
          onClick={() => setCurrentPage('privacy')}
          className="text-gray-600 hover:text-gray-900 underline"
        >
          Privacy Policy
        </button>
      </div>

      {currentPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold">
                  {currentPage === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </h3>
              </div>
              <button
                onClick={() => setCurrentPage(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {currentPage === 'terms' ? <TermsOfService /> : <PrivacyPolicy />}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(null)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TermsOfService() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold mb-4">Terms of Service</h2>
      <p className="text-sm text-gray-600 mb-6">Last Updated: March 23, 2026</p>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h3>
        <p className="text-gray-700 leading-relaxed">
          By accessing and using this racing community platform, you accept and agree to be
          bound by the terms and provision of this agreement. If you do not agree to these terms,
          please do not use this service.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">2. Membership</h3>
        <p className="text-gray-700 leading-relaxed mb-2">
          Membership to this platform requires approval from our administrators. We offer two
          types of memberships:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
          <li>Annual Membership - Valid for one year from approval date</li>
          <li>Lifetime Membership - Valid indefinitely</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-2">
          All memberships are subject to our approval process and payment of applicable fees.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">3. User Conduct</h3>
        <p className="text-gray-700 leading-relaxed mb-2">Users agree to:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
          <li>Provide accurate and truthful information</li>
          <li>Maintain the confidentiality of their account credentials</li>
          <li>Use the platform respectfully and professionally</li>
          <li>Not share inappropriate, offensive, or illegal content</li>
          <li>Not spam or send excessive messages</li>
          <li>Respect other members' privacy and intellectual property</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">4. Content and Messages</h3>
        <p className="text-gray-700 leading-relaxed">
          Users retain ownership of content they post but grant the platform a license to display
          and distribute that content within the platform. We reserve the right to remove any
          content that violates these terms or is deemed inappropriate.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">5. File Sharing</h3>
        <p className="text-gray-700 leading-relaxed">
          Users may share files and images within chat rooms. You are responsible for ensuring you
          have the right to share any files you upload. Files must not exceed 10MB in size.
          Prohibited content includes malware, illegal materials, and copyrighted works without
          permission.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">6. Termination</h3>
        <p className="text-gray-700 leading-relaxed">
          We reserve the right to suspend or terminate accounts that violate these terms or engage
          in behavior we deem harmful to the community. No refunds will be provided for terminated
          accounts.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">7. Disclaimer</h3>
        <p className="text-gray-700 leading-relaxed">
          This platform is provided "as is" without warranties of any kind. We do not guarantee
          uninterrupted access or error-free operation. Information shared on the platform is for
          informational purposes only and should not be considered professional advice.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">8. Changes to Terms</h3>
        <p className="text-gray-700 leading-relaxed">
          We reserve the right to modify these terms at any time. Continued use of the platform
          after changes constitutes acceptance of the new terms.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">9. Contact</h3>
        <p className="text-gray-700 leading-relaxed">
          If you have questions about these terms, please contact our administrators through the
          platform.
        </p>
      </section>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
      <p className="text-sm text-gray-600 mb-6">Last Updated: March 23, 2026</p>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">1. Information We Collect</h3>
        <p className="text-gray-700 leading-relaxed mb-2">We collect the following information:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
          <li>Email address and password for authentication</li>
          <li>Full name and role in the racing community</li>
          <li>Chat messages and file uploads</li>
          <li>Membership application details and payment information</li>
          <li>Usage data including login times and activity patterns</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">2. How We Use Your Information</h3>
        <p className="text-gray-700 leading-relaxed mb-2">
          We use your information to:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
          <li>Provide and maintain the platform services</li>
          <li>Process membership applications and payments</li>
          <li>Enable communication between members</li>
          <li>Send notifications about platform activity</li>
          <li>Improve our services and user experience</li>
          <li>Ensure platform security and prevent abuse</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">3. Information Sharing</h3>
        <p className="text-gray-700 leading-relaxed">
          We do not sell your personal information. Your profile information (name and role) is
          visible to other approved members within the platform. Chat messages are only visible to
          members of the specific chat rooms you join. We may share information if required by law
          or to protect our rights.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">4. Data Security</h3>
        <p className="text-gray-700 leading-relaxed">
          We implement industry-standard security measures to protect your data, including
          encryption, secure authentication, and regular security updates. However, no method of
          transmission over the internet is 100% secure.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">5. Data Retention</h3>
        <p className="text-gray-700 leading-relaxed">
          We retain your information for as long as your account is active. If you wish to delete
          your account and data, please contact our administrators. Some information may be
          retained for legal compliance or legitimate business purposes.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">6. Cookies and Tracking</h3>
        <p className="text-gray-700 leading-relaxed">
          We use cookies and similar technologies to maintain your session and remember your
          preferences. You can disable cookies in your browser settings, but this may affect
          platform functionality.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">7. Your Rights</h3>
        <p className="text-gray-700 leading-relaxed mb-2">You have the right to:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
          <li>Access and update your personal information</li>
          <li>Request deletion of your account and data</li>
          <li>Opt out of non-essential communications</li>
          <li>Export your data in a portable format</li>
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">8. Children's Privacy</h3>
        <p className="text-gray-700 leading-relaxed">
          This platform is not intended for users under the age of 18. We do not knowingly collect
          information from children under 18.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">9. Changes to Privacy Policy</h3>
        <p className="text-gray-700 leading-relaxed">
          We may update this privacy policy from time to time. We will notify users of significant
          changes through the platform.
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">10. Contact Us</h3>
        <p className="text-gray-700 leading-relaxed">
          If you have questions about this privacy policy or how we handle your data, please
          contact our administrators through the platform.
        </p>
      </section>
    </div>
  );
}
