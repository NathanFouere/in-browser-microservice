import di from "../di.js";
import { dbSyncTypeMsg } from "./consts.js";

const loggedUser = di.sessionStorageUserService.getLoggedUser();
function followHandler(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const follweeeName = formData.get("followee_name");
  const username = formData.get("user_name");

  window.location.href = "./contact.html";
  di.socialGraphHandler.FollowWithUsername(username, follweeeName);
}

async function fillLoggedUser() {
  const annuaireService = di.annuaireService;
  const users = annuaireService.getListOfUsers();

  const annuaireBlock = document.getElementById("annuaire-block");
  const userTemplate = document.getElementById("logged-user-template");

  if (!annuaireBlock || !userTemplate) return;

  // clear
  annuaireBlock.innerHTML = "";

  for (const user of users) {
    if (user.userId == loggedUser.userid) {
      continue;
    }
    const clone = userTemplate.cloneNode(true);
    clone.style.display = "block";
    const usernameSpan = clone.querySelector(".username-span");
    if (usernameSpan) {
      usernameSpan.innerText = user.username;
    }

    const btn = clone.querySelector(".log-user-btn");
    if (btn) {
      const isFollowing = await di.socialGraphHandler.GetIsFollowing(
        String(user.userId),
      );

      if (isFollowing) {
        btn.textContent = "Following";
      }

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onFollowLoggedUserButtonClick(user.userId, user.username, isFollowing);
      });
    }

    const synchroniseBtn = clone.querySelector(".synchronize-db-user-btn");
    if (synchroniseBtn) {
      synchroniseBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        console.log("Synchronizing with user", user.username);
        await di.module.createPeerJsConnection(
          loggedUser.userid,
          user.userId,
          dbSyncTypeMsg,
        );
      });
    }

    annuaireBlock.appendChild(clone);
  }
}

function onFollowLoggedUserButtonClick(userId, username, isFollowing) {
  const userIdStr = String(userId);
  const usernameStr = String(username);

  if (isFollowing) {
    di.socialGraphHandler.Unfollow(userIdStr);
  } else {
    di.socialGraphHandler.SaveFollow(userIdStr, usernameStr);
  }
}

document.querySelectorAll(".follow-form").forEach((f) => {
  f.addEventListener("submit", followHandler);
});

fillLoggedUser();
