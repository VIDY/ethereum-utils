var _ = require("lodash");
var Promise = require("bluebird");

module.exports = async (contract, name) => {
    return new Promise((resolve, reject) => {
        var event = contract[name]();
        event.watch();
        event.get((error, logs) => {
          if (error) {
            reject(error);
          }
          if (!logs || _.isEmpty(logs)) {
            throw Error("Failed to find filtered event for " + name);
          }
          resolve(logs[0]);
        });
        event.stopWatching();
    });
}
