import di from "../di.js";
import { createPeerJsConnection } from "./utils.js";
export default class ShardingService {
  constructor(
    sharedDoc,
    persistence,
    provider,
    annuaireService,
    module,
    sessionStorageUserService,
    peerjsService,
    peerJsSenderService,
  ) {
    this.sharedDoc = sharedDoc;
    this.persistence = persistence;
    this.provider = provider;
    this.annuaireService = annuaireService;
    this.module = module;
    this.sessionStorageUserService = sessionStorageUserService;
    this.peerjsService = peerjsService;
    this.peerJsSenderService = peerJsSenderService;
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
        console.log("received establish_peer_js_connection");
        if (
          this.peerjsService.activePeerJsConnections[
            clientState.establish_peer_js_connection.source_user_id
          ]
        ) {
          console.log(
            "active peer js connection for ",
            clientState.establish_peer_js_connection.source_user_id,
            " already exists",
          );
          return;
        }
        const myUserId = this.sessionStorageUserService.getLoggedUser().userid;
        if (
          clientState.establish_peer_js_connection.targeted_user_id !=
          String(myUserId)
        ) {
          return;
        }
        this.peerjsService.activePeerJsConnections[
          clientState.establish_peer_js_connection.source_user_id
        ] = true;
        this.peerjsService.activePeerJsConnections[
          clientState.establish_peer_js_connection.targeted_user_id
        ] = true;
        console.log(
          "new active peer js connections is ",
          this.peerjsService.activePeerJsConnections,
        );
        const peerId = clientState.establish_peer_js_connection.source_user_id;
        console.log("Establishing peer js connection with peer id ", peerId);
        this.peerjsService.connectToPeer(peerId);
        console.log(
          "send message from sharding service : ",
          clientState.establish_peer_js_connection.sync_type_msg,
        );
        await createPeerJsConnection(
          clientState.establish_peer_js_connection.targeted_user_id,
          clientState.establish_peer_js_connection.source_user_id,
          clientState.establish_peer_js_connection.sync_type_msg,
        );
        console.log(
          "send message from sharding service : ",
          clientState.establish_peer_js_connection.sync_type_msg,
        );
        this.peerJsSenderService.sendMessage(
          clientState.establish_peer_js_connection.sync_type_msg,
        );
      }
    }

    for (const clientID of updated) {
      const clientState = states.get(clientID);
      console.log("Client updated with state", clientState);

      if (clientState?.establish_peer_js_connection != undefined) {
        console.log("received establish_peer_js_connection");
        if (
          this.peerjsService.activePeerJsConnections[
            clientState.establish_peer_js_connection.source_user_id
          ]
        ) {
          console.log(
            "active peer js connection for ",
            clientState.establish_peer_js_connection.source_user_id,
            " already exists",
          );
          return;
        }

        const myUserId = this.sessionStorageUserService.getLoggedUser().userid;
        if (
          clientState.establish_peer_js_connection.targeted_user_id !=
          String(myUserId)
        ) {
          return;
        }
        const peerId = clientState.establish_peer_js_connection.source_user_id;
        this.peerjsService.activePeerJsConnections[
          clientState.establish_peer_js_connection.source_user_id
        ] = true;
        this.peerjsService.activePeerJsConnections[
          clientState.establish_peer_js_connection.targeted_user_id
        ] = true;
        console.log(
          "new active peer js connections is ",
          this.peerjsService.activePeerJsConnections,
        );
        console.log("Establishing peer js connection with peer id ", peerId);
        this.peerjsService.connectToPeer(peerId);
        await createPeerJsConnection(
          clientState.establish_peer_js_connection.targeted_user_id,
          clientState.establish_peer_js_connection.source_user_id,
          clientState.establish_peer_js_connection.sync_type_msg,
        );
        console.log(
          "send message from sharding service : ",
          clientState.establish_peer_js_connection.sync_type_msg,
        );
        this.peerJsSenderService.sendMessage(
          clientState.establish_peer_js_connection.sync_type_msg,
        );
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
