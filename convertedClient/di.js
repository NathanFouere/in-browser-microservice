import Module from "./wasm/convertedMicroServices.js";
import { ydoc, persistence, provider } from "./script/yjs.js";
import ShardingService from "./script/sharding-service.js";
import AnnuaireService from "./script/annuaire-service.js";

var module = await Module();

// sert à rendre ydoc disponible globalement dans le module emscripten
module.ydoc = ydoc;
module.persistence = persistence;
module.provider = provider;

// TODO => tout regrouper dans un promise.all
const uniqueIdHandler = await new module.UniqueIdHandler("abc");
const mediaHandler = await new module.MediaHandler();
const socialGraphHandler = await new module.SocialGraphHandler();
const sessionStorageUserService = await new module.SessionStorageUserService();
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
const annuaireService = new AnnuaireService();
const shardingService = new ShardingService(
  ydoc,
  persistence,
  provider,
  annuaireService,
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
  ydoc: ydoc,
  shardingService: shardingService,
  annuaireService: annuaireService,
  module: module,
};

export default di;
