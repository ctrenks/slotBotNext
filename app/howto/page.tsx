import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "How To Use The Bot",
  description:
    "Step-by-step instructions for using our slot bot system effectively.",
};

export default function HowTo() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">How to Use the Slot Bot</h1>

      <div className="space-y-8">
        {/* Getting Started Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <div className="bg-zinc-800 text-white p-6 rounded-lg">
            <ol className="list-decimal pl-6 space-y-4">
              <li>
                Sign up for a membership through our{" "}
                <a href="/pricing" className="text-blue-600 hover:underline">
                  pricing page
                </a>
              </li>
              <li>
                Once your membership is activated, you&apos;ll see the orange
                SlotBot on the header, this is where you recieve your alerts!
              </li>
              <li>
                If on mobile, you will need to open the webpage, then click the
                up arrow (share) icon, then select add to desktop, and then
                accept alert notificarions.
              </li>
              <li>
                On desktop just having the SlotBiot page open should allow
                allerts to appear on your desktop, either way when your ready to
                play be sure to refresh or re open on your device to assure you
                get the alerts.
              </li>
            </ol>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-zinc-800 p-4 rounded-lg">
              <Image
                src="/alertdesktop.png"
                alt="Desktop Alert Setup"
                width={600}
                height={400}
                className="rounded-lg w-full"
              />
              <p className="text-sm text-center mt-2 text-white">
                Desktop Alert Setup
              </p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-lg">
              <Image
                src="/iphione.jpeg"
                alt="iPhone Alert Setup Step 1"
                width={600}
                height={400}
                className="rounded-lg w-full"
              />
              <p className="text-sm text-center mt-2 text-white">
                iPhone Alert Setup - Step 1
              </p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-lg md:col-span-2">
              <Image
                src="/iphonesave.jpeg"
                alt="iPhone Alert Setup Step 2"
                width={600}
                height={400}
                className="rounded-lg w-full"
              />
              <p className="text-sm text-center mt-2 text-white">
                iPhone Alert Setup - Step 2
              </p>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-800 text-white p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-3">Automated Scanning</h3>
              <p>
                Our bot continuously monitors for optimal opportunities using
                advanced algorithms.
              </p>
            </div>
            <div className="bg-zinc-800 text-white p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-3">Smart Analytics</h3>
              <p>Get slerted when we locate high RTP.</p>
            </div>
          </div>
        </section>

        {/* Best Practices Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-800 text-white p-6 rounded-lg">
            <ul className="list-disc pl-6 space-y-3">
              <li>Refresh the page or app when your ready to play,</li>
              <li>Feel fre to ask questions if needed</li>
              <li>Keep your bot software updated to the latest version</li>
            </ul>
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Troubleshooting</h2>
          <div className="bg-zinc-800 text-white p-6 rounded-lg">
            <p className="mb-4">If you encounter any issues:</p>
            <ol className="list-decimal pl-6 space-y-3">
              <li>Restart the app if not seeing alerts over a full day</li>

              <li>Contact our support team if the issue persists</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
