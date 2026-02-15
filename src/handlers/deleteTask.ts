import { APIGatewayProxyHandler } from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../utils/dynamodb";
import { success, error } from "../utils/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const taskId = event.pathParameters?.id;

    if (!taskId) {
      return error("Task ID is required", 400);
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { taskId },
        ConditionExpression: "attribute_exists(taskId)",
      })
    );

    return success({ message: "Task deleted successfully" });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
      return error("Task not found", 404);
    }
    console.error("Error deleting task:", err);
    return error("Could not delete task");
  }
};
