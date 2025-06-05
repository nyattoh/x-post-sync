import type { RequestUrlParam } from "obsidian";

/* ---------- 型 ---------- */
export interface Tweet {
    id: string;
    text: string;
    created_at: string;
    referenced_tweets?: { id: string; type: string }[];
}

/* ---------- ユーザ ID 取得 (CORS 無し) ---------- */
export async function fetchUserId(
    username: string,
    requestUrl: (p: RequestUrlParam) => Promise<any>
): Promise<string> {
    const url =
        "https://cdn.syndication.twimg.com/widgets/followbutton/info.json" +
        `?screen_names=${encodeURIComponent(username)}`;
    console.log("fetchUserId: Requesting URL:", url);
    const res = await requestUrl({ url });
    console.log("fetchUserId: Full response object:", res);
    console.log("fetchUserId: res.json type:", typeof res.json);
    console.log("fetchUserId: res.json content:", res.json);

    if (typeof res.json === 'string') {
        console.log("fetchUserId: res.json is a string. Attempting to parse if not empty.");
        if (res.json.trim() === "") {
            console.error("fetchUserId: res.json is an empty string. Cannot parse.");
            throw new Error("User ID not found - empty response from API");
        }
        try {
            const parsedJson = JSON.parse(res.json);
            console.log("fetchUserId: Parsed res.json (if it was a string):", parsedJson);
            const id = parsedJson[0]?.id;
            if (!id) throw new Error("User ID not found in parsed JSON");
            return id;
        } catch (e: any) {
            console.error("fetchUserId: Error parsing res.json string:", e.message);
            throw new Error("User ID not found - failed to parse API response string: " + e.message);
        }
    } else if (typeof res.json === 'object' && res.json !== null) {
        const id = res.json[0]?.id;
        if (!id) throw new Error("User ID not found in response object");
        return id;
    } else {
        console.error("fetchUserId: res.json is not a string or a valid object. Content:", res.json);
        throw new Error("User ID not found - unexpected API response format");
    }
}

/* ---------- ポスト取得 ---------- */
export async function fetchTweets(
    userId: string,
    bearer: string,
    requestUrl: (p: RequestUrlParam) => Promise<any>
): Promise<Tweet[]> {
    const url =
        `https://api.twitter.com/2/users/${userId}/tweets` +
        `?max_results=100&exclude=replies` +
        `&tweet.fields=created_at,referenced_tweets`;
    const res = await requestUrl({ url, headers: { Authorization: `Bearer ${bearer}` } });
    return res.json.data ?? [];
}

/* ---------- Markdown 変換 ---------- */
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
