import { test } from "@japa/runner";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("User", () => {
  test("It should create an user", async ({ assert }) => {
    const userPayload = { email: "test@test", userName: "test", password: "test" };

    await supertest(BASE_URL).post("/users").send(userPayload).expect(201);
  });
});
