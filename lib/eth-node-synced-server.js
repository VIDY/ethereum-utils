const http = require('http');

module.exports = exports = ({port, network, etherscanApiKey, nodeAddress, nodePort, maxBlockDifference}) => {
  const onHealthcheckRequest = (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    exports.ethNodeSynced({network, etherscanApiKey, nodeAddress, nodePort, maxBlockDifference, full: true})
      .then((synced) => {
        res.writeHead(synced.synced ? 200: 500, { 'Content-Type': 'text/plain' });
        res.end((synced.localBlockNum - synced.networkBlockNum).toString());
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
