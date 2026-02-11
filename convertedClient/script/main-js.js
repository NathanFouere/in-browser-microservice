import di from "../di.js";

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
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onFollowLoggedUserButtonClick(user.userId, user.username);
      });
    }

    const synchroniseBtn = clone.querySelector(".synchronize-db-user-btn");
    if (synchroniseBtn) {
      synchroniseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("Synchronizing with user", user.username);
        di.module.createPeerJsConnection(loggedUser.userid, user.userId);
        const postsDb = di.postStorageHandler.GetAllPosts();
        console.log(
          "user db of post is " +
            postsDb.get(0).post_id +
            postsDb.get(0).text +
            " length" +
            postsDb.size(),
        );

        di.peerjsService.sendMessage("j envoie un message");
        di.peerjsService.sendMessage(postsDb);
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
