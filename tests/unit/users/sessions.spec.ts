import { test } from "@japa/runner";
// import Hash from "@ioc:Adonis/Core/Hash";
import Database from "@ioc:Adonis/Lucid/Database";
import { UserFactory } from "Database/factories";
// import { DateTime, Duration } from "luxon";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("Sessions", (group) => {
  test("It should authenticate an user", async ({ assert }) => {
    const plainPassword = "test";

    const { id, email } = await UserFactory.merge({
      password: plainPassword,
    }).create();

    const { body } = await supertest(BASE_URL)
      .post("/sessions")
      .send({ email, password: plainPassword })
      .expect(201);

    assert.isDefined(body.user, "User undefined");
    assert.equal(body.user.id, id);
  });

  test("It should return an api token when session is created", async ({
    assert,
  }) => {
    const plainPassword = "test";

    const { id, email } = await UserFactory.merge({
      password: plainPassword,
    }).create();

    const { body } = await supertest(BASE_URL)
      .post("/sessions")
      .send({ email, password: plainPassword })
      .expect(201);

    assert.isDefined(body.token, "Token undefined");
    assert.equal(body.user.id, id);
  });

  test("It should return 400 when credentials are not provided", async ({
    assert,
  }) => {
    const { body } = await supertest(BASE_URL)
      .post("/sessions")
      .send()
      .expect(400);

    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 400);
  });

  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });
});
