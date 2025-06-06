import type { RequestUrlParam } from "obsidian";

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  referenced_tweets?: { id: string; type: string }[];
}

export async function fetchUserId(
  username: string,
  requestUrl: (p: RequestUrlParam) => Promise<any>,
  bearerToken?: string
): Promise<string> {
  // Try X API v2 first if bearer token is available
  if (bearerToken) {
    const apiUrl = `https://api.x.com/2/users/by/username/${encodeURIComponent(username)}`;
    
    try {
      const res = await requestUrl({
        url: apiUrl,
        headers: { Authorization: `Bearer ${bearerToken}` }
      });
      
      let jsonData;
      if (res.json) {
        jsonData = res.json;
      } else if (res.text) {
        try {
          jsonData = JSON.parse(res.text);
        } catch (parseError) {
          throw new Error(`Invalid JSON response from X API: ${res.text}`);
        }
      } else {
        throw new Error("Empty response from X API");
      }
      
      if (jsonData?.data?.id) {
        return String(jsonData.data.id);
      }
      
      if (jsonData?.errors) {
        console.log("X API v2 errors, falling back to syndication:", jsonData.errors);
      }
    } catch (apiError: any) {
      console.log("X API v2 failed, trying syndication endpoint:", apiError.message);
    }
  }
  
  // Fallback to syndication API (no auth required)
  const syndicationUrl = "https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=" + encodeURIComponent(username);
  
  try {
    const res = await requestUrl({ url: syndicationUrl });
    
    // Handle different response formats
    let jsonData;
    if (res.json) {
      jsonData = res.json;
    } else if (res.text) {
      if (!res.text.trim()) {
        throw new Error("Empty response from syndication API");
      }
      try {
        jsonData = JSON.parse(res.text);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from syndication API: ${res.text}`);
      }
    } else {
      throw new Error("Empty response from syndication API");
    }
    
    // Ensure jsonData is an array
    const data = Array.isArray(jsonData) ? jsonData : [jsonData];
    const id = data[0]?.id;
    
    if (!id) {
      throw new Error(`User ID not found for username: ${username}`);
    }
    
    return String(id);
  } catch (error: any) {
    throw new Error(`Failed to fetch user ID: ${error.message}`);
  }
}

export async function fetchTweets(
  userId: string,
  bearer: string,
  requestUrl: (p: RequestUrlParam) => Promise<any>
): Promise<Tweet[]> {
  const url = `https://api.x.com/2/users/${userId}/tweets?max_results=100&exclude=replies&tweet.fields=created_at,referenced_tweets`;
  
  try {
    const res = await requestUrl({
      url,
      headers: { Authorization: `Bearer ${bearer}` }
    });
    
    // Handle rate limit 429 error specifically
    if (res.status === 429) {
      const resetTime = res.headers?.['x-rate-limit-reset'];
      const resetTimeStr = resetTime ? new Date(parseInt(resetTime) * 1000).toLocaleString() : 'unknown';
      throw new Error(`Rate limit exceeded. Free tier: 100 reads/month. Reset: ${resetTimeStr}`);
    }
    
    // Handle different response formats
    let jsonData;
    if (res.json) {
      jsonData = res.json;
    } else if (res.text) {
      try {
        jsonData = JSON.parse(res.text);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from X API: ${res.text}`);
      }
    } else {
      throw new Error("Empty response from X API");
    }
    
    // Check for API errors
    if (jsonData.errors) {
      const errorMsg = jsonData.errors.map((e: any) => e.message || e.detail).join(", ");
      throw new Error(`X API Error: ${errorMsg}`);
    }
    
    return jsonData.data ?? [];
  } catch (error: any) {
    // Check if this is a rate limit error from Obsidian's requestUrl
    if (error.message && error.message.includes("status 429")) {
      throw new Error("Rate limit exceeded. Free tier: 100 reads/month. Please wait before trying again.");
    }
    
    // Check if the error has a status property indicating 429
    if (error.status === 429) {
      throw new Error("Rate limit exceeded. Free tier: 100 reads/month. Wait 15 minutes or check monthly usage.");
    }
    
    throw new Error(`Failed to fetch tweets: ${error.message}`);
  }
}

export function tweetToMarkdown(t: Tweet): string {
  const rt = t.referenced_tweets?.find(r => r.type === "retweeted")?.id ?? "";
  return [
    "---",
    `id: ${t.id}`,
    `created_at: ${t.created_at}`,
    rt ? `retweeted_id: ${rt}` : "",
    "---",
    t.text,
    ""
  ].join("\n");
}