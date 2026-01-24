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
    clone.classList.remove("d-none");

    const usernameSpan = clone.querySelector(".username-span");
    if (usernameSpan) {
      usernameSpan.innerText = user.username;
    }

    annuaireBlock.appendChild(clone);
  }
}

document.querySelectorAll(".follow-form").forEach((f) => {
  f.addEventListener("submit", followHandler);
});

fillLoggedUser();
