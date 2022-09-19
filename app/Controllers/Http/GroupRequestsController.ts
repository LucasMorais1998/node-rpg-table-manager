import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import BadRequest from "App/Exceptions/BadRequestException";
import Group from "App/Models/Group";
import GroupRequest from "App/Models/GroupRequest";

export default class GroupRequestsController {
  public async index({ request, response }: HttpContextContract) {
    const { master } = request.qs();

    const groupRequests = await GroupRequest.query()
      .preload("group")
      .preload("user")
      .whereHas("group", (query) => {
        query.where("master", Number(master));
      })
      .where("status", "PENDING");

    return response.ok({ groupRequests });
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const groupId = request.param("groupId") as number;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const userId = auth.user!.id;

    const existingGroupRequest = await GroupRequest.query()
      .where("groupId", groupId)
      .andWhere("userId", userId)
      .first();

    if (existingGroupRequest)
      throw new BadRequest("group request already exists", 409);

    const userAlreadyInGroup = await Group.query()
      .whereHas("players", (query) => {
        query.where("id", userId);
      })
      .andWhere("id", groupId)
      .first();

    if (userAlreadyInGroup)
      throw new BadRequest("user is already in the group", 422);

    const groupRequest = await GroupRequest.create({ groupId, userId });
    await groupRequest.refresh();

    return response.created({ groupRequest });
  }
}
