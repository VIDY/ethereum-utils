const http = require('http');

module.exports = exports = ({port, network, etherscanApiKey, nodeAddress, nodePort, maxBlockDifference, maxSyncFreeze}) => {
  var lastUniqueResult;
  var lastUniqueResultTime = -1;

  const onHealthcheckRequest = (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

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
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end((result).toString());
        } else if (result) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end((result).toString());
        } else {
          exports.ethNodeSynced({network, etherscanApiKey, nodeAddress, nodePort, maxBlockDifference, full: true})
            .then((synced) => {
              res.writeHead(synced.synced ? 200 : 500, { 'Content-Type': 'text/plain' });
              res.end((synced.localBlockNum - synced.networkBlockNum).toString());
            }).catch(e => {
              console.error(e);
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end(e);
            });
        }
      }).catch(e => {
        console.error(e);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(e);
      });
    }

  const server = http.createServer(onHealthcheckRequest)
  server.listen(port)
  return server
}

exports.ethNodeSynced = require('./eth-node-synced')
exports.getLocalSyncingResponse = require('./eth-node-syncing').getLocalSyncingResponse
exports.syncProgressMade = require('./eth-node-syncing').syncProgressMade
