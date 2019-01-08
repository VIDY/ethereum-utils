const http = require('http');

module.exports = exports = ({port, network, etherscanApiKey, nodeAddress, nodePort, maxBlockDifference, verbose}) => {
  const onHealthcheckRequest = (req, res) => {
    exports.ethNodeSynced({network, etherscanApiKey, nodeAddress, nodePort, maxBlockDifference, full: true})
      .then((synced) => {
        const status = synced.synced ? 200 : 500;
        const body = (synced.localBlockNum - synced.networkBlockNum).toString();
        exports.send(res, status, body, verbose);
      }).catch(e => {
        console.error(e);
        exports.send(res, 500, e, verbose);
      });
    }

  const server = http.createServer(onHealthcheckRequest)
  server.listen(port)
  return server
}

exports.send = (res, status, data, verbose) => {
  if (verbose) console.log(`eth-node-synced-server responding ${status}: '${data}'`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(status, { 'Content-Type': 'text/plain' });
  res.end(data);
}

exports.ethNodeSynced = require('./eth-node-synced')
