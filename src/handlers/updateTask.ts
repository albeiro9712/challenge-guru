import { APIGatewayProxyHandler } from "aws-lambda";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../utils/dynamodb";
import { success, error } from "../utils/response";
import { UpdateTaskInput } from "../types/task";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const taskId = event.pathParameters?.id;

    if (!taskId) {
      return error("Task ID is required", 400);
    }

    if (!event.body) {
      return error("Request body is required", 400);
    }

    const input: UpdateTaskInput = JSON.parse(event.body);
    const now = new Date().toISOString();

    const expressionParts: string[] = [];
    const expressionValues: Record<string, unknown> = {};
    const expressionNames: Record<string, string> = {};

    const updatableFields: (keyof UpdateTaskInput)[] = ["title", "description", "status", "priority"];

    for (const field of updatableFields) {
      if (input[field] !== undefined) {
        expressionParts.push(`#${field} = :${field}`);
        expressionValues[`:${field}`] = input[field];
        expressionNames[`#${field}`] = field;
      }
    }

    if (expressionParts.length === 0) {
      return error("No fields to update", 400);
    }

    expressionParts.push("#updatedAt = :updatedAt");
    expressionValues[":updatedAt"] = now;
    expressionNames["#updatedAt"] = "updatedAt";

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { taskId },
        UpdateExpression: `SET ${expressionParts.join(", ")}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: "ALL_NEW",
        ConditionExpression: "attribute_exists(taskId)",
      })
    );

    return success(result.Attributes);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
      return error("Task not found", 404);
    }
    console.error("Error updating task:", err);
    return error("Could not update task");
  }
};
