import Image from "next/image";
import Link from "next/link";
import InfoBox from "./InfoBox";
import CasinoInfo from "./CasinoInfo";
import { Suspense } from "react";

interface CasinoBonusProps {
  casino?: {
    name: string;
    logo: string;
    bonusAmount: number;
    currency: string;
    bonusType: string;
    bonusCode?: string;
    secondaryBonusCode?: string;
    reviewUrl: string;
    playUrl: string;
    depositAmount?: number;
    bonusPercent?: number;
    rating?: number;
    information?: string;
  };
}

const defaultCasino = {
  name: "Casino Name",
  logo: "https://www.allfreechips.com/image/casinoiconscut/europa777.png",
  bonusAmount: 25,
  currency: "$",
  bonusType: "No Deposit Bonus",
  reviewUrl: "#",
  playUrl: "#",
  depositAmount: 100,
  bonusPercent: 200,
  rating: 5,
  information: "",
  bonusCode: "NDCG25",
  secondaryBonusCode: "NDCG200",
};

export default function CasinoBonus({
  casino = defaultCasino,
}: CasinoBonusProps) {
  const formatBonus = (amount: number, currency: string) => {
    return (
      <span className="inline-flex items-start">
        <span className="text-lg leading-none relative top-0">{currency}</span>
        <span className="text-3xl font-bold leading-none">
          {amount.toLocaleString()}
        </span>
      </span>
    );
  };

  return (
    <InfoBox className="mb-4">
      <div className="flex flex-col space-y-4">
        {/* Row 1: Logo, Casino Name/Rating, and Bonus Info */}
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 w-full">
          {/* Logo */}
          <div className="relative w-[100px] h-[80px] flex-shrink-0 mx-auto sm:mx-0">
            <Image
              src={casino.logo}
              alt={`${casino.name} logo`}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100px, 80px"
            />
          </div>

          <div className="flex-1 flex flex-col space-y-2 w-full">
            {/* Casino Name and Rating */}
            <div className="flex justify-between items-center w-full px-0">
              <div className="text-lg font-bold text-blue-600">
                {casino.name}
              </div>
              <div className="text-sm text-gray-600">
                Rating: {"⭐".repeat(casino.rating || 5)}
              </div>
            </div>

            {/* Bonus Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="text-center flex items-center justify-center gap-4 w-full">
                <div className="flex-1">
                  <div className="text-blue-600">
                    {formatBonus(casino.bonusAmount, casino.currency)}
                  </div>
                  <p className="text-sm text-gray-600">{casino.bonusType}</p>
                </div>
                {casino.bonusAmount > 0 && casino.bonusCode && (
                  <div className="border-l border-gray-200 pl-4 flex-1">
                    <div className="text-blue-600 font-mono text-lg">
                      {casino.bonusCode}
                    </div>
                    <p className="text-sm text-gray-600">Bonus Code</p>
                  </div>
                )}
              </div>
              <div className="text-center flex items-center justify-center gap-4 w-full">
                <div className="flex-1">
                  <div className="text-blue-600">
                    {formatBonus(casino.depositAmount || 0, casino.currency)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {casino.bonusPercent}% Deposit Bonus
                  </p>
                </div>
                {casino.depositAmount &&
                  casino.depositAmount > 0 &&
                  casino.secondaryBonusCode && (
                    <div className="border-l border-gray-200 pl-4 flex-1">
                      <div className="text-blue-600 font-mono text-lg">
                        {casino.secondaryBonusCode}
                      </div>
                      <p className="text-sm text-gray-600">Bonus Code</p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] gap-2 items-start relative">
          <div className="h-10 contents">
            {casino.information && (
              <Suspense
                fallback={<div className="h-10 w-24 hidden sm:block" />}
              >
                <CasinoInfo information={casino.information} />
              </Suspense>
            )}
            {casino.information === "" && (
              <div className="h-10 w-24 hidden sm:block" />
            )}
          </div>

          <Link
            href={casino.reviewUrl}
            className="text-center emerald-button col-span-1 sm:col-span-1"
          >
            {casino.name} Review
          </Link>

          <Link
            href={casino.playUrl}
            className="text-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors col-span-1 sm:col-span-1"
          >
            Play Now
          </Link>
        </div>
      </div>
    </InfoBox>
  );
}
