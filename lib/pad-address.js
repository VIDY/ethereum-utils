module.exports = (address) => {
    const pad = `0x0000000000000000000000000000000000000000`;
    const str = `${address}`;
    return `${pad.substring(0, pad.length - str.length)}${str}`;
}
