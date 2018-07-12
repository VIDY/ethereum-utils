const increaseTime = require('./increase-time')

module.exports = (target) => {
  let now = web3.eth.getBlock('latest').timestamp;
  if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
  let diff = target - now;
  return increaseTime(diff);
}
