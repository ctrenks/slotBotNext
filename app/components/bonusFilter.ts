import { CasinosWithLocation, ProcessedCasino } from "@/app/lib/FilterCasino";
import Currency from "./currency";

export type BonusFilterResponse = ProcessedCasino;

const BonusFilter = (bdata: CasinosWithLocation[]): ProcessedCasino[] => {
  return bdata.map((item) => {
    const bonuses = item.bonuses;
    const firstBonus = bonuses.find((bonus) => (bonus.deposit ?? 0) > 0);
    const ndBonus = bonuses.find(
      (bonus) =>
        (bonus.nodeposit ?? 0) > 0 ||
        ((bonus.freespins ?? 0) > 0 && (!bonus.deposit || bonus.deposit === 0))
    );

    let casinoName = item.casino + " Casino";
    casinoName = casinoName.replace(/ Casino Casino/, " Casino");

    // Determine bonus type based on ndBonus
    const ndBonusType = ndBonus
      ? ndBonus.freespins && ndBonus.freespins > 0
        ? "Free Spins"
        : "No Deposit Bonus"
      : undefined;
    const ndCurrency =
      ndBonusType === "Free Spins"
        ? ""
        : Currency(ndBonus?.multi_currency ?? "1");

    const wagerVal = firstBonus?.playthrough === 1 ? "Dep+Bonus" : "Deposit";
    return {
      id: item.id,
      casino: casinoName,
      clean_name: item.clean_name ?? "",
      button: item.button ?? "",
      currency: Currency(firstBonus?.multi_currency ?? "1"),
      ndCurrency,
      bonusAmount: firstBonus?.depositBonus,
      ndBonusType,
      ndAmount: ndBonus?.nodeposit ?? undefined,
      ndBonusCode: ndBonus?.code ? ndBonus.code.trim() : undefined,
      depositBonusCode: firstBonus?.code ? firstBonus.code.trim() : undefined,
      reviewUrl: item.reviewUrl,
      playUrl: item.playUrl,
      playthrough: firstBonus?.playthrough ?? undefined,
      wagerVal,
      depositAmount: firstBonus?.deposit ?? undefined,
      bonusPercent: Number(firstBonus?.percent ?? "0"),
      rating: item.rating,
      information: item.information,
    };
  });
};

export default BonusFilter;
