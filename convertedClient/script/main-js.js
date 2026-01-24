import di from "../di.js";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";

function followHandler(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const follweeeName = formData.get("followee_name");
  const username = formData.get("user_name");

  window.location.href = "./contact.html";
  di.socialGraphHandler.FollowWithUsername(username, follweeeName);
}

function createYdocAndRoom(username, userId) {
  const newDoc = new Y.Doc();
  const signalingServerIp = "192.168.1.18"; // TODO => il faut le définir à chaque fois !

  const provider = new WebrtcProvider(userId.toString(), newDoc, {
    signaling: ["ws://" + signalingServerIp + ":4444"],
  });

  const persistence = new IndexeddbPersistence(userId.toString(), newDoc);

  provider.awareness.setLocalStateField("user", {
    username: username,
    userId: userId.toString(),
    clientId: newDoc.clientID, // cf . https://docs.yjs.dev/api/about-awareness "The clientID is usually the ydoc.clientID."
  });

  if (di.module.connections == undefined) {
    di.module.connections = {};
  }
  di.module.connections[userId] = {
    doc: newDoc,
    provider: provider,
    persistence: persistence,
  };
}

const button = document.getElementById("synchro");

button.addEventListener("click", (event) => {
  const loggedUser = di.sessionStorageUserService.getLoggedUser();
  console.log("logged user :", loggedUser.userid);
  createYdocAndRoom(loggedUser.username, loggedUser.userid);
});

function fillLoggedUser() {
  const annuaireService = di.annuaireService;
  const users = annuaireService.getListOfUsers();

  console.log("users in annuaire :", users);

  const annuaireBlock = document.getElementById("annuaire-block");
  const userTemplate = document.getElementById("logged-user-template");

  if (!annuaireBlock || !userTemplate) return;

  // clear
  annuaireBlock.innerHTML = "";

  for (const user of users) {
    const clone = userTemplate.cloneNode(true);
    clone.style.display = "block";
    const usernameSpan = clone.querySelector(".username-span");
    if (usernameSpan) {
      usernameSpan.innerText = user.username;
    }

    const btn = clone.querySelector(".log-user-btn");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onFollowLoggedUserButtonClick(user.userId);
      });
    }
    annuaireBlock.appendChild(clone);
  }
}

function onFollowLoggedUserButtonClick(userId) {
  console.log("Clicked user id :", userId);
  const userIdStr = String(userId);
  const socialGraphHandler = di.socialGraphHandler;
  socialGraphHandler.SaveFollow(userIdStr);
}

document.querySelectorAll(".follow-form").forEach((f) => {
  f.addEventListener("submit", followHandler);
});

fillLoggedUser();
