const http = require('http');

module.exports = exports = ({port, network, etherscanApiKey, nodeAddress, nodePort, maxBlockDifference, maxSyncFreeze, cacheSeconds, verbose}) => {
  var lastUniqueResult;
  var lastUniqueResultTime = -1;

  const onHealthcheckRequest = (req, res) => {
    exports.getLocalSyncingResponse({address: nodeAddress, port: nodePort})
      .then((result) => {
        const resultTime = (new Date()).getTime() / 1000;
        const syncProgress = exports.syncProgressMade({result, lastUniqueResult})
        const frozenFor = syncProgress ? 0 : resultTime - lastUniqueResultTime

        if (syncProgress) {
          lastUniqueResult = result
          lastUniqueResultTime = resultTime
        }

        if (result && (syncProgress || frozenFor <= (maxSyncFreeze || 150))) {
          exports.send(res, 200, (typeof result === 'object' ? JSON.stringify(result, null, 2) : result).toString(), verbose);
        } else if (result) {
          exports.send(res, 500, (typeof result === 'object' ? JSON.stringify(result, null, 2) : result).toString(), verbose);
        } else {
          exports.ethNodeSynced({network, etherscanApiKey, nodeAddress, nodePort, maxBlockDifference, cacheSeconds, full: true})
            .then((synced) => {
              const status = synced.synced ? 200 : 500;
              const body = (synced.localBlockNum - synced.networkBlockNum).toString();
              exports.send(res, status, body, verbose);
            }).catch(e => {
              console.error(e);
              exports.send(res, 500, e, verbose);
            });
        }
      }).catch(e => {
        console.error(e);
        exports.sendD(res, 500, e, verbose);
      });
    }

  const server = http.createServer(onHealthcheckRequest)
  server.listen(port)
  return server
}

exports.send = (res, status, data, verbose) => {
  if (verbose) console.log(`eth-node-syncing-server responding ${status}: '${data}'`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(status, { 'Content-Type': 'text/plain' });
  res.end(data);
}

exports.ethNodeSynced = require('./eth-node-synced')
exports.getLocalSyncingResponse = require('./eth-node-syncing').getLocalSyncingResponse
exports.syncProgressMade = require('./eth-node-syncing').syncProgressMade
