import { ContactForm } from "@/app/components/ContactForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trial Period request",
  description: "Request a trial period to test the system.",
};

export default function Trial() {
  return (
    <div>
      <h1 className="text-2xl font-bold p-6">Request a Trial Period</h1>
      <div className="text-lg border-y border-green-900 py-4">
        <p>
          Be sure to have signed in here, then use the same email in the form
          below and ask for a trial period. Once we review the request we will
          enable your account for a 2 week period to test the system.
        </p>
      </div>
      <h2 className="text-2xl font-bold p-6">
        Be sure to use the same email you registered here with
      </h2>
      <ContactForm />
    </div>
  );
}
