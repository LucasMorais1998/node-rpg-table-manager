import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import User from "App/Models/User";
import { GroupFactory, UserFactory } from "Database/factories";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;
let token = "";
let user = {} as User;

test.group("Group", (group) => {
  test("It should create a group", async ({ assert }) => {
    const groupPayload = {
      name: "test",
      description: "test",
      schedule: "test",
      location: "test",
      chronic: "test",
      master: user.id,
    };

    const { body } = await supertest(BASE_URL)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send(groupPayload)
      .expect(201);

    assert.exists(body.group, "Group undefined");
    assert.equal(body.group.name, groupPayload.name);
    assert.equal(body.group.description, groupPayload.description);
    assert.equal(body.group.schedule, groupPayload.schedule);
    assert.equal(body.group.location, groupPayload.location);
    assert.equal(body.group.chronic, groupPayload.chronic);
    assert.equal(body.group.master, groupPayload.master);

    assert.exists(body.group.players, "Players undefined");
    assert.equal(body.group.players.length, 1);
    assert.equal(body.group.players[0].id, groupPayload.master);
  });

  test("It should return 422 when required group-data is not provided", async ({
    assert,
  }) => {
    const { body } = await supertest(BASE_URL)
      .post("/groups")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(422);

    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 422);
  });

  test("It should update a group", async ({ assert }) => {
    const master = await UserFactory.create();
    const group = await GroupFactory.merge({ master: master.id }).create();

    const payload = {
      name: "test",
      description: "test",
      schedule: "test",
      location: "test",
      chronic: "test",
    };

    const { body } = await supertest(BASE_URL)
      .patch(`/groups/${group.id}`)
      .send(payload)
      .expect(200);

    assert.exists(body.group, "Group undefined");
    assert.equal(body.group.name, payload.name);
    assert.equal(body.group.description, payload.description);
    assert.equal(body.group.schedule, payload.schedule);
    assert.equal(body.group.location, payload.location);
    assert.equal(body.group.chronic, payload.chronic);
  });

  // eslint-disable-next-line max-len
  test("It should return 404 when providing an unexisting group for update", async ({
    assert,
  }) => {
    const response = await supertest(BASE_URL)
      .patch("/groups/1")
      .send({})
      .expect(404);

    assert.equal(response.body.code, "BAD_REQUEST");
    assert.equal(response.body.status, 404);
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
