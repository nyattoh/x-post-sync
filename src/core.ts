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
  bearer?: string
): Promise<string> {
  // Try Twitter API v2 users/by/username endpoint first if bearer token available
  if (bearer) {
    const apiUrl = `https://api.twitter.com/2/users/by/username/${encodeURIComponent(username)}`;
    
    try {
      console.log("Attempting Twitter API v2 for user:", username);
      const res = await requestUrl({ 
        url: apiUrl,
        headers: { 
          Authorization: `Bearer ${bearer}` 
        }
      });
      
      console.log("Twitter API v2 response:", res);
      
      let jsonData;
      try {
        jsonData = res.json;
      } catch (jsonError) {
        if (res.text && res.text.trim()) {
          jsonData = JSON.parse(res.text);
        } else {
          throw new Error("Empty response from Twitter API");
        }
      }
      
      if (jsonData?.data?.id) {
        console.log("Found user ID via API v2:", jsonData.data.id);
        return String(jsonData.data.id);
      }
      
      if (jsonData?.errors) {
        console.log("API v2 errors:", jsonData.errors);
      }
      
    } catch (apiError: any) {
      console.log("Twitter API v2 failed, trying syndication endpoint:", apiError.message);
    }
  }
  
  // Fallback to syndication API (no auth required)
  const syndicationUrl = "https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=" + encodeURIComponent(username);
  
  try {
    console.log("Trying syndication API for user:", username);
    const res = await requestUrl({ url: syndicationUrl });
    console.log("Syndication API response:", res);
    
    let jsonData;
    try {
      jsonData = res.json;
    } catch (jsonError) {
      if (res.text && res.text.trim()) {
        jsonData = JSON.parse(res.text);
      } else {
        throw new Error("Empty response from syndication API");
      }
    }
    
    if (!jsonData) {
      throw new Error("No JSON data in syndication response");
    }
    
    const data = Array.isArray(jsonData) ? jsonData : [jsonData];
    const id = data[0]?.id;
    
    if (!id) {
      throw new Error(`User ID not found for username: ${username}. Please ensure the username is correct and the account is public.`);
    }
    
    console.log("Found user ID via syndication:", id);
    return String(id);
    
  } catch (syndicationError: any) {
    console.error("Syndication API failed:", syndicationError);
    throw new Error(`Failed to fetch user ID for ${username}. Please check the username and try again.`);
  }
}

export async function fetchTweets(
  userId: string,
  bearer: string,
  requestUrl: (p: RequestUrlParam) => Promise<any>
): Promise<Tweet[]> {
  const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&exclude=replies&tweet.fields=created_at,referenced_tweets`;
  try {
    const res = await requestUrl({
      url,
      headers: { Authorization: `Bearer ${bearer}` }
    });
    
    console.log("fetchTweets raw response:", res);
    console.log("fetchTweets response status:", res.status);
    console.log("fetchTweets response text:", res.text);
    
    let jsonData;
    try {
      jsonData = res.json;
    } catch (jsonError) {
      if (res.text && res.text.trim()) {
        jsonData = JSON.parse(res.text);
      } else {
        throw new Error("Empty response from tweets API");
      }
    }
    
    console.log("fetchTweets parsed json:", jsonData);
    
    if (!jsonData) {
      throw new Error("No JSON data in tweets response");
    }
    
    if (jsonData.errors) {
      const errorMsg = jsonData.errors.map((e: any) => e.message).join(", ");
      throw new Error(`API Error: ${errorMsg}`);
    }
    
    return jsonData.data ?? [];
  } catch (error: any) {
    console.error("fetchTweets error:", error);
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