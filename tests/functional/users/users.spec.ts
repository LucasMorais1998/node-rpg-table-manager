import Hash from "@ioc:Adonis/Core/Hash";
import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import User from "App/Models/User";
import { UserFactory } from "Database/factories";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;
let token = "";
let user = {} as User;

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
    assert.notExists(body.user.password, "Password undefined");
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

    assert.exists(body.code);
    assert.exists(body.message);
    assert.exists(body.status);
    assert.equal(body.code, "BAD_REQUEST");
    assert.include(body.message, "email");
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

    assert.exists(body.code);
    assert.exists(body.message);
    assert.exists(body.status);
    assert.equal(body.code, "BAD_REQUEST");
    assert.include(body.message, "username");
    assert.equal(body.status, 409);
  });

  test("It should return 422 when required user-data is not provided", async ({
    assert,
  }) => {
    const { body } = await supertest(BASE_URL)
      .post("/users")
      .send({})
      .expect(422);

    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 422);
  });

  test("It should return 422 when providing an invalid email", async ({
    assert,
  }) => {
    const { body } = await supertest(BASE_URL)
      .post("/users")
      .send({
        username: "test",
        email: "test",
        password: "test",
      })
      .expect(422);

    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 422);
  });

  test("It should return 422 when providing an invalid password", async ({
    assert,
  }) => {
    const { body } = await supertest(BASE_URL)
      .post("/users")
      .send({
        username: "test",
        email: "test@test.com",
        password: "tes",
      })
      .expect(422);

    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 422);
  });

  test("It should update an user", async ({ assert }) => {
    await (async () => {
      const plainPassword = "test";

      const newUser = await UserFactory.merge({
        password: plainPassword,
      }).create();

      const { body } = await supertest(BASE_URL)
        .post("/sessions")
        .send({ email: newUser.email, password: plainPassword })
        .expect(201);

      token = body.token.token;
      user = newUser;
    })();

    const email = "test@test.com";
    const avatar = "https://avatars.githubusercontent.com/u/89818412?v=4";

    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        email,
        avatar,
        password: user.password,
      })
      .expect(200);

    assert.exists(body.user, "User undefined");
    assert.equal(body.user.email, email);
    assert.equal(body.user.avatar, avatar);
    assert.equal(body.user.id, user.id);
  });

  test("It should update the password of the user", async ({ assert }) => {
    const password = "test";

    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: user.email,
        avatar: user.avatar,
        password,
      })
      .expect(200);

    assert.exists(body.user, "User undefined");
    assert.equal(body.user.id, user.id);

    await user.refresh();

    assert.isTrue(await Hash.verify(user.password, password));
  });

  // eslint-disable-next-line max-len
  test("It should return 422 when required data to update is not provided", async ({
    assert,
  }) => {
    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(422);

    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 422);
  });

  test("It should return 422 when providing invalid email on update", async ({
    assert,
  }) => {
    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        password: user.password,
        avatar: user.avatar,
        email: "test",
      })
      .expect(422);

    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 422);
  });

  // eslint-disable-next-line max-len
  test("It should return 422 when providing invalid password on update", async ({
    assert,
  }) => {
    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        password: "tes",
        avatar: user.avatar,
        email: user.email,
      })
      .expect(422);

    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 422);
  });

  test("It should return 422 when providing invalid avatar on update", async ({
    assert,
  }) => {
    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        password: user.password,
        avatar: "test",
        email: user.email,
      })
      .expect(422);

    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 422);
  });

  group.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  group.setup(async () => {
    const plainPassword = "test";

    const newUser = await UserFactory.merge({
      password: plainPassword,
    }).create();

    const { body } = await supertest(BASE_URL)
      .post("/sessions")
      .send({ email: newUser.email, password: plainPassword })
      .expect(201);

    token = body.token.token;
    user = newUser;
  });

  group.teardown(async () => {
    await supertest(BASE_URL)
      .delete("/sessions")
      .set("Authorization", `Bearer ${token}`);
  });
});
