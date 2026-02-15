import { handler } from "../../src/handlers/deleteTask";
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

describe("deleteTask handler", () => {
  test("should delete a task successfully", async () => {
    mockSend.mockResolvedValue({});

    const event = createEvent({
      pathParameters: { id: "abc-123" },
    });

    const result = await handler(event, {} as any, () => {});
    const body = JSON.parse(result!.body);

    expect(result!.statusCode).toBe(200);
    expect(body.message).toBe("Task deleted successfully");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("should return 400 when task ID is missing", async () => {
    const event = createEvent({ pathParameters: null });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(400);
    expect(JSON.parse(result!.body).error).toBe("Task ID is required");
  });

  test("should return 404 when task does not exist", async () => {
    const error = new Error("ConditionalCheckFailedException");
    error.name = "ConditionalCheckFailedException";
    mockSend.mockRejectedValue(error);

    const event = createEvent({
      pathParameters: { id: "nonexistent" },
    });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(404);
    expect(JSON.parse(result!.body).error).toBe("Task not found");
  });

  test("should return 500 when DynamoDB fails", async () => {
    mockSend.mockRejectedValue(new Error("DynamoDB error"));

    const event = createEvent({
      pathParameters: { id: "abc-123" },
    });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(500);
    expect(JSON.parse(result!.body).error).toBe("Could not delete task");
  });
});
