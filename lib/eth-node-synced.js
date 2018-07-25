const https = require('https');
const { exec } = require('child_process');
const rp = require('request-promise')

module.exports = exports = async ({network, etherscanApiKey, nodeAddress, nodePort, maxBlockDifference, full}) => {
  const values = await Promise.all([
    exports.getLocalBlockNum({address: nodeAddress, port: nodePort}),
    exports.getNetworkBlockNum({network, etherscanApiKey})
  ])

  const [ localBlockNum, networkBlockNum ] = values

  const synced = (networkBlockNum - localBlockNum) <= ( maxBlockDifference || 3)
  return !full ? synced : { synced, localBlockNum, networkBlockNum }
}

exports.getLocalBlockNum = async ({address, port}) => {
  const nodeLocation = `http://${address || "localhost"}:${port || 8545}`
  const response = await rp({
    method: 'POST',
    uri: nodeLocation,
    body: {
      method: "eth_blockNumber",
      params: [],
      id: 1,
      jsonrpc: "2.0"
    },
    json: true
  })

  return parseInt(response.result)
}

exports.getNetworkBlockNum = async ({network, etherscanApiKey}) => {
  const etherscanPrefix = (network && network !== 'main' && network !== 'mainnet')
    ? network.toLowerCase() : 'api'
  const uri = `https://${etherscanPrefix}.etherscan.io/api`
  const response = await rp({
    uri,
    qs: {
      module: 'proxy',
      action: 'eth_blockNumber',
      apikey: etherscanApiKey
    },
    json: true
  })

  return parseInt(response.result)
}
