import di from "../di.js";

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

  // Get logged user info
  const loggedUser = di.sessionStorageUserService.getLoggedUser();
  const loggedUserId = loggedUser.userid;

  // Get list of users the logged user is following
  const followeesVector = di.socialGraphHandler.GetFollowees(loggedUserId);
  const followees = [];
  for (let i = 0; i < followeesVector.size(); i++) {
    followees.push(followeesVector.get(i));
  }

  // Clear existing users
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
      const isOwnUser = user.userId === loggedUserId;
      const isFollowing = followees.includes(user.userId);

      if (isOwnUser) {
        // Disable button for own user
        btn.disabled = true;
        btn.innerText = "You";
        btn.classList.remove("btn-primary", "btn-danger");
        btn.classList.add("btn-secondary");
      } else if (isFollowing) {
        // Already following - show Unfollow button
        btn.innerText = "Unfollow";
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-danger");
        btn.dataset.following = "true";
      } else {
        // Not following - show Follow button
        btn.innerText = "Follow";
        btn.classList.remove("btn-danger");
        btn.classList.add("btn-primary");
        btn.dataset.following = "false";
      }

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onFollowLoggedUserButtonClick(user.userId, user.username, btn);
      });
    }
    annuaireBlock.appendChild(clone);
  }
}

function onFollowLoggedUserButtonClick(userId, username, button) {
  const userIdStr = String(userId);
  const usernameStr = String(username);
  const isFollowing = button.dataset.following === "true";

  if (isFollowing) {
    // Unfollow the user
    di.socialGraphHandler.SaveUnfollow(userIdStr, usernameStr);
  } else {
    // Follow the user
    di.socialGraphHandler.SaveFollow(userIdStr, usernameStr);
  }

  // Note: Button will update on next page load/refresh
}

document.querySelectorAll(".follow-form").forEach((f) => {
  f.addEventListener("submit", followHandler);
});

fillLoggedUser();
