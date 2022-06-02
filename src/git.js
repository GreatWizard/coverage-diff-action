const simpleGit = require("simple-git");

async function gitClone(url, wikiPath) {
  try {
    return simpleGit().clone(url, wikiPath);
  } catch (e) {
    console.error(e);
  }
}

async function gitUpdate(wikiPath) {
  try {
    return simpleGit(wikiPath)
        .addConfig("user.name", "Coverage Diff Action")
        .addConfig("user.email", "coverage-diff-action")
        .add("*")
        .commit("Update coverage badge")
        .push();
  } catch (e) {
    console.error(e);
  }
}

module.exports = { gitClone, gitUpdate };
