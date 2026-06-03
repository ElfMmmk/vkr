import { describe, expect, it } from "vitest";

import {
  adminUserPageSize,
  parseAdminUserListParams,
  toAdminUserSearchParams
} from "@/lib/admin-user-query";

describe("admin user query helpers", () => {
  it("normalizes invalid page, role, sort, and empty search", () => {
    expect(
      parseAdminUserListParams({
        page: "-4",
        query: "   ",
        role: "owner",
        sort: "name"
      })
    ).toEqual({
      page: 1,
      pageSize: adminUserPageSize,
      sort: "newest"
    });
  });

  it("keeps supported filters and trims search", () => {
    expect(
      parseAdminUserListParams({
        page: "3",
        query: "  anna   client  ",
        role: "client",
        sort: "email"
      })
    ).toEqual({
      page: 3,
      pageSize: adminUserPageSize,
      query: "anna client",
      role: "client",
      sort: "email"
    });
  });

  it("serializes params without empty values", () => {
    const params = toAdminUserSearchParams({
      page: 2,
      pageSize: adminUserPageSize,
      query: "manager",
      role: "manager",
      sort: "oldest"
    });

    expect(params.toString()).toBe("query=manager&role=manager&sort=oldest&page=2");
  });

  it("omits default page from serialized params", () => {
    const params = toAdminUserSearchParams({
      page: 1,
      pageSize: adminUserPageSize,
      sort: "newest"
    });

    expect(params.toString()).toBe("sort=newest");
  });
});
