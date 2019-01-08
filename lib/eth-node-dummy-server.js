const http = require('http');

module.exports = exports = ({port, status, data, verbose}) => {
  const onRequest = (req, res) => {
    exports.send(res, status, data, verbose);
  }

  const server = http.createServer(onRequest)
  server.listen(port)
  return server
}

exports.send = (res, status, data, verbose) => {
  if (verbose) console.log(`eth-node-dummy-server responding ${status}: '${data}'`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(status, { 'Content-Type': 'text/plain' });
  res.end(data);
}
