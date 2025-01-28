export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">
            Welcome to Beat Online Slots
          </h2>
          <p className="mb-4">
            This Privacy Policy explains how Beat Online Slots
            (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) collects,
            uses, and protects your personal information when you use our
            website and services.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Information We Collect</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account information (email address, username)</li>
            <li>Authentication data when you sign in</li>
            <li>Usage data and preferences</li>
            <li>Device information and IP addresses</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">
            How We Use Your Information
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and maintain our services</li>
            <li>To authenticate your identity and maintain security</li>
            <li>To improve our website and user experience</li>
            <li>To communicate with you about updates and changes</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Data Protection</h3>
          <p className="mb-4">
            We implement appropriate security measures to protect your personal
            information from unauthorized access, alteration, disclosure, or
            destruction.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Your Rights</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal information</li>
            <li>Request corrections to your data</li>
            <li>Delete your account and associated data</li>
            <li>Opt-out of marketing communications</li>
            <li>Request data portability</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us through our contact form or support channels.
          </p>
        </section>

        <section className="text-sm text-gray-600">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </section>
      </div>
    </div>
  );
}
