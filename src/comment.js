const MARKER = "<!-- This comment was produced by coverage-diff-action -->";

async function addComment(octokit, repo, issue_number, body) {
  return await octokit.rest.issues.createComment({
    ...repo,
    issue_number,
    body: `${body}
${MARKER}`,
  });
}

async function deleteExistingComments(octokit, repo, issue_number) {
  let comments = await octokit.rest.issues.listComments({
    ...repo,
    issue_number,
  });

  for (const comment of comments.data) {
    if (comment.body.includes(MARKER)) {
      await octokit.rest.issues.deleteComment({
        ...repo,
        comment_id: comment.id,
      });
    }
  }
}

module.exports = { addComment, deleteExistingComments };
