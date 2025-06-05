export interface Post {
  author: string;
  text: string;
}

export function formatPost(post: Post): string {
  return `**${post.author}**: ${post.text}`;
}
