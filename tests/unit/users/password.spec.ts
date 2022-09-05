import Mail from "@ioc:Adonis/Addons/Mail";
import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import { UserFactory } from "Database/factories";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("Password", (group) => {
  test("It should send an email with forgot password instructions", async ({
    assert,
  }) => {
    const user = await UserFactory.create();

    const mailer = Mail.fake();

    await supertest(BASE_URL)
      .post("/forgot-password")
      .send({
        email: user.email,
        resetPasswordUrl: "url",
      })
      .expect(204);

    const message = mailer.find((mail) => {
      return mail.to?.[0].address === user.email;
    });

    assert.deepEqual(message?.to, [
      {
        address: user.email,
        name: "",
      },
    ]);

    assert.deepEqual(message?.from, {
      address: "no-reply@roleplay.com",
      name: "",
    });

    assert.equal(message?.subject, "Roleplay: Recuperação de Senha");

    assert.include(message?.html, user.username);

    Mail.restore();
  });

  test("It should create a reset password token", async ({ assert }) => {
    const user = await UserFactory.create();

    await supertest(BASE_URL)
      .post("/forgot-password")
      .send({
        email: user.email,
        resetPassword: "url",
      })
      .expect(204);

    const tokens = await user.related("tokens").query();

    assert.isNotEmpty(tokens);
  });

  // eslint-disable-next-line max-len
  test("It should return 422 when required data is not provided or date is invalid", async ({
    assert,
  }) => {
    const { body } = await supertest(BASE_URL)
      .post("/forgot-password")
      .send({})
      .expect(422);

    assert.equal(body.code, "BAD_REQUEST");
    assert.equal(body.status, 422);
  });

  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });
});
