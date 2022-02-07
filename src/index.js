const { readFile, writeFile, copyFile } = require("fs/promises");
const { existsSync } = require("fs");
const path = require("path");
const core = require("@actions/core");
const github = require("@actions/github");
const coverageDiff = require("coverage-diff");

const { gitClone, gitUpdate } = require("./git");
const { isBranch, isMainBranch } = require("./branch");
const { getShieldURL, getJSONBadge } = require("./badge");
const { average } = require("./math");
const { renderDiff } = require("./render");

const { context } = github;

const MARKER = "<!-- This comment was produced by coverage-diff-action -->";

const WIKI_PATH = path.join(process.env.GITHUB_WORKSPACE, "wiki");

async function run() {
  const { repo, owner } = context.repo;
  const githubToken = core.getInput("github-token");
  const baseSummaryFilename = core.getInput("base-summary-filename");
  const coverageFilename = core.getInput("coverage-filename");
  const badgeThresholdOrange = core.getInput("badge-threshold-orange");

  core.info(`Cloning wiki repository...`);

  await gitClone(
    `https://x-access-token:${githubToken}@github.com/${process.env.GITHUB_REPOSITORY}.wiki.git`,
    WIKI_PATH
  );

  const octokit = github.getOctokit(githubToken);

  const head = JSON.parse(await readFile(coverageFilename, "utf8"));

  const pct = average(
    Object.keys(head.total).map((t) => head.total[t].pct),
    0
  );

  if (isBranch() && (await isMainBranch(octokit, owner, repo))) {
    core.info("Running on default branch");
    const BadgeEnabled = core.getBooleanInput("badge-enabled");
    const badgeFilename = core.getInput("badge-filename");

    core.info("Saving summary-json report into the repo wiki");
    await copyFile(coverageFilename, path.join(WIKI_PATH, baseSummaryFilename));

    if (BadgeEnabled) {
      core.info("Saving Badge into the repo wiki");

      const badgeThresholdGreen = core.getInput("badge-threshold-green");

      await writeFile(
        path.join(WIKI_PATH, badgeFilename),
        JSON.stringify(
          getJSONBadge(pct, badgeThresholdGreen, badgeThresholdOrange)
        )
      );
    }

    await gitUpdate(WIKI_PATH);

    if (BadgeEnabled) {
      const url = `https://raw.githubusercontent.com/wiki/${process.env.GITHUB_REPOSITORY}/${badgeFilename}`;
      core.info(`Badge JSON stored at ${url}`);
      core.info(`Badge URL: ${getShieldURL(url)}`);
    }
  } else {
    core.info("Running on pull request branch");
    if (!existsSync(path.join(WIKI_PATH, baseSummaryFilename))) {
      core.info("No base summary-json found");
      return;
    }

    const issue_number = context?.payload?.pull_request?.issue_number;
    const allowedToFail = core.getBooleanInput("allowed-to-fail");
    const base = JSON.parse(
      await readFile(path.join(WIKI_PATH, baseSummaryFilename), "utf8")
    );

    const diff = coverageDiff.diff(base, head);

    if (issue_number) {
      let comments = await octokit.rest.issues.listComments({
        issue_number,
      });
      github;

      for (const comment of comments.data) {
        if (comment.body.includes(MARKER)) {
          await octokit.rest.issues.deleteComment({
            ...context.repo,
            comment_id: comment.id,
          });
        }
      }

      core.info("Add a comment with the diff coverage report");
      await octokit.rest.issues.createComment({
        ...context.repo,
        issue_number,
        body: `${renderDiff(base, head, diff, { allowedToFail })}
${MARKER}`,
      });
    } else {
      core.info(diff.results);
    }

    if (!allowedToFail && diff.regression) {
      throw new Error("The coverage is below the minimum threshold");
    }
  }
}

try {
  run();
} catch (error) {
  core.setFailed(error.message);
}
