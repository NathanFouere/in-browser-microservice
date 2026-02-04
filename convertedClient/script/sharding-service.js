import di from "../di.js";

export default class ShardingService {
  constructor(
    sharedDoc,
    persistence,
    provider,
    annuaireService,
    module,
    sessionStorageUserService,
  ) {
    this.sharedDoc = sharedDoc;
    this.persistence = persistence;
    this.provider = provider;
    this.annuaireService = annuaireService;
    this.module = module;
    this.sessionStorageUserService = sessionStorageUserService;

    this.provider.awareness.on("change", this.handleAwarenessChange);
  }

  handleAwarenessChange = async ({ added, updated, removed }) => {
    const states = this.provider.awareness.getStates();

    await this.processClientChanges(added, states);
    await this.processClientChanges(updated, states);
    this.processRemovedClients(removed, states);
  };

  async processClientChanges(clientIDs, states) {
    for (const clientID of clientIDs) {
      const clientState = states.get(clientID);
      if (!clientState) continue;

      this.handleUserState(clientState);
      this.handleAnnuaireState(clientState);
      await this.handleFriendRequest(clientState);
    }
  }

  handleUserState(clientState) {
    if (clientState.user) {
      this.annuaireService.communicateListOfUsers();
      this.annuaireService.addLoggedUser(
        clientState.user.userId,
        clientState.user.username,
        clientState.user.clientId,
      );
    }
  }

  handleAnnuaireState(clientState) {
    if (clientState.annuaire?.users) {
      clientState.annuaire.users.forEach((user) => {
        this.annuaireService.addLoggedUser(
          user.userId,
          user.username,
          user.clientId,
        );
      });
    }
  }

  async handleFriendRequest(clientState) {
    const friendRequest = clientState.friend_request;
    if (!friendRequest) return;

    const myUserId = this.sessionStorageUserService.getLoggedUser().userid;
    const isTargetedUser = friendRequest.targeted_user_id === String(myUserId);

    if (!isTargetedUser) return;

    console.log("Received friend request from", friendRequest.source_username);
    console.log(
      "Creating follow without sending friend request",
      friendRequest.targeted_user_id,
      friendRequest.targeted_user_name,
    );

    di.socialGraphHandler.SaveFollowWithoutSendingFriendRequest(
      friendRequest.source_user_id,
      friendRequest.source_username,
    );

    await this.module.createYdocAndRoom(
      friendRequest.roomId,
      friendRequest.targeted_user_name,
      friendRequest.targeted_user_id,
      friendRequest.source_user_id,
      this.module,
    );
  }

  processRemovedClients(clientIDs, states) {
    clientIDs.forEach((clientID) => {
      const clientState = states.get(clientID);
      if (clientState?.user) {
        this.annuaireService.removeLoggedUser(clientState.user.userId);
      }
    });
  }
}
