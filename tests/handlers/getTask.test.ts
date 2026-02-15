import { handler } from "../../src/handlers/getTask";
import { docClient } from "../../src/utils/dynamodb";
import { createEvent } from "../helpers/event";

jest.mock("../../src/utils/dynamodb", () => ({
  docClient: { send: jest.fn() },
  TABLE_NAME: "test-table",
}));

const mockSend = docClient.send as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getTask handler", () => {
  test("should return a task when it exists", async () => {
    const mockTask = {
      taskId: "abc-123",
      title: "Test task",
      description: "A test",
      status: "pending",
      priority: "medium",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    mockSend.mockResolvedValue({ Item: mockTask });

    const event = createEvent({
      pathParameters: { id: "abc-123" },
    });

    const result = await handler(event, {} as any, () => {});
    const body = JSON.parse(result!.body);

    expect(result!.statusCode).toBe(200);
    expect(body.taskId).toBe("abc-123");
    expect(body.title).toBe("Test task");
  });

  test("should return 404 when task does not exist", async () => {
    mockSend.mockResolvedValue({ Item: undefined });

    const event = createEvent({
      pathParameters: { id: "nonexistent" },
    });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(404);
    expect(JSON.parse(result!.body).error).toBe("Task not found");
  });

  test("should return 400 when task ID is missing", async () => {
    const event = createEvent({ pathParameters: null });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(400);
    expect(JSON.parse(result!.body).error).toBe("Task ID is required");
  });

  test("should return 500 when DynamoDB fails", async () => {
    mockSend.mockRejectedValue(new Error("DynamoDB error"));

    const event = createEvent({
      pathParameters: { id: "abc-123" },
    });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(500);
    expect(JSON.parse(result!.body).error).toBe("Could not get task");
  });
});
