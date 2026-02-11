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
import { sendFriendRequest, createYdocAndRoom } from "./script/utils.js";
import { sharedRoomName, personnalRoomName } from "./script/consts";

await persistence.whenSynced;

var module = await Module();

// sert à rendre disponible globalement dans le module emscripten
module.sharedDoc = sharedDoc;
module.mainPersistence = persistence;
module.mainProvider = provider;
module.personnalDoc = personnalDoc;
module.personnalPersistence = personnalPersistence;
module.sendFriendRequest = sendFriendRequest;
module.createYdocAndRoom = createYdocAndRoom;

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

// TODO => tout regrouper dans un promise.all
const uniqueIdHandler = await new module.UniqueIdHandler("abc");
const mediaHandler = await new module.MediaHandler();
const sessionStorageUserService = await new module.SessionStorageUserService();
const socialGraphHandler = await new module.SocialGraphHandler(
  sessionStorageUserService,
);

// FIX: Restore Social Graph in C++ memory from IndexedDB
// The C++ constructor only restores Yjs rooms but doesn't populate the in-memory graph.
let loggedUser = null;
try {
  loggedUser = sessionStorageUserService.getLoggedUser();
} catch (e) {
  // No user logged in, skip restoration
}

if (loggedUser) {
    try {
        const db = await new Promise((resolve, reject) => {
            const req = indexedDB.open("store", 2);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        if (db.objectStoreNames.contains("friends")) {
            const friends = await new Promise((resolve, reject) => {
                const tx = db.transaction("friends", "readonly");
                const store = tx.objectStore("friends");
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });

            console.log(`[di.js] Restoring ${friends.length} friends to SocialGraphHandler...`);
            
            // Ensure logged user is in the graph
            socialGraphHandler.InsertUser(loggedUser.userid, loggedUser.username);

            for (const friend of friends) {
                // Ensure friend is in the graph
                socialGraphHandler.InsertUser(friend.friend_id, friend.friend_username);
                // Establish follow relationship
                socialGraphHandler.Follow(loggedUser.userid, friend.friend_id);
            }
        }
    } catch (e) {
        console.error("[di.js] Failed to restore social graph from IndexedDB:", e);
    }
}

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
const shardingService = new ShardingService(
  sharedDoc,
  persistence,
  provider,
  annuaireService,
  module,
  sessionStorageUserService,
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
};

export default di;
