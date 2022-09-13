import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import { UserFactory } from "Database/factories";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("Group", (group) => {
  test("It should create a group", async ({ assert }) => {
    const user = await UserFactory.create();

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
      .send(groupPayload)
      .expect(201);

    assert.exists(body.group, "Group undefined");
    assert.equal(body.group.name, groupPayload.name);
    assert.equal(body.group.description, groupPayload.description);
    assert.equal(body.group.schedule, groupPayload.schedule);
    assert.equal(body.group.location, groupPayload.location);
    assert.equal(body.group.chronic, groupPayload.chronic);
    assert.equal(body.group.master, groupPayload.master);
  });

  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });
});