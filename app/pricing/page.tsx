import { Metadata } from "next";
import { ContactForm } from "@/app/components/ContactForm";
import CouponRedemption from "@/app/components/CouponRedemption";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Pricing for the slot system.",
};

export default function Pricing() {
  return (
    <div>
      <h1 className="text-2xl font-bold p-6">Simple Pricing Model</h1>
      <div className="text-lg border-y border-green-900 py-4">
        <p>
          Most users after a short trial period opt for the lifetime membership,
          although you can also continue testing for a 1 year option as well.
          All payments are made via contact form.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Lifetime Membership</strong> - $250.00
          </li>
          <li>
            <strong>1 Year Membership</strong> - $150.00
          </li>
        </ul>
      </div>
      <div className="text-lg border-y border-green-900 py-4">
        <p className="mb-4">
          If you have a coupon code, please enter it below to redeem your
          discount.
        </p>
        <CouponRedemption />
      </div>
      <ContactForm />
    </div>
  );
}
