import { ContactForm } from "@/app/components/ContactForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - AFC Media",
  description: "Get in touch with AFC Media. We'd love to hear from you!",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4">
      <ContactForm />
    </div>
  );
}
