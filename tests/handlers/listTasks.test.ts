import { handler } from "../../src/handlers/listTasks";
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

describe("listTasks handler", () => {
  test("should return all tasks", async () => {
    const mockTasks = [
      { taskId: "1", title: "Task 1" },
      { taskId: "2", title: "Task 2" },
    ];

    mockSend.mockResolvedValue({ Items: mockTasks });

    const event = createEvent();

    const result = await handler(event, {} as any, () => {});
    const body = JSON.parse(result!.body);

    expect(result!.statusCode).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].title).toBe("Task 1");
    expect(body[1].title).toBe("Task 2");
  });

  test("should return empty array when no tasks exist", async () => {
    mockSend.mockResolvedValue({ Items: undefined });

    const event = createEvent();

    const result = await handler(event, {} as any, () => {});
    const body = JSON.parse(result!.body);

    expect(result!.statusCode).toBe(200);
    expect(body).toEqual([]);
  });

  test("should return 500 when DynamoDB fails", async () => {
    mockSend.mockRejectedValue(new Error("DynamoDB error"));

    const event = createEvent();

    const result = await handler(event, {} as any, () => {});

    expect(result!.statusCode).toBe(500);
    expect(JSON.parse(result!.body).error).toBe("Could not list tasks");
  });
});
