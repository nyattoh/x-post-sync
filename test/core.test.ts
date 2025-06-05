// -------- test/core.test.ts ----------
import { describe,it,expect } from "vitest";
import { fetchUserId, tweetToMarkdown } from "../src/core";
import type { RequestUrlParam } from "obsidian";

describe("tweetToMarkdown",()=>{
  it("includes text & id",()=>{
    const md = tweetToMarkdown({id:"1",text:"hello",created_at:"2025-06-05T00:00:00Z"});
    expect(md).toContain("hello");
    expect(md).toContain("id: 1");
  });
});

describe("fetchUserId",()=>{
  it("parses id",async()=>{
    const mockRequestUrl = async (params: RequestUrlParam) => {
      return { json: [{id:"12"}] };
    };
    const id = await fetchUserId("jack", mockRequestUrl);
    expect(id).toBe("12");
  });
}); 