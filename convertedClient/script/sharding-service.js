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

    for (const clientID of added) {
      const clientState = states.get(clientID);

      if (clientState?.user != undefined) {
        this.annuaireService.addLoggedUser(
          clientState.user.userId,
          clientState.user.username,
          clientState.user.clientId,
        );
      }

      if (clientState?.friend_request != undefined) {
        const myUserId = this.sessionStorageUserService.getLoggedUser().userid;

        if (clientState.friend_request.targeted_user_id == String(myUserId)) {
          console.log(
            "Received friend request from ",
            clientState.friend_request.source_username,
          );
          // ATTENDRE la création du document
          await this.module.createYdocAndRoom(
            clientState.friend_request.roomId,
            clientState.friend_request.targeted_user_name,
            clientState.friend_request.targeted_user_id,
            clientState.friend_request.source_user_id,
            this.module,
          );
        }
      }
    }

    // Même chose pour updated
    for (const clientID of updated) {
      const clientState = states.get(clientID);

      if (clientState?.user != undefined) {
        this.annuaireService.addLoggedUser(
          clientState.user.userId,
          clientState.user.username,
          clientState.user.clientId,
        );
      }

      if (clientState?.friend_request != undefined) {
        const myUserId = this.sessionStorageUserService.getLoggedUser().userid;
        if (clientState.friend_request.targeted_user_id == String(myUserId)) {
          console.log(
            "Received friend request from ",
            clientState.friend_request.source_username,
          );
          await this.module.createYdocAndRoom(
            clientState.friend_request.roomId,
            clientState.friend_request.targeted_user_name,
            clientState.friend_request.targeted_user_id,
            clientState.friend_request.source_user_id,
            this.module,
          );
        }
      }
    }

    removed.forEach((clientID) => {
      const clientState = states.get(clientID);
      if (clientState?.user != undefined) {
        this.annuaireService.removeLoggedUser(clientState.user.userId);
      }
    });
  };
}
