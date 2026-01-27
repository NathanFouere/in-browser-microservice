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

const button = document.getElementById("synchro");

button.addEventListener("click", (event) => {
  di.postStorageHandler.ShowPostsPresence();
});

function fillLoggedUser() {
  const annuaireService = di.annuaireService;
  const users = annuaireService.getListOfUsers();

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
        onFollowLoggedUserButtonClick(user.userId, user.username);
      });
    }
    annuaireBlock.appendChild(clone);
  }
}

function onFollowLoggedUserButtonClick(userId, username) {
  const userIdStr = String(userId);
  const usernameStr = String(username);
  di.socialGraphHandler.SaveFollow(userIdStr, usernameStr);
}

document.querySelectorAll(".follow-form").forEach((f) => {
  f.addEventListener("submit", followHandler);
});

fillLoggedUser();
