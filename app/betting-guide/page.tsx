export default function BettingGuide() {
  return (
    <div>
      <h1 className="text-2xl font-bold p-6">Using the bot data for betting</h1>
      <div className="text-lg border-y border-green-900 py-4">
        You will see multiple data points to follow, here is a quick overview of
        what they are.
        <ul className="p-6 list-inside">
          <li>
            <strong>✅ Slot Name</strong> - The name of the slot you must play.
          </li>
          <li>
            <strong>✅ Volatility</strong> - Swings in RTP, you may see very
            high or very low.
          </li>
          <li>
            <strong>✅ Bet Amount</strong> - Reccomended bet amount for the slot
            with stop loss, you may raise on success.
          </li>
          <li>
            <strong>✅ Winning Expectation</strong> - The amount of money you
            expect to win.
          </li>
          <li>
            <strong>☢️ Stop Loss Limit</strong> - The amount of money you can
            lose before stopping the bet.
          </li>
          <li>
            <strong>✅ Stop Win Limit</strong> -Once you hit this call the alert
            a total success, you can stop or continue with Winning Stop Method.
          </li>
        </ul>
      </div>
      <h2 className="text-2xl font-bold p-5">Winning Stop Limits Method</h2>
      <p className="text-lg border-y border-green-900 py-4">
        Once you achieve profits expected on the broadcast, feel free to enjoy
        your winnings but follow this simple guide to retain them. If winning
        expectation is $650, and of course you clear this, ony allow a 20% loss
        from this peak. DO NOT include your initial investment in this
        calculation. as an example, you deposit $500 to have on hand to execute
        the broadcasts, you gain $1000 playing the slot, you can now lose only
        $200 of your balance of $1500. If you on the other hand win another
        $1000, you now have $2000 winnings, $500 seed, so you can push until you
        lose $400. DO NOT allow yourself to go beyond this winning stop loss or
        your just wasting your time and money.
      </p>
    </div>
  );
}
