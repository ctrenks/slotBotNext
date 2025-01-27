import Image from "next/image";

import InfoBox from "./InfoBox";
import CasinoInfo from "./CasinoInfo";
import { Suspense } from "react";
import { ProcessedCasino } from "@/app/lib/FilterCasino";

interface CasinoBonusProps {
  casino: ProcessedCasino;
}

export default function CasinoBonus({ casino }: CasinoBonusProps) {
  const formatBonus = (
    amount: number | undefined,
    currency: string | undefined
  ) => {
    if (!amount) return null;
    return (
      <span className="inline-flex items-start">
        <span className="text-lg leading-none relative top-0">{currency}</span>
        <span className="text-3xl font-bold leading-none">
          {amount.toLocaleString()}
        </span>
      </span>
    );
  };
  const formatBonusText = (text: string | undefined) => {
    if (!text) return null;
    return (
      <span className="inline-flex items-start">
        <span className="text-lg leading-none relative top-0"></span>
        <span className="text-3xl font-bold leading-none">{text}</span>
      </span>
    );
  };

  // Format the what bonuses to show

  const ndBonus = {
    bonusCurrency: casino.ndCurrency,
    bonusAmount: casino.ndAmount,
    bonus: formatBonus(casino.ndAmount || 0, casino.ndCurrency),
    bonusType: casino.ndBonusType,
    bonusCode: casino.ndBonusCode ?? "No Code Required",
    bonusCodeText: "No Deposit Code",
  };

  const depositBonus = {
    bonusCurrency: casino.currency,
    bonusAmount: casino.depositAmount,
    bonus: formatBonus(casino.depositAmount, casino.currency),
    bonusType: "Deposit Bonus",
    bonusCode: casino.depositBonusCode ?? "No Code Required",
    bonusCodeText: "Bonus Code",
    bonusPercent: casino.bonusPercent,
  };
  const fillerBonus = {
    bonus: formatBonusText("Playthrough"),
    bonusType: casino.playthrough + "x" + casino.wagerVal,
    bonusCode: "Reliable Casino",
    bonusCodeText: "Be sure to have funds ready",
    bonusPercent: "",
  };

  let bonus;
  let bonus2;
  if (ndBonus.bonusAmount && ndBonus.bonusAmount > 0) {
    bonus = ndBonus;
    bonus2 = depositBonus;
  } else {
    bonus = depositBonus;
    bonus2 = fillerBonus;
  }

  return (
    <InfoBox className="mb-4 w-full">
      <div className="flex flex-col space-y-4">
        {/* Row 1: Logo, Casino Name/Rating, and Bonus Info */}
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 w-full">
          {/* Logo */}
          <div className="relative w-[100px] h-[80px] flex-shrink-0 mx-auto sm:mx-0">
            <Image
              src={`/image/casino/${casino.button}`}
              alt={`${casino.casino} logo`}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100px, 80px"
            />
          </div>

          <div className="flex-1 flex flex-col space-y-2 w-full">
            {/* Casino Name and Rating */}
            <div className="flex justify-between items-center w-full px-0">
              <div className="text-lg font-bold text-emerald-700">
                {casino.casino}
              </div>
              <div className="text-sm text-gray-600">
                Rating: {"⭐".repeat(casino.rating || 5)}
              </div>
            </div>

            {/* Bonus Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="text-center flex items-center justify-center gap-4 w-full">
                <div className="flex-1">
                  <div className="text-emerald-700">{bonus.bonus}</div>
                  <p className="text-sm text-gray-600">{bonus.bonusType}</p>
                </div>
                {bonus.bonusAmount && bonus.bonusCode && (
                  <div className="border-l border-gray-200 pl-4 flex-1">
                    <div className="text-emerald-700 font-mono text-lg">
                      {bonus.bonusCode}
                    </div>
                    <p className="text-sm text-gray-600">
                      {bonus.bonusCodeText}
                    </p>
                  </div>
                )}
              </div>
              <div className="text-center flex items-center justify-center gap-4 w-full">
                <div className="flex-1">
                  <div className="text-emerald-700">{bonus2.bonus}</div>
                  <p className="text-sm text-gray-600">{bonus2.bonusType}</p>
                </div>
                {bonus2.bonus && bonus2.bonus && bonus2.bonusCode && (
                  <div className="border-l border-gray-200 pl-4 flex-1">
                    <div className="text-emerald-700 font-mono text-lg">
                      {bonus2.bonusCode}
                    </div>
                    <p className="text-sm text-gray-600">
                      {bonus2.bonusCodeText}
                    </p>
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

          {/* <Link
            href={`/review/${casino.clean_name}`}
            className="text-center emerald-button col-span-1 sm:col-span-1"
          >
            {casino.casino} Review
          </Link> */}

          <a
            href={`/play/${casino.clean_name}`}
            target="_blank"
            className="text-center px-4 py-2 bg-gradient-to-r from-[#f9d90a] to-[#dc7d11] text-white rounded-md border border-[#dc7d11] hover:from-[#dc7d11] hover:to-[#f9d90a] hover:translate-y-[-1px] active:translate-y-[1px] transition-all duration-200 shadow-md hover:shadow-lg col-span-1 sm:col-span-1"
          >
            Play Now
          </a>
        </div>
      </div>
    </InfoBox>
  );
}
