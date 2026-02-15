import { APIGatewayProxyHandler } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { docClient, TABLE_NAME } from "../utils/dynamodb";
import { success, error } from "../utils/response";
import { CreateTaskInput } from "../types/task";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return error("Request body is required", 400);
    }

    const input: CreateTaskInput = JSON.parse(event.body);

    if (!input.title) {
      return error("Title is required", 400);
    }

    const now = new Date().toISOString();
    const task = {
      taskId: uuid(),
      title: input.title,
      description: input.description || "",
      status: input.status || "pending",
      priority: input.priority || "medium",
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: task,
      })
    );

    return success(task, 201);
  } catch (err) {
    console.error("Error creating task:", err);
    return error("Could not create task");
  }
};
