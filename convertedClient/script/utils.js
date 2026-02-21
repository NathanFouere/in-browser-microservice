import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import di from "../di.js";
import { dbSyncTypeMsg } from "./consts";
import { signalingServerIp } from "./consts";

async function createPeerJsConnection(
  cur_user_id,
  target_user_id,
  sync_type_msg,
) {
  console.log(
    "Create peer js connection with cur_user_id ",
    cur_user_id,
    "and target_user_id",
    target_user_id,
  );
  console.log("Peer id for connection is ", cur_user_id);

  di.module.mainProvider.awareness.setLocalStateField(
    "establish_peer_js_connection",
    {
      targeted_user_id: target_user_id,
      source_user_id: cur_user_id.toString(),
      sync_type_msg: sync_type_msg,
    },
  );

  return new Promise((resolve, reject) => {
    let currentNumberOfCalls = 0;
    const maxNumberOfCalls = 10;

    const timer = setInterval(() => {
      const isConnectionEstablished =
        di.peerjsService.activePeerJsConnections[target_user_id] === true;

      if (isConnectionEstablished) {
        clearInterval(timer);

        di.module.mainProvider.awareness.setLocalStateField(
          "establish_peer_js_connection",
          null,
        );

        resolve(); //resolve promise
        return;
      }

      currentNumberOfCalls++;

      if (currentNumberOfCalls >= maxNumberOfCalls) {
        clearInterval(timer);
        const errorMessage =
          "Number of calls for createPeerJsConnection exceeded";
        console.error(errorMessage);
        reject(new Error(errorMessage)); // end promise with error
      }
    }, 2000);
  });
}

async function sendFriendRequest(
  cur_user_name,
  cur_user_id,
  follow_id,
  follow_username,
) {
  // Permet d'avoir un roomId unique pour chaque paire d'utilisateurs
  console.log(
    "Creating room for friendId",
    follow_id,
    "and current userId",
    cur_user_id,
    "in utils",
  );
  const roomId = [cur_user_id, follow_id].sort().join("-");

  // check si la connection existe dejà
  if (di.module.connections[follow_id]) {
    console.log(
      `Connection for user ${follow_id} already exists, skipping creation`,
    );

    return;
  }

  const newDoc = new Y.Doc();

  // créer la persistence et attend sa syncrhonisation
  const persistence = new IndexeddbPersistence(roomId, newDoc);

  await persistence.whenSynced.then(() => {
    console.log(`IndexedDB synced for room ${roomId}`);
  });

  let provider;
  try {
    provider = new WebrtcProvider(roomId, newDoc, {
      signaling: [signalingServerIp],
    });
  } catch (error) {
    if (di.module.connections[follow_id]) {
      provider = di.module.connections[follow_id].provider;
    } else {
      throw error;
    }
  }

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
  // check si la connection existe dejà
  if (module.connections[userId]) {
    console.log(
      `Connection for user ${userId} already exists, skipping creation`,
    );
    return;
  }

  const newDoc = new Y.Doc();
  const persistence = new IndexeddbPersistence(roomId, newDoc);

  await persistence.whenSynced.then(() => {
    console.log(`IndexedDB synced for room ${roomId}`);
  });

  let provider;
  try {
    provider = new WebrtcProvider(roomId, newDoc, {
      signaling: [signalingServerIp],
    });
  } catch (error) {
    if (module.connections[userId]) {
      provider = module.connections[userId].provider;
    } else {
      throw error;
    }
  }

  provider.awareness.setLocalStateField("user", {
    username: cur_username,
    userId: cur_user_id.toString(),
    clientId: newDoc.clientID,
  });

  const postsArray = newDoc.getArray("posts");
  postsArray.observe((event) => {
    if (event.transaction.origin !== null) {
      console.log("Ajout d'un post distant");

      window.location.reload();
    }
  });
  module.connections[userId] = {
    doc: newDoc,
    provider: provider,
    persistence: persistence,
  };

  console.log("Created new Y.Doc and room for userId:", userId);
}

export { sendFriendRequest, createYdocAndRoom, createPeerJsConnection };
