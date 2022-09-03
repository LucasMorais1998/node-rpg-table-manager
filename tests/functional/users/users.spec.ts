import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import { UserFactory } from "Database/factories";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

/*
  {
    "users": {
      "id": number
      "email": string,
      "username": string,
      "password": string,
      "avatar": string
    }
  }
*/

test.group("User", (group) => {
  test("It should create an user", async ({ assert }) => {
    const userPayload = {
      email: "test@test.com",
      username: "test",
      password: "test",
      avatar: "https://source.unsplash.com/random",
    };

    const { body } = await supertest(BASE_URL)
      .post("/users")
      .send(userPayload)
      .expect(201);

    assert.exists(body.user, "User undefined");
    assert.exists(body.user.id, "Id undefined");
    assert.equal(body.user.email, userPayload.email);
    assert.equal(body.user.username, userPayload.username);
    assert.notExists(body.user.password, "Password defined");
    assert.equal(body.user.avatar, userPayload.avatar);
  });

  test("It should return 409 when email is already in use", async ({
    assert,
  }) => {
    const { email } = await UserFactory.create();

    const { body } = await supertest(BASE_URL)
      .post("/users")
      .send({
        username: "test",
        email,
        password: "test",
      })
      .expect(409);

    assert.exists(body.message);
    assert.exists(body.code);
    assert.exists(body.status);
    assert.include(body.message, "email");
    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 409);
  });

  test("It should return 409 when username is already in use", async ({
    assert,
  }) => {
    const { username } = await UserFactory.create();

    const { body } = await supertest(BASE_URL)
      .post("/users")
      .send({
        username,
        email: "test@test.com",
        password: "test",
      })
      .expect(409);

    assert.exists(body.message);
    assert.exists(body.code);
    assert.exists(body.status);
    assert.include(body.message, "username");
    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 409);
  });

  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });
});
