import { success, error } from "../../src/utils/response";

describe("response helpers", () => {
  describe("success", () => {
    test("should return 200 by default", () => {
      const result = success({ data: "test" });

      expect(result.statusCode).toBe(200);
      expect(result.headers!["Content-Type"]).toBe("application/json");
      expect(JSON.parse(result.body)).toEqual({ data: "test" });
    });

    test("should return custom status code", () => {
      const result = success({ id: "123" }, 201);

      expect(result.statusCode).toBe(201);
    });

    test("should handle array body", () => {
      const result = success([1, 2, 3]);

      expect(JSON.parse(result.body)).toEqual([1, 2, 3]);
    });
  });

  describe("error", () => {
    test("should return 500 by default", () => {
      const result = error("Something went wrong");

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({ error: "Something went wrong" });
    });

    test("should return custom status code", () => {
      const result = error("Not found", 404);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({ error: "Not found" });
    });

    test("should include Content-Type header", () => {
      const result = error("test");

      expect(result.headers!["Content-Type"]).toBe("application/json");
    });
  });
});
