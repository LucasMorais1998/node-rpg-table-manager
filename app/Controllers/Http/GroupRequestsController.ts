import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import GroupRequest from "App/Models/GroupRequest";

export default class GroupRequestsController {
  public async store({ request, response, auth }: HttpContextContract) {
    const groupId = request.param("groupId") as number;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const userId = auth.user!.id;

    const groupRequest = await GroupRequest.create({ groupId, userId });
    await groupRequest.refresh();

    return response.created({ groupRequest });
  }
}
