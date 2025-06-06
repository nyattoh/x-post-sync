import { describe, it, expect, vi } from "vitest";
import { fetchUserId, fetchTweets, tweetToMarkdown, Tweet } from "../src/core";
import { checkMonthlyReset, XSyncSettings } from "../src/settings";

describe("fetchUserId", () => {
  it("should parse user id from syndication API when no bearer token", async () => {
    const mockRequestUrl = vi.fn().mockResolvedValue({
      json: [{ id: "12" }]
    });
    
    const id = await fetchUserId("jack", mockRequestUrl);
    expect(id).toBe("12");
    expect(mockRequestUrl).toHaveBeenCalledWith({
      url: "https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=jack"
    });
  });

  it("should try X API v2 first when bearer token provided", async () => {
    const mockRequestUrl = vi.fn()
      .mockResolvedValueOnce({
        json: { data: { id: "123" } }
      });
    
    const id = await fetchUserId("jack", mockRequestUrl, "test-bearer");
    expect(id).toBe("123");
    expect(mockRequestUrl).toHaveBeenCalledWith({
      url: "https://api.x.com/2/users/by/username/jack",
      headers: { Authorization: "Bearer test-bearer" }
    });
  });

  it("should fallback to syndication API when X API fails", async () => {
    const mockRequestUrl = vi.fn()
      .mockRejectedValueOnce(new Error("X API failed"))
      .mockResolvedValueOnce({
        json: [{ id: "12" }]
      });
    
    const id = await fetchUserId("jack", mockRequestUrl, "test-bearer");
    expect(id).toBe("12");
    expect(mockRequestUrl).toHaveBeenCalledTimes(2);
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

  it("should handle empty text response", async () => {
    const mockRequestUrl = vi.fn().mockResolvedValue({
      text: ""
    });
    
    await expect(fetchUserId("emptyuser", mockRequestUrl)).rejects.toThrow("Failed to fetch user ID: Empty response from syndication API");
  });
});

describe("fetchTweets", () => {
  it("should fetch tweets with proper headers using api.x.com", async () => {
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
      url: "https://api.x.com/2/users/123456/tweets?max_results=100&exclude=replies&tweet.fields=created_at,referenced_tweets",
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

  it("should handle rate limit 429 error thrown by requestUrl", async () => {
    const error = new Error("Request failed, status 429");
    error.name = "RequestUrlError";
    (error as any).status = 429;
    const mockRequestUrl = vi.fn().mockRejectedValue(error);
    
    await expect(fetchTweets("123456", "test-bearer-token", mockRequestUrl))
      .rejects.toThrow("Rate limit exceeded. Free tier: 100 reads/month. Please wait before trying again.");
  });

  it("should handle rate limit 429 error in response status", async () => {
    const mockRequestUrl = vi.fn().mockResolvedValue({
      status: 429,
      headers: { 'x-rate-limit-reset': '1672531200' },
      json: { errors: [{ message: "Rate limit exceeded" }] }
    });
    
    await expect(fetchTweets("123456", "test-bearer-token", mockRequestUrl))
      .rejects.toThrow("Rate limit exceeded. Free tier: 100 reads/month. Reset:");
  });

  it("should handle rate limit error from status 429 in error message", async () => {
    const error = new Error("Request failed, status 429");
    const mockRequestUrl = vi.fn().mockRejectedValue(error);
    
    await expect(fetchTweets("123456", "test-bearer-token", mockRequestUrl))
      .rejects.toThrow("Rate limit exceeded. Free tier: 100 reads/month. Please wait before trying again.");
  });

  it("should handle API errors", async () => {
    const mockRequestUrl = vi.fn().mockResolvedValue({
      json: { errors: [{ message: "Invalid authentication credentials" }] }
    });
    
    await expect(fetchTweets("123456", "invalid-token", mockRequestUrl))
      .rejects.toThrow("X API Error: Invalid authentication credentials");
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

describe("checkMonthlyReset", () => {
  it("should reset counter when month changes", () => {
    const settings: XSyncSettings = {
      bearerToken: "test",
      username: "test",
      cachedUserId: "123",
      interval: 60,
      monthlyRequestCount: 50,
      lastResetDate: "2024-10" // Previous month
    };

    const wasReset = checkMonthlyReset(settings);
    
    expect(wasReset).toBe(true);
    expect(settings.monthlyRequestCount).toBe(0);
    expect(settings.lastResetDate).toMatch(/^\d{4}-\d{1,2}$/);
  });

  it("should not reset counter when same month", () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    
    const settings: XSyncSettings = {
      bearerToken: "test",
      username: "test", 
      cachedUserId: "123",
      interval: 60,
      monthlyRequestCount: 25,
      lastResetDate: currentMonth
    };

    const originalCount = settings.monthlyRequestCount;
    const wasReset = checkMonthlyReset(settings);
    
    expect(wasReset).toBe(false);
    expect(settings.monthlyRequestCount).toBe(originalCount);
    expect(settings.lastResetDate).toBe(currentMonth);
  });
});