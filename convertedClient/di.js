import Module from "./wasm/convertedMicroServices.js";
import {
  sharedDoc,
  persistence,
  provider,
  personnalDoc,
  personnalPersistence,
} from "./script/yjs-default.js";
import ShardingService from "./script/sharding-service.js";
import AnnuaireService from "./script/annuaire-service.js";
import SynchronizeDbService from "./script/synchronize-db-service.js";
import {
  sendFriendRequest,
  createYdocAndRoom,
  showTimeline,
  createPeerJsConnection,
} from "./script/utils.js";
import { sharedRoomName, personnalRoomName } from "./script/consts";
import PeerjsService from "./script/peerjs-service.js";

var module = await Module();

// sert à rendre disponible globalement dans le module emscripten
module.sharedDoc = sharedDoc;
module.mainPersistence = persistence;
module.mainProvider = provider;
module.personnalDoc = personnalDoc;
module.personnalPersistence = personnalPersistence;
module.sendFriendRequest = sendFriendRequest;
module.createYdocAndRoom = createYdocAndRoom;
module.createPeerJsConnection = createPeerJsConnection;

module.connections = {};
module.connections[sharedRoomName] = {
  doc: sharedDoc,
  provider: provider,
  persistence: persistence,
  is_main: true,
  is_personal: false,
};
module.connections[personnalRoomName] = {
  doc: personnalDoc,
  persistence: personnalPersistence,
  is_main: false,
  is_personal: true,
};
module.showTimeline = showTimeline;

const uniqueIdHandler = await new module.UniqueIdHandler("abc");
const mediaHandler = await new module.MediaHandler();
const sessionStorageUserService = await new module.SessionStorageUserService();
const socialGraphHandler = await new module.SocialGraphHandler(
  sessionStorageUserService,
);
const userHandler = await new module.UserHandler(
  socialGraphHandler,
  uniqueIdHandler,
  sessionStorageUserService,
);
const postStorageHandler = await new module.PostStorageHandler();
const userMentionHandler = await new module.UserMentionHandler();
const textHandler = await new module.TextHandler(userMentionHandler);
const userTimelineHandler = await new module.UserTimelineHandler(
  postStorageHandler,
);
const homeTimelineHandler = await new module.HomeTimelineHandler(
  postStorageHandler,
  socialGraphHandler,
);
const composePostHandler = await new module.ComposePostHandler(
  userTimelineHandler,
  userHandler,
  uniqueIdHandler,
  mediaHandler,
  textHandler,
  homeTimelineHandler,
  postStorageHandler,
);
const annuaireService = new AnnuaireService(sharedDoc.clientID, provider);

const loggedUser = sessionStorageUserService.getNullableLoggedUser();
let peerjsService = null;
if (loggedUser) {
  peerjsService = new PeerjsService(Number(loggedUser.userid));
  module.peerjsService = peerjsService;
}
const synchronizeDbService = new SynchronizeDbService(peerjsService);
let shardingService = new ShardingService(
  sharedDoc,
  persistence,
  provider,
  annuaireService,
  module,
  sessionStorageUserService,
  peerjsService,
);

const di = {
  uniqueIdHandler: uniqueIdHandler,
  mediaHandler: mediaHandler,
  socialGraphHandler: socialGraphHandler,
  userHandler: userHandler,
  postStorageHandler: postStorageHandler,
  userMentionHandler: userMentionHandler,
  textHandler: textHandler,
  userTimelineHandler: userTimelineHandler,
  composePostHandler: composePostHandler,
  homeTimelineHandler: homeTimelineHandler,
  sessionStorageUserService: sessionStorageUserService,
  sharedDoc: sharedDoc,
  shardingService: shardingService,
  annuaireService: annuaireService,
  module: module,
  personnalDoc: personnalDoc,
  peerjsService: peerjsService,
  synchronizeDbService: synchronizeDbService,
};

export default di;
