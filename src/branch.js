function isBranch() {
  return process.env.GITHUB_REF.startsWith("refs/heads/");
}

async function isDefaultBranch(octokit, owner, repo) {
  let response = await octokit.rest.repos.get({
    owner,
    repo,
  });
  return response.data.default_branch === process.env.GITHUB_REF_NAME;
}

module.exports = { isBranch, isDefaultBranch };
