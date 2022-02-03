function average(arr, fixed = 2) {
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(fixed);
}

module.exports = { average };
