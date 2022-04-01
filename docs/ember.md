# Integration with Ember JS

## Install the coverage tool

Install the addon [`ember-cli-code-coverage`](https://github.com/kategengler/ember-cli-code-coverage):

```
ember install ember-cli-code-coverage
```

### Refer to the correct README

You need to follow `ember-cli-code-coverage` README to configure the Ember project.

⚠️ But be careful!

The README of the default branch points to the documentation of `ember-cli-code-coverage` 2.x, which is not released on NPM yet. 2.x requires additional configuration steps that fail on 1.x, and the minimal configuration is slightly different depending on what type of application or addon you are working on.

If the version you have just installed is **1.x, refer to the README of the corresponding tag**.
 
### Don't forget Mirage

Read carefully `ember-cli-code-coverage` README. If you use Mirage, there are additional steps to implement in Mirage configuration. This is detailed in the section ["Create a passthrough when intercepting all ajax requests in tests"](https://github.com/kategengler/ember-cli-code-coverage#create-a-passthrough-when-intercepting-all-ajax-requests-in-tests)

## Update Github workflow

Once the coverage is set up, make sure that COVERAGE environment variable is active in the workflow that will call `coverage-diff-action`. 

For instance:
```diff
-    - run: yarn test
+    - run: COVERAGE=true yarn test
    - name: Coverage Diff
        uses: greatwizard/coverage-diff-action@v1
        with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
```