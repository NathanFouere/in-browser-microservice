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
