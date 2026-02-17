const BASE_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

if (!BASE_URL || !API_KEY) {
  throw new Error(
    "Missing environment variables. Run with: API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/dev API_KEY=your-key npm run test:integration"
  );
}

const headers = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
};

describe("Tasks API - Integration Tests", () => {
  let taskId: string;

  test("POST /tasks - should create a task", async () => {
    const response = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Integration test task",
        description: "Created by integration test",
        priority: "high",
      }),
    });

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.title).toBe("Integration test task");
    expect(body.description).toBe("Created by integration test");
    expect(body.priority).toBe("high");
    expect(body.status).toBe("pending");
    expect(body.taskId).toBeDefined();
    expect(body.createdAt).toBeDefined();

    taskId = body.taskId;
  });

  test("GET /tasks/:id - should return the created task", async () => {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}`, { headers });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.taskId).toBe(taskId);
    expect(body.title).toBe("Integration test task");
  });

  test("GET /tasks - should return list including the created task", async () => {
    const response = await fetch(`${BASE_URL}/tasks`, { headers });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);

    const found = body.find((task: { taskId: string }) => task.taskId === taskId);
    expect(found).toBeDefined();
  });

  test("PUT /tasks/:id - should update the task", async () => {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        title: "Updated integration test task",
        status: "in-progress",
      }),
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.title).toBe("Updated integration test task");
    expect(body.status).toBe("in-progress");
  });

  test("DELETE /tasks/:id - should delete the task", async () => {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers,
    });

    expect(response.status).toBe(200);
  });

  test("GET /tasks/:id - should return 404 after delete", async () => {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}`, { headers });

    expect(response.status).toBe(404);
  });

  test("POST /tasks - should return 400 without title", async () => {
    const response = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({ description: "No title" }),
    });

    expect(response.status).toBe(400);
  });

  test("GET /tasks/:id - should return 404 for non-existent task", async () => {
    const response = await fetch(`${BASE_URL}/tasks/non-existent-id`, {
      headers,
    });

    expect(response.status).toBe(404);
  });

  test("DELETE /tasks/:id - should return 404 for non-existent task", async () => {
    const response = await fetch(`${BASE_URL}/tasks/non-existent-id`, {
      method: "DELETE",
      headers,
    });

    expect(response.status).toBe(404);
  });

  test("POST /tasks - should return 403 without API key", async () => {
    const response = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "No API key" }),
    });

    expect(response.status).toBe(403);
  });
});
