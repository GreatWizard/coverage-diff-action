const {
  readFile,
  writeFile,
  copyFile,
  mkdir,
  mkdtemp,
} = require("fs/promises");
const { existsSync } = require("fs");
const path = require("path");
const core = require("@actions/core");
const github = require("@actions/github");

const { isBranch, getMainBranch, isMainBranch } = require("./branch");
const { getShieldURL, getJSONBadge } = require("./badge");
const { average } = require("./math");
const { computeDiff } = require("./diff");
const { addComment, deleteExistingComments } = require("./comment");

const { context } = github;

async function run() {
  await mkdir(path.join(process.env.GITHUB_WORKSPACE, "tmp"), {
    recursive: true,
  });
  const storagePath = await mkdtemp(
    path.join(process.env.GITHUB_WORKSPACE, "tmp", "coverage-diff-")
  );

  const githubToken = core.getInput("github-token");
  const baseSummaryFilename = core.getInput("base-summary-filename");
  const coverageFilename = core.getInput("coverage-filename");
  const badgeThresholdOrange = core.getInput("badge-threshold-orange");
  const storage = core.getInput("storage");

  let storageModule = undefined;
  if (storage === "wiki" || storage === "github" || storage === "git") {
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

  const storageOption = {};
  if (storage === "wiki") {
    storageOption.url = `https://x-access-token:${githubToken}@github.com/${process.env.GITHUB_REPOSITORY}.wiki.git`;
  } else if (storage === "github") {
    storageOption.url = `https://x-access-token:${githubToken}@github.com/${process.env.GITHUB_REPOSITORY}.git`;
    storageOption.branch = core.getInput("git-branch");
  } else if (storage === "git") {
    storageOption.url = core.getInput("git-url");
    if (!storageOption.url) {
      throw new Error("git-url is required");
    }
    storageOption.branch = core.getInput("git-branch");
  }

  core.info(`Cloning repository...`);
  await storagePrepare(storagePath, storageOption);

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
    const files = [];

    core.info("Saving base json-summary report");
    await copyFile(
      coverageFilename,
      path.join(storagePath, baseSummaryFilename)
    );
    files.push(baseSummaryFilename);

    if (BadgeEnabled) {
      core.info("Saving badge");

      const badgeThresholdGreen = core.getInput("badge-threshold-green");

      await writeFile(
        path.join(storagePath, badgeFilename),
        JSON.stringify(
          getJSONBadge(pct, badgeThresholdGreen, badgeThresholdOrange)
        )
      );
      files.push(badgeFilename);
    }

    await storageCommit(storagePath, files, storageOption);

    if (BadgeEnabled) {
      const url =
        storage === "wiki"
          ? `https://raw.githubusercontent.com/wiki/${process.env.GITHUB_REPOSITORY}/${badgeFilename}`
          : storage === "github"
          ? `https://raw.githubusercontent.com/${
              process.env.GITHUB_REPOSITORY
            }/${
              storageOption.branch ||
              getMainBranch(octokit, context.repo.owner, context.repo.repo)
            }/${badgeFilename}`
          : undefined;
      if (url) {
        core.info(`Badge JSON stored at ${url}`);
        core.info(`Badge URL: ${getShieldURL(url)}`);
      }
    }
  } else {
    core.info("Running on pull request branch");
    if (!existsSync(path.join(storagePath, baseSummaryFilename))) {
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
