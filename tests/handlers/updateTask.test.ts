import { handler } from "../../src/handlers/updateTask";
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

describe("updateTask handler", () => {
  test("should update a task successfully", async () => {
    const updatedTask = {
      taskId: "abc-123",
      title: "Updated title",
      description: "Original description",
      status: "pending",
      priority: "medium",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-02-15T00:00:00.000Z",
    };

    mockSend.mockResolvedValue({ Attributes: updatedTask });

    const event = createEvent({
      pathParameters: { id: "abc-123" },
      body: JSON.stringify({ title: "Updated title" }),
    });

    const result = await handler(event, {} as any, () => {});
    const body = JSON.parse(result!.body);

    expect(result!.statusCode).toBe(200);
    expect(body.title).toBe("Updated title");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("should return 400 when task ID is missing", async () => {
    const event = createEvent({
      pathParameters: null,
      body: JSON.stringify({ title: "Test" }),
    });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(400);
    expect(JSON.parse(result!.body).error).toBe("Task ID is required");
  });

  test("should return 400 when body is missing", async () => {
    const event = createEvent({
      pathParameters: { id: "abc-123" },
      body: null,
    });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(400);
    expect(JSON.parse(result!.body).error).toBe("Request body is required");
  });

  test("should return 400 when no fields to update", async () => {
    const event = createEvent({
      pathParameters: { id: "abc-123" },
      body: JSON.stringify({}),
    });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(400);
    expect(JSON.parse(result!.body).error).toBe("No fields to update");
  });

  test("should return 404 when task does not exist", async () => {
    const error = new Error("ConditionalCheckFailedException");
    error.name = "ConditionalCheckFailedException";
    mockSend.mockRejectedValue(error);

    const event = createEvent({
      pathParameters: { id: "nonexistent" },
      body: JSON.stringify({ title: "Test" }),
    });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(404);
    expect(JSON.parse(result!.body).error).toBe("Task not found");
  });

  test("should return 500 when DynamoDB fails", async () => {
    mockSend.mockRejectedValue(new Error("DynamoDB error"));

    const event = createEvent({
      pathParameters: { id: "abc-123" },
      body: JSON.stringify({ title: "Test" }),
    });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(500);
    expect(JSON.parse(result!.body).error).toBe("Could not update task");
  });
});
