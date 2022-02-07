async function addComment(octokit, owner, repo, issue_number, body) {
  return await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number,
    body,
  });
}

async function deleteExistingComments(octokit, owner, repo, issue_number) {
  let comments = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number,
  });

  for (const comment of comments.data) {
    if (comment.body.includes(MARKER)) {
      await octokit.rest.issues.deleteComment({
        comment_id: comment.id,
      });
    }
  }
}

module.exports = { addComment, deleteExistingComments };
