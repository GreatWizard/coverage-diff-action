function getShieldURL(url) {
  return `https://img.shields.io/endpoint?url=${url}`;
}

function getJSONBadge(pct, thresholdGreen = 100, thresholdOrange = 70) {
  let color = "red";
  if (pct >= thresholdGreen) {
    color = "brightgreen";
  } else if (pct >= thresholdOrange) {
    color = "orange";
  }

  return {
    schemaVersion: 1,
    label: "Coverage",
    message: `${pct}%`,
    color,
  };
}

module.exports = { getShieldURL, getJSONBadge };
