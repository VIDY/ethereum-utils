module.exports = async (promise, message) => {
  const asMessage = (text) => {
    if (message) {
      return `${message}\n${text}`;
    }
    return text;
  }
  try {
    await promise;
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0;
    assert(revertFound, asMessage(`Expected "revert", got ${error} instead`));
    return;
  }
  assert.fail(asMessage('Expected revert not received'));
}
