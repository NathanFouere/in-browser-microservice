import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import di from "../di.js";
import { signalingServerIp } from "./consts";

function sendFriendRequest(
  cur_user_name,
  cur_user_id,
  follow_id,
  follow_username,
) {
  const newDoc = new Y.Doc();
  const roomId = cur_user_id + "-" + follow_id;
  const provider = new WebrtcProvider(roomId, newDoc, {
    signaling: ["ws://" + signalingServerIp + ":4444"],
  });

  const persistence = new IndexeddbPersistence(roomId, newDoc);

  provider.awareness.setLocalStateField("user", {
    username: cur_user_name.toString(),
    userId: cur_user_id.toString(),
    clientId: newDoc.clientID, // cf . https://docs.yjs.dev/api/about-awareness "The clientID is usually the ydoc.clientID."
  });

  di.module.mainProvider.awareness.setLocalStateField("friend_request", {
    targeted_user_id: follow_id,
    targeted_user_name: follow_username.toString(),
    source_username: cur_user_name.toString(),
    source_user_id: cur_user_id.toString(),
    roomId: roomId,
  });
}

function createYdocAndRoom(roomId, cur_username, cur_user_id, userId) {
  const newDoc = new Y.Doc();
  const provider = new WebrtcProvider(roomId, newDoc, {
    signaling: ["ws://" + signalingServerIp + ":4444"],
  });

  const persistence = new IndexeddbPersistence(roomId, newDoc);

  provider.awareness.setLocalStateField("user", {
    username: cur_username,
    userId: cur_user_id.toString(),
    clientId: newDoc.clientID, // cf . https://docs.yjs.dev/api/about-awareness "The clientID is usually the ydoc.clientID."
  });

  di.module.connections[userId] = {
    doc: newDoc,
    provider: provider,
    persistence: persistence,
  };
}

export { sendFriendRequest, createYdocAndRoom };
