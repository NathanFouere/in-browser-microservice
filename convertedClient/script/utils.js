import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import di from "../di.js";

import { signalingServerIp } from "./consts";
async function sendFriendRequest(
  cur_user_name,
  cur_user_id,
  follow_id,
  follow_username,
) {
  const newDoc = new Y.Doc();

  // Permet d'avoir un roomId unique pour chaque paire d'utilisateurs
  console.log(
    "Creating room for friendId",
    follow_id,
    "and current userId",
    cur_user_id,
    "in utils",
  );
  const roomId = [cur_user_id, follow_id].sort().join("-");

  // créer la persistence et attend sa syncrhonisation
  const persistence = new IndexeddbPersistence(roomId, newDoc);

  await persistence.whenSynced.then(() => {
    console.log(`IndexedDB synced for room ${roomId}`);
  });

  const provider = new WebrtcProvider(roomId, newDoc, {
    signaling: [signalingServerIp],
  });

  provider.awareness.setLocalStateField("user", {
    username: cur_user_name.toString(),
    userId: cur_user_id.toString(),
    clientId: newDoc.clientID,
  });

  di.module.connections[follow_id] = {
    doc: newDoc,
    provider: provider,
    persistence: persistence,
  };

  propagatePosts(newDoc, di.personnalDoc);

  di.module.mainProvider.awareness.setLocalStateField("friend_request", {
    targeted_user_id: follow_id,
    targeted_user_name: follow_username.toString(),
    source_username: cur_user_name.toString(),
    source_user_id: cur_user_id.toString(),
    roomId: roomId,
  });
}

function propagatePosts(newDoc, personnalDoc) {
  const postsArray = newDoc.getArray("posts");
  const personnalDocPostsArray = personnalDoc.getArray("posts");

  postsArray.push(personnalDocPostsArray.toArray());
  console.log("Propagated posts to personnalDoc");
  console.log(personnalDocPostsArray.toArray());
  console.log(postsArray.toArray());
}

async function createYdocAndRoom(
  roomId,
  cur_username,
  cur_user_id,
  userId,
  module,
) {
  const newDoc = new Y.Doc();
  const persistence = new IndexeddbPersistence(roomId, newDoc);

  await persistence.whenSynced.then(() => {
    console.log(`IndexedDB synced for room ${roomId}`);
  });

  const provider = new WebrtcProvider(roomId, newDoc, {
    signaling: [signalingServerIp],
  });

  provider.awareness.setLocalStateField("user", {
    username: cur_username,
    userId: cur_user_id.toString(),
    clientId: newDoc.clientID,
  });

  const postsArray = newDoc.getArray("posts");
  postsArray.observe((event) => {
    if (event.transaction.origin !== null) {
        console.log("Ajout d'un post distant");
        
        // Extract added posts to pass to event
        // We only care if there are additions
         const addedPosts = [];
         event.changes.added.forEach(item => {
             item.content.getContent().forEach(content => {
                 addedPosts.push(content);
             });
         });

         if (addedPosts.length > 0) {
             window.dispatchEvent(new CustomEvent("remote-post-received", { 
                 detail: { 
                     posts: addedPosts,
                     roomId: roomId,
                     userId: userId
                 } 
             }));
         }

        newDoc.transact(() => {});
    }
  });
  module.connections[userId] = {
    doc: newDoc,
    provider: provider,
    persistence: persistence,
  };

  console.log("Created new Y.Doc and room for userId:", userId);
}

export { sendFriendRequest, createYdocAndRoom };
