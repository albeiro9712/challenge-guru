import { APIGatewayProxyHandler } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../utils/dynamodb";
import { success, error } from "../utils/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const taskId = event.pathParameters?.id;

    if (!taskId) {
      return error("Task ID is required", 400);
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { taskId },
      })
    );

    if (!result.Item) {
      return error("Task not found", 404);
    }

    return success(result.Item);
  } catch (err) {
    console.error("Error getting task:", err);
    return error("Could not get task");
  }
};