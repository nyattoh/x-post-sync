import { describe, it, expect, vi } from "vitest";
import { fetchUserId, fetchTweets, tweetToMarkdown, Tweet } from "../src/core";

describe("fetchUserId", () => {
  it("should parse user id from response", async () => {
    const mockRequestUrl = vi.fn().mockResolvedValue({
      json: [{ id: "12" }]
    });
    
    const id = await fetchUserId("jack", mockRequestUrl);
    expect(id).toBe("12");
    expect(mockRequestUrl).toHaveBeenCalledWith({
      url: "https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=jack"
    });
  });

  it("should throw error when user id not found", async () => {
    const mockRequestUrl = vi.fn().mockResolvedValue({
      json: []
    });
    
    await expect(fetchUserId("unknown", mockRequestUrl)).rejects.toThrow("Failed to fetch user ID: User ID not found for username: unknown");
  });

  it("should handle null response", async () => {
    const mockRequestUrl = vi.fn().mockResolvedValue({
      json: [{ id: null }]
    });
    
    await expect(fetchUserId("nulluser", mockRequestUrl)).rejects.toThrow("Failed to fetch user ID: User ID not found for username: nulluser");
  });
});

describe("fetchTweets", () => {
  it("should fetch tweets with proper headers", async () => {
    const mockTweets = [
      { id: "1", text: "Hello world", created_at: "2025-06-05T12:00:00Z" },
      { id: "2", text: "Another tweet", created_at: "2025-06-05T13:00:00Z" }
    ];
    
    const mockRequestUrl = vi.fn().mockResolvedValue({
      json: { data: mockTweets }
    });
    
    const tweets = await fetchTweets("123456", "test-bearer-token", mockRequestUrl);
    
    expect(tweets).toEqual(mockTweets);
    expect(mockRequestUrl).toHaveBeenCalledWith({
      url: "https://api.twitter.com/2/users/123456/tweets?max_results=100&exclude=replies&tweet.fields=created_at,referenced_tweets",
      headers: { Authorization: "Bearer test-bearer-token" }
    });
  });

  it("should return empty array when no data", async () => {
    const mockRequestUrl = vi.fn().mockResolvedValue({
      json: {}
    });
    
    const tweets = await fetchTweets("123456", "test-bearer-token", mockRequestUrl);
    expect(tweets).toEqual([]);
  });
});

describe("tweetToMarkdown", () => {
  it("should include text and id in markdown", () => {
    const tweet: Tweet = {
      id: "1",
      text: "hello world",
      created_at: "2025-06-05T00:00:00Z"
    };
    
    const md = tweetToMarkdown(tweet);
    expect(md).toContain("hello world");
    expect(md).toContain("id: 1");
    expect(md).toContain("created_at: 2025-06-05T00:00:00Z");
  });

  it("should include retweeted_id for retweets", () => {
    const tweet: Tweet = {
      id: "2",
      text: "RT: great content",
      created_at: "2025-06-05T10:00:00Z",
      referenced_tweets: [{ id: "999", type: "retweeted" }]
    };
    
    const md = tweetToMarkdown(tweet);
    expect(md).toContain("retweeted_id: 999");
  });

  it("should not include retweeted_id for non-retweets", () => {
    const tweet: Tweet = {
      id: "3",
      text: "my own tweet",
      created_at: "2025-06-05T11:00:00Z",
      referenced_tweets: [{ id: "888", type: "quoted" }]
    };
    
    const md = tweetToMarkdown(tweet);
    expect(md).not.toContain("retweeted_id:");
  });

  it("should format markdown with proper structure", () => {
    const tweet: Tweet = {
      id: "4",
      text: "structured tweet",
      created_at: "2025-06-05T12:00:00Z"
    };
    
    const md = tweetToMarkdown(tweet);
    const lines = md.split("\n");
    
    expect(lines[0]).toBe("---");
    expect(lines[1]).toBe("id: 4");
    expect(lines[2]).toBe("created_at: 2025-06-05T12:00:00Z");
    expect(lines[3]).toBe("");
    expect(lines[4]).toBe("---");
    expect(lines[5]).toBe("structured tweet");
    expect(lines[6]).toBe("");
  });
});