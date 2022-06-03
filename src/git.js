const simpleGit = require("simple-git");

async function gitClone(url, wikiPath) {
    return simpleGit().clone(url, wikiPath);
}

async function gitUpdate(wikiPath) {
    return simpleGit(wikiPath)
        .status(['-v', '-v'])
        .addConfig("user.name", "Coverage Diff Action")
        .addConfig("user.email", "coverage-diff-action")
        .add("*")
        .status(['-v', '-v'])
        .commit("Update coverage badge")
        .push();
}

module.exports = {gitClone, gitUpdate};
