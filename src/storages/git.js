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
    }
  }

  await exec("git", [
    "clone",
    "--quiet",
    "--depth",
    "1",
    "--single-branch",
    options.url,
    directory,
  ]);

  if (options.branch && options.branch !== "") {
    await exec("git", ["checkout", "--orphan", options.branch]);
  }
}

async function storageCommit(directory, files = [], options = {}) {
  await exec("git", [
    "config",
    "--global",
    "user.name",
    '"Coverage Diff Action"',
  ]);
  await exec("git", [
    "config",
    "--global",
    "user.email",
    '"coverage-diff-action"',
  ]);
  await exec("cat", [files.join(" ")], { cwd: directory });
  await exec("git", ["add", files.join(" ")], { cwd: directory });
  await exec(
    "git",
    ["commit", "--message", '"Update coverage-diff-action assets"'],
    { cwd: directory }
  );
  await exec("git", ["push", "-u", "origin", options.branch || "HEAD"], {
    cwd: directory,
  });
}

module.exports = { storagePrepare, storageCommit };
