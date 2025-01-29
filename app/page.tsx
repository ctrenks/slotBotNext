import InfoBox from "./components/InfoBox";

export default function Home() {
  return (
    <div className="flex">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="w-full text-center">
          <h1 className="text-2xl">Theory</h1>
        </div>
        <div className="w-full sm:w-[75%] justify-left">
          <InfoBox>
            Take your first steps into understanding online slots and of course
            how to beat them. The return to player percentage is the key to
            understanding what happens when you engage with online slots. If the
            RTP is set at 97%, a pretty basic value for slot machines if that
            was consistant on each spin for every $100 spent you would have $97
            left. Obviously this is not real world as then you could never win
            right? This fluxuation is what permits you to win large hits,
            jackpots ext, and also is the reason why you can play for 3 minutes
            and lose your investnment.
          </InfoBox>
        </div>
        <div className="w-full text-center">
          <h2 className="text-2xl">Method</h2>
        </div>
        <div className="w-full sm:w-[75%] ml-auto">
          <InfoBox>
            We monitor hundreds on online slots and process trends, locating
            ones with large swings that sustain high RTP for longer periods.
            this is the simplified explination of what we are able to do using
            multiple methods we of course keep secret.
          </InfoBox>
        </div>
        <div className="w-full text-center">
          <h3 className="text-2xl">Action</h3>
        </div>
        <div className="w-full sm:w-[75%] justify-left">
          <InfoBox>
            once we determine the best slots for these swings from 15% to 500%+
            Return to player we then monitor them, and yes this has proven to be
            consistent. Once we have a "Hot Slot" we initiate out alert to out
            members.
          </InfoBox>
        </div>
        <div className="w-full text-center">
          <h3 className="text-2xl">Results</h3>
        </div>
        <div className="w-full sm:w-[75%] justify-right">
          <InfoBox>
            Results are great, of course nothing is 100% but using our basic
            methods you can gain an actual advantage on these bandits. Be sure
            to read out beating online slots methods to not only get ahead but
            make sure you keep ahead. You can contact us for a free 2 week trial
            and see for yourself.
          </InfoBox>
        </div>
      </main>
    </div>
  );
}
