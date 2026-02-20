import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import di from "../di.js";

import { signalingServerIp } from "./consts";

function showTimeline(type) {
  const isOnIndexPage = window.location.pathname.endsWith("index.html");
  let postTemplate = null;

  if (isOnIndexPage) return;
  const loggedUser = di.sessionStorageUserService.getLoggedUser();

  if (type == "main") {
    const cardBlock = document.getElementById("card-block");
    if (!cardBlock) return;

    // Use cached template
    if (!postTemplate) return;

    const onlyFriendsToggle = document.getElementById("only-friends-toggle");
    const onlyFriends = onlyFriendsToggle ? onlyFriendsToggle.checked : false;

    // Fetch posts (synchronous for now based on current impl)
    const postsVector = di.homeTimelineHandler.ReadHomeTimeline(
      loggedUser.userid,
      0,
      10,
      onlyFriends,
    );

    const posts = [];
    for (let i = 0; i < postsVector.size(); i++) {
      posts.push(postsVector.get(i));
    }

    // Sort by timestamp based on toggle button
    const sortBtn = document.getElementById("sort-toggle-btn");
    const sortAsc = sortBtn
      ? sortBtn.getAttribute("data-sort") === "asc"
      : false;

    posts.sort((a, b) => {
      const valA = Number(a.timestamp);
      const valB = Number(b.timestamp);
      if (valA > valB) return sortAsc ? 1 : -1;
      if (valA < valB) return sortAsc ? -1 : 1;
      return 0;
    });

    // Clear current posts
    cardBlock.innerHTML = "";

    for (const p of posts) {
      const date = new Date(Number(p.timestamp) * 1000);

      const clone = postTemplate.cloneNode(true);
      clone.style.display = "block";

      // Fill data
      clone.querySelector(".post-text").innerText = p.text;
      clone.querySelector(".post-time").innerText = date.toString();

      const creatorEl = clone.querySelector(".post-creator");
      if (creatorEl) creatorEl.innerText = p.creator.username;

      // Hook buttons
      const deleteBtn = clone.querySelector(".delete-post-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          $("#deletePostModal").data("post-id", p.post_id).modal("show");
        });
      }

      const editBtn = clone.querySelector(".edit-post-btn");
      if (editBtn) {
        editBtn.addEventListener("click", () => {
          $("#editPostModal").data("post-id", p.post_id);
          const editPostTextarea = document.getElementById("editPostTextarea");
          editPostTextarea.value = p.text;
          $("#editPostModal").modal("show");
        });
      }

      cardBlock.appendChild(clone);
    }
  }
}

function createPeerJsConnection(cur_user_id, target_user_id) {
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
    },
  );
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
      if ((window.location.href = "main.html")) {
        showTimeline("user-timeline");
      }
    }
  });
  module.connections[userId] = {
    doc: newDoc,
    provider: provider,
    persistence: persistence,
  };

  console.log("Created new Y.Doc and room for userId:", userId);
}

export {
  sendFriendRequest,
  createYdocAndRoom,
  createPeerJsConnection,
  showTimeline,
};
