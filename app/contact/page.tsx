import { ContactForm } from "@/app/components/ContactForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Beat ONline Slots",
  description: "Get in touch with us. We'd love to hear from you!",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4">
      <ContactForm />
    </div>
  );
}
