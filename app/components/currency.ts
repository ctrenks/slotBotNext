const Currency = (string: string) => {
  const arr = string.split(",");
  const limit = 3;
  let cur = "";
  arr.slice(0, limit).forEach(function (i) {
    let t = "";
    if (i == "1") {
      t = "$";
    } else if (i == "2") {
      t = "€";
    } else if (i == "3") {
      t = "£";
    } else if (i == "4") {
      t = "₿"; // BTC
    } else if (i == "5") {
      t = "R"; // Rand
    } else if (i == "6") {
      t = "FUN";
    } else if (i == "7") {
      t = "m₿"; // mBTC
    } else if (i == "8") {
      t = "ETH";
    }
    cur = cur + "/" + t;
  });
  const str = cur.substring(1);
  return str;
};

export default Currency;
