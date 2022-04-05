# GitHub Action: Coverage Diff

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Liberapay](https://img.shields.io/liberapay/patrons/GreatWizard.svg?logo=liberapay)](https://liberapay.com/GreatWizard/)

## Presentation

Publish diff coverage report as PR comment, and create a coverage badge to display on the readme.

![Comment screenshot](https://raw.githubusercontent.com/GreatWizard/coverage-diff-action/master/comment.png)

This action operates on a json-summary report file as generated by most coverage tools.

It has two main modes of operation:

### PR mode

If acting on a PR, it will analyze the json-summary report file (`coverage/coverage-summary.json`), and produce a diff coverage report with the json-summary file from repository's default branch.
Then it will publish the diff coverage report as comment to the PR.
If a comment had already previously be written, it will be updated.
The comment contains information on the evolution of coverage rate attributed to this PR, as well as the rate of coverage for lines that this PR introduces.

### Default branch mode

If acting on the repository's default branch (by convention `master` or `main`), it will extract the global threshold and create a small Badge JSON file.
The json-summary report file and the Badge JSON file will be stored on the repository's wiki.
This file will then have a stable URL, which means you can create a [shields.io](https://shields.io/endpoint) badge from it.

## Usage

### Setup

Please ensure that the **repository wiki has been initialized** with at least a single page created.
Once it's done, you can disable the wiki for the repository.

### Minimal usage

```yaml
name: Coverage Diff

on:
  push:
    branches:
      - master
      - main
  pull_request: {}

jobs:
  test:
    name: Coverage Diff
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 16
          cache: npm
      - run: npm install
      - run: npm run test
      - name: Coverage Diff
        uses: greatwizard/coverage-diff-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Maximal usage

```yaml
name: Coverage Diff

on:
  push:
    branches:
      - master
      - main
  pull_request: {}

jobs:
  test:
    name: Coverage Diff
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 16
          cache: npm
      - run: npm install
      - run: npm run test
      - name: Coverage Diff
        uses: greatwizard/coverage-diff-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

          # Path of the json-summary file to analyze.
          coverage-filename: coverage/coverage-summary.json

          # Name of the json file containing the repository's default branch json-summary stored in the repo wiki.
          base-summary-filename: base-summary.json

          # If true, it will not fail even if the current branch's coverage is lower than the default branch's coverage.
          allowed-to-fail: false

          # Whether or not a badge will be generated and stored.
          badge-enabled: true

          # Name of the json file containing badge informations stored in the repo wiki.
          badge-filename: coverage-diff-badge.json

          # If the coverage percentage is above or equal to this value, the badge will be green.
          badge-threshold-green: 100

          # If the coverage percentage is not green and above or equal to this value, the badge will be orange. Otherwise it will be red.
          badge-threshold-orange: 70

          # Override the default branch name.
          default-branch: next
```

### Pinning

On the examples above, the version was set to `v1` (a branch).
You can also pin a specific version such as `v1.0.0` (a tag).

### What about external pull requests

Currently this action fails for external pull requests.
The problem is described [here](https://github.blog/changelog/2021-02-19-github-actions-workflows-triggered-by-dependabot-prs-will-run-with-read-only-permissions/)
and [here](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/).

### Note on the state of this action

There is no automated test so it's possible that it fails at some point if a dependency breaks compatibility.
If this happens, we'll fix it and put better checks in place.

It's probably usable as-is, but you're welcome to offer feedback and, if you want, contributions.

## Integration in major frameworks

`coverage-diff-action` operates on a report file. This report file is supposed to have been generated by a coverage tool launched in the Github workflow. In other words, using `coverage-diff-action` implies that you already have a functional coverage generation present in your workflow.

If you don't have this yet, this section will provide you some guidance depending on the framework you use.

Set up code coverage with:
- [Ember](/docs/ember.md)

## Contributing

If you want to help, please get in touch (open an issue or something).

## License

This project is licensed under the [MIT License](LICENSE.md).

