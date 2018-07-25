const rp = require('request-promise')

module.exports = exports = async ({nodeAddress, nodePort}) => {
  return !!(await exports.getLocalSyncingResponse({address: nodeAddress, port: nodePort}))
}

exports.getLocalSyncingResponse = async ({address, port}) => {
  const nodeLocation = `http://${address || "localhost"}:${port || 8545}`
  const response = await rp({
    method: 'POST',
    uri: nodeLocation,
    body: {
      method: "eth_syncing",
      params: [],
      id: 1,
      jsonrpc: "2.0"
    },
    json: true
  })

  if (response.result === "false") {
    return false
  }
  return response.result
}

exports.syncProgressMade = ({result, lastUniqueResult}) => {
  if (!result) {
    return false
  }

  if (result && !lastUniqueResult) {
    return true
  }

  const blockProgress = (parseInt(result.currentBlock) - parseInt(lastUniqueResult.currentBlock)) > 0;
  const stateProgress = (result.pulledStates && lastUniqueResult.pulledStates
      && (parseInt(result.pulledStates) - parseInt(lastUniqueResult.pulledStates)) > 0);
  const progress = blockProgress || stateProgress;
  return progress
}
