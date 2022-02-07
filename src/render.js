const ICONS = {
  OK: "✅",
  WARN: "⚠️",
  KO: "🔴",
};

const CRITERIAS = ["lines", "branches", "functions", "statements"];

function _renderPct(pct, addSign = true) {
  if (addSign && pct >= 0) {
    return `+${pct.toFixed(2)}%`;
  }
  return `${pct.toFixed(2)}%`;
}

function renderDiff(base, head, diff, options = {}) {
  let totalTitle = "Total coverage";
  if (diff.regression) {
    totalTitle = `${
      options.allowedToFail ? ICONS.WARN : ICONS.KO
    } Total coverage is lower than the default branch`;
  }

  let countRegression = 0;
  let summaryTitle = "click to open the diff coverage report";
  let table = [];

  Object.keys(diff.diff).forEach((file) => {
    if (file === "total") {
      return;
    }

    let element = diff.diff[file];

    if (CRITERIAS.every((criteria) => element[criteria].pct === 0)) {
      return;
    }

    let regression = CRITERIAS.some((criteria) => element[criteria].pct < 0);
    if (regression) {
      countRegression++;
    }

    table.push({
      icon: regression ? ICONS.KO : ICONS.OK,
      filename: file,
      lines: {
        pct: _renderPct(head[file].lines.pct, false),
        diff: _renderPct(element.lines.pct),
      },
      branches: {
        pct: _renderPct(head[file].branches.pct, false),
        diff: _renderPct(element.branches.pct),
      },
      functions: {
        pct: _renderPct(head[file].functions.pct, false),
        diff: _renderPct(element.functions.pct),
      },
      statements: {
        pct: _renderPct(head[file].statements.pct, false),
        diff: _renderPct(element.statements.pct),
      },
    });
  });

  if (table.length > 0 && countRegression > 0) {
    summaryTitle = `${countRegression} files with a coverage regression`;
  }

  let totals = {};
  CRITERIAS.forEach((criteria) => {
    totals[criteria] = `${_renderPct(
      head.total[criteria].pct,
      false
    )} (${_renderPct(head.total[criteria].pct - base.total[criteria].pct)})`;
  });

  return `
### ${totalTitle}

| Lines           | Branches           | Functions           | Statements           |
| --------------- | ------------------ | ------------------- | -------------------- |
| ${totals.lines} | ${totals.branches} | ${totals.functions} | ${
    totals.statements
  } | 
${
  table.length > 0
    ? `

#### Detailed report

<details><summary>${summaryTitle}</summary>

|   | File | Lines | Branches | Functions | Statements |
| - | ---- | ----- | -------- | --------- | ---------- |${table.map(
        (row) =>
          `\n| ${row.icon} | ${row.filename} | ${row.lines.pct}${
            row.lines.diff !== "+0.00%" ? ` (${row.lines.diff})` : ""
          } | ${row.branches.pct}${
            row.branches.diff !== "+0.00%" ? ` (${row.branches.diff})` : ""
          } | ${row.functions.pct}${
            row.functions.diff !== "+0.00%" ? ` (${row.functions.diff})` : ""
          } | ${row.statements.pct}${
            row.statements.diff !== "+0.00%" ? ` (${row.statements.diff})` : ""
          } |`
      )}
</details>`
    : ""
}
`;
}

module.exports = { renderDiff };
