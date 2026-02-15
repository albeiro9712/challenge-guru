import { handler } from "../../src/handlers/createTask";
import { docClient } from "../../src/utils/dynamodb";
import { createEvent } from "../helpers/event";

jest.mock("../../src/utils/dynamodb", () => ({
  docClient: { send: jest.fn() },
  TABLE_NAME: "test-table",
}));

jest.mock("uuid", () => ({
  v4: () => "test-uuid-1234",
}));

const mockSend = docClient.send as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createTask handler", () => {
  test("should create a task with all fields", async () => {
    mockSend.mockResolvedValue({});

    const event = createEvent({
      body: JSON.stringify({
        title: "Buy coffee",
        description: "Go to the store",
        status: "in_progress",
        priority: "high",
      }),
    });

    const result = await handler(event, {} as any, () => {});
    const body = JSON.parse(result!.body);

    expect(result!.statusCode).toBe(201);
    expect(body.taskId).toBe("test-uuid-1234");
    expect(body.title).toBe("Buy coffee");
    expect(body.description).toBe("Go to the store");
    expect(body.status).toBe("in_progress");
    expect(body.priority).toBe("high");
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("should create a task with defaults when optional fields are missing", async () => {
    mockSend.mockResolvedValue({});

    const event = createEvent({
      body: JSON.stringify({ title: "Simple task" }),
    });

    const result = await handler(event, {} as any, () => {});
    const body = JSON.parse(result!.body);

    expect(result!.statusCode).toBe(201);
    expect(body.description).toBe("");
    expect(body.status).toBe("pending");
    expect(body.priority).toBe("medium");
  });

  test("should return 400 when body is missing", async () => {
    const event = createEvent({ body: null });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(400);
    expect(JSON.parse(result!.body).error).toBe("Request body is required");
  });

  test("should return 400 when title is missing", async () => {
    const event = createEvent({
      body: JSON.stringify({ description: "No title here" }),
    });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(400);
    expect(JSON.parse(result!.body).error).toBe("Title is required");
  });

  test("should return 500 when DynamoDB fails", async () => {
    mockSend.mockRejectedValue(new Error("DynamoDB error"));

    const event = createEvent({
      body: JSON.stringify({ title: "Failing task" }),
    });

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(500);
    expect(JSON.parse(result!.body).error).toBe("Could not create task");
  });
});
