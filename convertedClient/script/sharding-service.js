import di from "../di.js";

export default class ShardingService {
  constructor(
    sharedDoc,
    persistence,
    provider,
    annuaireService,
    module,
    sessionStorageUserService,
    peerjsService,
  ) {
    this.sharedDoc = sharedDoc;
    this.persistence = persistence;
    this.provider = provider;
    this.annuaireService = annuaireService;
    this.module = module;
    this.sessionStorageUserService = sessionStorageUserService;
    this.peerjsService = peerjsService;
    console.log("ShardingService initialized");
    this.provider.awareness.on("change", this.handleAwarenessChange);
  }

  handleAwarenessChange = async ({ added, updated, removed }) => {
    const states = this.provider.awareness.getStates();
    console.log("Awareness change detected", states);

    for (const clientID of added) {
      const clientState = states.get(clientID);
      console.log("Client added with state", clientState);
      if (clientState?.user != undefined) {
        this.annuaireService.communicateListOfUsers();
        this.annuaireService.addLoggedUser(
          clientState.user.userId,
          clientState.user.username,
          clientState.user.clientId,
        );
      }

      if (clientState?.annuaire != undefined) {
        const users = clientState.annuaire.users;
        users.forEach((user) => {
          this.annuaireService.addLoggedUser(
            user.userId,
            user.username,
            user.clientId,
          );
        });
      }

      if (clientState?.friend_request != undefined) {
        const myUserId = this.sessionStorageUserService.getLoggedUser().userid;

        if (clientState.friend_request.targeted_user_id == String(myUserId)) {
          console.log(
            "Received friend request from ",
            clientState.friend_request.source_username,
          );
          console.log(
            "Creating follow without sending friend request",
            clientState.friend_request.targeted_user_id,
            clientState.friend_request.targeted_user_name,
          );

          di.socialGraphHandler.SaveFollowWithoutSendingFriendRequest(
            clientState.friend_request.source_user_id,
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

      if (clientState?.establish_peer_js_connection != undefined) {
        const myUserId = this.sessionStorageUserService.getLoggedUser().userid;
        if (
          clientState.establish_peer_js_connection.targeted_user_id ==
          String(myUserId)
        ) {
          return;
        }
        const peerId =
          [myUserId, clientState.establish_peer_js_connection.source_user_id]
            .sort()
            .join("-") + "peer-connection";
        console.log("Establishing peer js connection with peer id ", peerId);
        this.peerjsService.connectToPeer(peerId);
      }
    }

    for (const clientID of updated) {
      const clientState = states.get(clientID);
      console.log("Client updated with state", clientState);

      if (clientState?.establish_peer_js_connection != undefined) {
        const myUserId = this.sessionStorageUserService.getLoggedUser().userid;
        if (
          clientState.establish_peer_js_connection.targeted_user_id ==
          String(myUserId)
        ) {
          return;
        }
        const peerId =
          [myUserId, clientState.establish_peer_js_connection.source_user_id]
            .sort()
            .join("-") + "peer-connection";
        console.log("Establishing peer js connection with peer id ", peerId);
        this.peerjsService.connectToPeer(peerId);
      }
      if (clientState?.user != undefined) {
        this.annuaireService.communicateListOfUsers();
        this.annuaireService.addLoggedUser(
          clientState.user.userId,
          clientState.user.username,
          clientState.user.clientId,
        );
      }

      if (clientState?.annuaire != undefined) {
        const users = clientState.annuaire.users;
        users.forEach((user) => {
          this.annuaireService.addLoggedUser(
            user.userId,
            user.username,
            user.clientId,
          );
        });
      }
      if (clientState?.friend_request != undefined) {
        const myUserId = this.sessionStorageUserService.getLoggedUser().userid;
        if (clientState.friend_request.targeted_user_id == String(myUserId)) {
          console.log(
            "Received friend request from ",
            clientState.friend_request.source_username,
          );
          console.log(
            "Creating follow without sending friend request",
            clientState.friend_request.targeted_user_id,
            clientState.friend_request.targeted_user_name,
          );
          di.socialGraphHandler.SaveFollowWithoutSendingFriendRequest(
            clientState.friend_request.source_user_id,
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
