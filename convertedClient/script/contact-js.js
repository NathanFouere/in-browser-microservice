import di from "../di.js";
import ydoc from "./yjs.js";

// Récupère le tableau partagé 'social_graph' depuis le document Yjs.
const socialGraphArray = ydoc.getArray("social_graph");

/**
 * Fonction utilitaire pour créer un message d'état (vide, erreur, etc.)
 * remplace l'utilisation de innerHTML par du pur DOM.
 */
function displayStatusMessage(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.replaceChildren(); // Vide le container proprement

  const card = document.createElement("div");
  card.className = "card";
  const body = document.createElement("div");
  body.className = "card-body";
  body.textContent = message;

  card.appendChild(body);
  container.appendChild(card);
}

/**
 * Rendu d'une liste à partir d'un vecteur C++ (Wasm)
 */
function renderList(containerId, templateId, namesVector, emptyMessage) {
  const list = document.getElementById(containerId);
  const template = document.getElementById(templateId);
  if (!list || !template) return;

  list.replaceChildren();
  const size = namesVector.size();

  if (size === 0) {
    displayStatusMessage(containerId, emptyMessage);
  } else {
    for (let i = 0; i < size; i++) {
      const name = namesVector.get(i);
      const clone = template.content.cloneNode(true);
      const idEl = clone.querySelector(".follower-id, .followee-id, .friend-id");
      if (idEl) idEl.textContent = name;
      list.appendChild(clone);
    }
  }
}

/**
 * Met à jour l'interface utilisateur en utilisant les méthodes du SocialGraphHandler C++.
 */
function updateSocialGraphUI() {
  try {
    let username = null;
    try {
      const u = di.sessionStorageUserService.getLoggedUser();
      if (u) username = u.username;
    } catch (e) {
      const stored = sessionStorage.getItem("user");
      if (stored) {
        try { username = JSON.parse(stored).username || stored; } catch (err) { username = stored; }
      }
    }

    if (!username) {
      displayStatusMessage("follower-list", "Veuillez vous connecter pour voir vos contacts.");
      displayStatusMessage("followee-list", "Veuillez vous connecter pour voir vos contacts.");
      displayStatusMessage("friend-list", "Veuillez vous connecter pour voir vos contacts.");
      return;
    }

    // Synchronisation C++ depuis Yjs
    di.socialGraphHandler.ReloadGraph();

    // Récupération des données formatées depuis 
    const followers = di.socialGraphHandler.GetFollowerNames(username);
    const followees = di.socialGraphHandler.GetFolloweeNames(username);
    const friends = di.socialGraphHandler.GetFriendNames(username);

    // Rendu des listes
    renderList("follower-list", "follower-template", followers, "Vous n'avez aucun follower");
    renderList("followee-list", "followee-template", followees, "Vous ne suivez personne");
    renderList("friend-list", "friend-template", friends, "Vous n'avez aucun ami");

  } catch (e) {
    console.error("Erreur mise à jour Social Graph:", e);
  }
}

function showUsername() {
  let username = "";
  try {
    const u = di.sessionStorageUserService.getLoggedUser();
    if (u) username = u.username;
  } catch (e) { }

  if (!username) {
    const stored = sessionStorage.getItem("user");
    if (stored) {
      try { username = JSON.parse(stored).username || stored; } catch (e) { username = stored; }
    }
  }

  const el = document.getElementById("username");
  if (el) el.textContent = username;

  document.querySelectorAll(".follow-username").forEach(el => {
    el.value = username;
  });
}

/**
 * Gère le follow/unfollow 
 */
function followHandler(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget, event.submitter);

  const targetInput = formData.get("followee_name");
  const meUsername = formData.get("user_name");
  const isUnfollow = (formData.get("follow_type") || event.submitter.value) === "Unfollow";

  if (!targetInput) {
    alert("Veuillez entrer un nom ou un ID.");
    return;
  }

  if (!meUsername) {
    alert("Utilisateur non identifié.");
    return;
  }

  // Toute la logique (identification ID vs Nom) est faite en C++
  di.socialGraphHandler.HandleFollowAction(meUsername, targetInput, isUnfollow);
}

// Initialise l'observation des changements dans Yjs
socialGraphArray.observeDeep(() => {
  updateSocialGraphUI();
});

// Initialisation au chargement de la page
function init() {
  showUsername();
  updateSocialGraphUI();
  document.querySelectorAll(".follow-form").forEach(f => f.addEventListener("submit", followHandler));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
