import InfoBox from "./components/InfoBox";
import CasinoBonus from "./components/CasinoBonus";
export default function Home() {
  const casino = {
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
    information:
      "Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.    Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.Default casino information and terms... This default casino is for testing purposes only. It is not a real casino and does not offer real money gambling.",
  };
  return (
    <div className="flex">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div>
          <h1 className="text-sky-800 text-2xl">Welcome to AFC Media llc</h1>
        </div>
        <div>
          <InfoBox>This is the Info box!</InfoBox>
          <CasinoBonus />
          <CasinoBonus casino={casino} />
          <h2>Solid SEO based affiliate sites</h2>
          <p>
            AFC Media llc has been around since 2004 with the launch of
            allfrechips.com, and has since added a portfolio of sites including
            the likes of nodepositcasinoguide.com, freeslots247.org and many
            more. If you have been directed here you can begin the setup process
            to get your brands listed, we do not accept non affiliate offers
            including sponsored post paid advertising ext.
          </p>
        </div>
      </main>
    </div>
  );
}
