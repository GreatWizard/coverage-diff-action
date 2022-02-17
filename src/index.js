const { readFile, writeFile, copyFile } = require("fs/promises");
const { existsSync } = require("fs");
const path = require("path");
const core = require("@actions/core");
const github = require("@actions/github");

const { isBranch, isMainBranch } = require("./branch");
const { getShieldURL, getJSONBadge } = require("./badge");
const { average } = require("./math");
const { computeDiff } = require("./diff");
const { addComment, deleteExistingComments } = require("./comment");

const { context } = github;

const STORAGE_PATH = path.join(process.env.GITHUB_WORKSPACE, "__STORAGE__");

async function run() {
  const githubToken = core.getInput("github-token");
  const baseSummaryFilename = core.getInput("base-summary-filename");
  const coverageFilename = core.getInput("coverage-filename");
  const badgeThresholdOrange = core.getInput("badge-threshold-orange");
  const storage = core.getInput("storage");

  let storageModule = undefined;
  if (storage === "wiki" || storage === "git") {
    storageModule = "git";
  }
  if (!storageModule) {
    core.info(`Unknown storage: ${storage}`);
    return;
  }
  const {
    storagePrepare,
    storageCommit,
  } = require(`./storages/${storageModule}`);

  const storageOption = { githubToken };
  if (storage === "wiki") {
    storageOption.url = `github.com/${process.env.GITHUB_REPOSITORY}.wiki.git`;
  } else if (storage === "git") {
    storageOption.url =
      core.getInput("git-url") ||
      `github.com/${process.env.GITHUB_REPOSITORY}.git`;
    storageOption.branch = core.getInput("git-branch");
  }

  core.info(`Cloning wiki repository...`);
  await storagePrepare(STORAGE_PATH, storageOption);

  const octokit = github.getOctokit(githubToken);

  const head = JSON.parse(await readFile(coverageFilename, "utf8"));

  const pct = average(
    Object.keys(head.total).map((t) => head.total[t].pct),
    0
  );

  if (
    isBranch() &&
    (await isMainBranch(octokit, context.repo.owner, context.repo.repo))
  ) {
    core.info("Running on default branch");
    const BadgeEnabled = core.getBooleanInput("badge-enabled");
    const badgeFilename = core.getInput("badge-filename");

    core.info("Saving json-summary report into the repo wiki");
    await copyFile(
      coverageFilename,
      path.join(STORAGE_PATH, baseSummaryFilename)
    );

    if (BadgeEnabled) {
      core.info("Saving Badge into the repo wiki");

      const badgeThresholdGreen = core.getInput("badge-threshold-green");

      await writeFile(
        path.join(STORAGE_PATH, badgeFilename),
        JSON.stringify(
          getJSONBadge(pct, badgeThresholdGreen, badgeThresholdOrange)
        )
      );
    }

    await storageCommit(STORAGE_PATH);

    if (BadgeEnabled) {
      const url = `https://raw.githubusercontent.com/wiki/${process.env.GITHUB_REPOSITORY}/${badgeFilename}`;
      core.info(`Badge JSON stored at ${url}`);
      core.info(`Badge URL: ${getShieldURL(url)}`);
    }
  } else {
    core.info("Running on pull request branch");
    if (!existsSync(path.join(STORAGE_PATH, baseSummaryFilename))) {
      core.info("No base json-summary found");
      return;
    }

    const issue_number = context?.payload?.pull_request?.number;
    const allowedToFail = core.getBooleanInput("allowed-to-fail");
    const base = JSON.parse(
      await readFile(path.join(STORAGE_PATH, baseSummaryFilename), "utf8")
    );

    const diff = computeDiff(base, head, { allowedToFail });

    if (issue_number) {
      await deleteExistingComments(octokit, context.repo, issue_number);

      core.info("Add a comment with the diff coverage report");
      await addComment(octokit, context.repo, issue_number, diff.markdown);
    } else {
      core.info(diff.results);
    }

    if (!allowedToFail && diff.regression) {
      throw new Error("Total coverage is lower than the default branch");
    }
  }
}

try {
  run();
} catch (error) {
  core.setFailed(error.message);
}
