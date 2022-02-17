const { exec } = require("@actions/exec");

async function _remoteBranchExists(url, branch) {
  let stdout = "";
  let stderr = "";
  return await exec("git", ["ls-remote", "--heads", url, branch], {
    silent: true,
    ignoreReturnCode: true,
    listeners: {
      stdout: (data) => {
        stdout += data.toString();
      },
      stderr: (data) => {
        stderr += data.toString();
      },
    },
  })
    .then((returnCode) => {
      return {
        success: returnCode === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      };
    })
    .then((res) => {
      if (res.stderr != "" && !res.success) {
        throw new Error(res.stderr);
      }
      return res.stdout.trim().length > 0;
    });
}

async function storagePrepare(directory, options = {}) {
  if (options.branch && options.branch !== "") {
    if (await _remoteBranchExists(options.url, options.branch)) {
      return await exec("git", [
        "clone",
        "--quiet",
        "--depth",
        "1",
        "--single-branch",
        "--branch",
        options.branch,
        options.url,
        directory,
      ]);
    } else {
      await exec("git", [
        "clone",
        "--quiet",
        "--depth",
        "1",
        "--single-branch",
        options.url,
        directory,
      ]);
      return await exec("git", ["checkout", "--orphan", options.branch]);
    }
  }
  return await exec("git", [
    "clone",
    "--quiet",
    "--depth",
    "1",
    "--single-branch",
    options.url,
    directory,
  ]);
}

async function storageCommit(directory) {
  await exec("git", ["add", "."], { cwd: directory });
  await exec(
    "git",
    [
      "commit",
      "--author",
      "Coverage Diff Action <coverage-diff-action>",
      "--message",
      "Update coverage-diff-action assets",
    ],
    { cwd: directory }
  );
  return await exex.exec("git", ["push", "origin", "HEAD"], { cwd: directory });
}

module.exports = { storagePrepare, storageCommit };
