import InfoBox from "./components/InfoBox";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beat Online Slots",
  description: "Learn how to put the odds in your favor playing online slots.",
};

export default function Home() {
  return (
    <div className="flex">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="w-full text-center">
          <h1 className="text-2xl">
            Unlock the Secrets to Beating Online Slots{" "}
          </h1>
        </div>
        <div className="w-full sm:w-[75%] justify-left">
          <InfoBox>
            At <strong>BeatOnlineSlots.com</strong>, we help players{" "}
            <strong>gain an edge</strong> in online slots by identifying trends
            and patterns that casinos don&apos;t want you to know about. If
            you&apos;re tired of leaving things to pure luck, we provide{" "}
            <strong>real data-driven insights</strong>
            that can help you make <strong>smarter bets</strong> and maximize
            your chances of winning.
          </InfoBox>
        </div>
        <div className="w-full text-center">
          <h2 className="text-2xl">How It Works </h2>
        </div>
        <div className="w-full sm:w-[75%] ml-auto">
          <InfoBox>
            <p>
              Every online slot game has an{" "}
              <strong>RTP (Return to Player) percentage</strong>, which tells
              you how much, on average, a game pays back over time. For example,
              if a slot has a <strong>97% RTP</strong>, that means that for
              every
              <strong>$100 wagered</strong>, it&apos;s expected to return{" "}
              <strong>$97</strong>—but here&apos;s the catch:
              <strong>
                short-term fluctuations create windows of opportunity where RTP
                temporarily spikes
              </strong>
              . That&apos;s where we come in.
            </p>
            <p className="pt-4">
              {" "}
              We <strong>track and monitor</strong> slot machine performance,
              pinpointing <strong>hot slots</strong>—games that are currently
              paying out <strong>higher than expected</strong>. When we detect
              these <strong>winning opportunities</strong>, we{" "}
              <strong>alert our members</strong>, giving them the chance to
              <strong>capitalize on the moment</strong> before the window
              closes.
            </p>
          </InfoBox>
        </div>
        <div className="w-full text-center">
          <h3 className="text-2xl">Why This Works</h3>
        </div>
        <div className="w-full sm:w-[75%] justify-left">
          <InfoBox>
            <p>
              Casinos rely on the fact that most players have{" "}
              <strong>no idea how RTP fluctuations work</strong>—they assume
              every spin is the same. The reality is, slot games go through
              cycles, and{" "}
              <strong>
                catching them at the right time can mean the difference between
                winning and losing
              </strong>
              .
            </p>

            <p className="pt-4">
              We&apos;re not here to sell you a dream—we&apos;re here to{" "}
              <strong>give you an edge</strong> based on real, measurable data.
              You won&apos;t win every time, but by playing{" "}
              <strong>smarter</strong>, you can{" "}
              <strong>tip the odds further in your favor</strong>.
            </p>
          </InfoBox>
        </div>
        <div className="w-full text-center">
          <h3 className="text-2xl">Try It For Free</h3>
        </div>
        <div className="w-full sm:w-[75%] ml-auto">
          <InfoBox>
            We know this sounds too good to be true, so we&apos;re offering a{" "}
            <strong>free two-week trial</strong>—no strings attached. Test our
            system for yourself and <strong>see the results firsthand</strong>{" "}
            before making any commitment.
          </InfoBox>
        </div>

        <div className="w-full text-center">
          <h3 className="text-2xl">No Gimmicks, Just Data</h3>
        </div>
        <div className="w-full sm:w-[75%] justify-left">
          <InfoBox>
            <p>
              We don&apos;t facilitate gambling, we don&apos;t take bets, and
              we&apos;re not selling some magic formula. What we do is provide{" "}
              <strong>real-time insights</strong> that help you make informed
              decisions. If you want to <strong>stop playing blind</strong> and
              start playing <strong>smarter</strong>, this is the{" "}
              <strong>edge you&apos;ve been looking for</strong>.
            </p>

            <p className="pt-4">
              <strong>Ready to take control of your luck?</strong> Try it for
              free and see for yourself.
            </p>
          </InfoBox>
        </div>

        <div className="w-full text-center">
          <div className="text-2xl p-4">
            <Link href="/trial">Trial</Link>
          </div>
          <div className="text-2xl p-4">
            <Link href="/betting-guide">Betting Guide</Link>
          </div>
          <div className="text-2xl p-4">
            <Link href="/pricing">Pricing</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
