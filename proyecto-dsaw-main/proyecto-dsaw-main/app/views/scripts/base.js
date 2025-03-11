deletePostConfirmation = function (postId) {
    let confirmDeletion = window.confirm("Delete post?");
    if (confirmDeletion) {
      urlPath = "{% url 'blog:post-delete' 1 %}"; // since we cannot configure the url previously
      // we replace the pk with the post one
      urlPath = urlPath.replace('1', postId);
      window.location.href = urlPath;
    }
  }