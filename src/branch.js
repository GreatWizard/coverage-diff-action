function isBranch() {
  return process.env.GITHUB_REF.startsWith("refs/heads/");
}

async function getMainBranch(octokit, owner, repo) {
  let response = await octokit.rest.repos.get({
    owner,
    repo,
  });
  return response.data.default_branch;
}

async function isMainBranch(octokit, owner, repo) {
  return (
    (await getMainBranch(octokit, owner, repo)) === process.env.GITHUB_REF_NAME
  );
}

module.exports = { isBranch, getMainBranch, isMainBranch };
