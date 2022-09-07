import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class SessionsController {
  public async store({ request, response }: HttpContextContract) {
    const {email, password} = request.only(["email", "password"]);

    

    return response.created({});
  }
}
