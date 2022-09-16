import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import { UserFactory } from "Database/factories";
import supertest from "supertest";
import { GroupFactory } from "./../../../database/factories/index";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("Group Requset", (group) => {
  test("It should create a group request", async ({ assert }) => {
    const user = await UserFactory.create();
    const group = await GroupFactory.merge({ master: user.id }).create();

    const { body } = await supertest(BASE_URL)
      .post(`/groups/${group.id}/requests`)
      .send({})
      .expect(201);

    assert.exists(body.groupRequest, "GroupRequest undefined");
    assert.equal(body.groupRequest.userId, user.id);
    assert.equal(body.groupRequest.groupId, group.id);
    assert.equal(body.groupRequest.status, "PENDING");
  });

  group.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });
});
