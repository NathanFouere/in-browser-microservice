import di from "../di.js";
import ydoc from "./yjs.js";
import * as Y from "yjs";

// Récupère le tableau partagé 'social_graph' depuis le document Yjs.
// Ce tableau est synchronisé avec le backend C++ et les autres clients.
const socialGraphArray = ydoc.getArray("social_graph");



// Fonction utilitaire pour récupérer et structurer les données du graphe social depuis Yjs.
function getGraphData() {
  // Convertit le Y.Array en tableau JavaScript standard.
  const allItems = socialGraphArray.toArray();

  // Map pour faire correspondre ID Utilisateur -> Nom d'utilisateur
  const idToName = new Map();
  // Map pour faire correspondre Nom d'utilisateur -> Objet Graphe Utilisateur (UserGraph)
  const nameToGraph = new Map();

  allItems.forEach(item => {
    let ug = item;
    // Gestion de la double sérialisation potentielle (si le C++ a renvoyé une string JSON).
    if (typeof item === 'string') {
      try { ug = JSON.parse(item); } catch (e) { }
    }

    // Si l'objet est valide, on peuple les Map.
    if (ug && ug.user_id !== undefined && ug.username) {
      // Normalisation de l'ID en string pour assurer la clé de map (compatible BigInt/Number/String)
      const idKey = ug.user_id.toString();
      idToName.set(idKey, ug.username);
      nameToGraph.set(ug.username, ug);
    }
  });

  return { idToName, nameToGraph };
}

// Met à jour l'interface utilisateur en fonction des données du graphe social.
function updateSocialGraphUI() {
  try {
    let username = null;
    // Essaie de récupérer l'utilisateur depuis le service injecté (DI).
    try {
      const u = di.sessionStorageUserService.getLoggedUser();
      if (u && u.username) {
        username = u.username;
      }
    } catch (e) {
      // Fallback : lecture directe du sessionStorage si le service échoue.
      console.warn("Error fetching user from DI service, trying raw storage:", e);
      const stored = sessionStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.username) username = parsed.username;
          else username = stored;
        } catch (err) {
          username = stored;
        }
      }
    }

    if (!username) {
      // Affichage d'un message d'avertissement si aucun utilisateur n'est connecté.
      const followerList = document.getElementById("follower-list");
      if (followerList) followerList.innerHTML = '<div class="alert alert-warning">Please log in to view followers.</div>';

      const followeeList = document.getElementById("followee-list");
      if (followeeList) followeeList.innerHTML = '<div class="alert alert-warning">Please log in to view followees.</div>';
      return;
    }

    // Récupération des données formatées.
    const { idToName, nameToGraph } = getGraphData();

    // Récupération des données spécifiques à l'utilisateur connecté.
    const userData = nameToGraph.get(username);

    const followerNames = [];
    const followeeNames = [];
    const friendNames = [];

    if (userData) {
      // Résolution des IDs en Noms d'utilisateurs pour les Followers
      if (Array.isArray(userData.followers)) {
        userData.followers.forEach(id => {
          const idStr = id.toString();
          if (idToName.has(idStr)) followerNames.push(idToName.get(idStr));
          else followerNames.push("ID:" + id); // Affiche l'ID brut si le nom est introuvable
        });
      }
      // Résolution des IDs en Noms d'utilisateurs pour les Followees (abonnements)
      if (Array.isArray(userData.followees)) {
        userData.followees.forEach(id => {
          const idStr = id.toString();
          if (idToName.has(idStr)) followeeNames.push(idToName.get(idStr));
          else followeeNames.push("ID:" + id);
        });
      }
      // Résolution des IDs en Noms d'utilisateurs pour les Amis (Friends)
      if (Array.isArray(userData.friends)) {
        userData.friends.forEach(id => {
          const idStr = id.toString();
          if (idToName.has(idStr)) friendNames.push(idToName.get(idStr));
          else friendNames.push("ID:" + id);
        });
      }
    } else {
      console.warn("User", username, "not found in social graph (nameToGraph)");
    }

    // Rendu de la liste des Followers via HTML Template
    const followerList = document.getElementById("follower-list");
    const followerTemplate = document.getElementById("follower-template");

    if (followerList && followerTemplate) {
      followerList.innerHTML = "";

      if (followerNames.length === 0) {
        followerList.innerHTML = '<div class="card"><div class="card-body">Vous n\'avez aucun follower</div></div>';
      } else {
        followerNames.forEach(name => {
          // Clonage du template HTML pour chaque follower
          const clone = followerTemplate.content.cloneNode(true);
          const idEl = clone.querySelector(".follower-id");
          if (idEl) idEl.textContent = name;
          followerList.appendChild(clone);
        });
      }
    }

    // Rendu de la liste des Followees via HTML Template
    const followeeList = document.getElementById("followee-list");
    const followeeTemplate = document.getElementById("followee-template");

    if (followeeList && followeeTemplate) {
      followeeList.innerHTML = "";

      if (followeeNames.length === 0) {
        followeeList.innerHTML = '<div class="card"><div class="card-body">Vous ne suivez personne</div></div>';
      } else {
        followeeNames.forEach(name => {
          // Clonage du template HTML pour chaque followee
          const clone = followeeTemplate.content.cloneNode(true);
          const idEl = clone.querySelector(".followee-id");
          if (idEl) idEl.textContent = name;
          followeeList.appendChild(clone);
        });
      }
    }

    // Rendu de la liste des Amis via HTML Template
    const friendList = document.getElementById("friend-list");
    const friendTemplate = document.getElementById("friend-template");

    if (friendList && friendTemplate) {
      friendList.innerHTML = "";

      if (friendNames.length === 0) {
        friendList.innerHTML = '<div class="card"><div class="card-body">Vous n\'avez aucun ami</div></div>';
      } else {
        friendNames.forEach(name => {
          const clone = friendTemplate.content.cloneNode(true);
          const idEl = clone.querySelector(".friend-id");
          if (idEl) idEl.textContent = name;
          friendList.appendChild(clone);
        });
      }
    }
  } catch (e) {
    console.error("CRITICAL ERROR in updateSocialGraphUI:", e);
    alert("Error updating UI: " + e.message);
  }
}

let followUsername = () => {
  let username = localStorage.getItem("username");
  document.querySelectorAll(".follow-username").forEach(function (element) {
    element.setAttribute("value", username);
  });
};

function showUsername() {
  let username = "";
  if (
    localStorage.getItem("username") != undefined &&
    localStorage.getItem("username") != null
  ) {
    username = localStorage.getItem("username");
  }
  const el = document.getElementById("username");
  if (el) el.textContent = username;
}

// Observe les changements dans le tableau socialGraphArray.
// 'observeDeep' permet de détecter des modifications même imbriquées (ex: nouvelles relations).
// Met à jour l'interface à chaque changement détecté.
socialGraphArray.observeDeep(() => {
  updateSocialGraphUI();
});

// init on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    showUsername();
    followUsername();
    updateSocialGraphUI();
  });
} else {
  showUsername();
  followUsername();
  updateSocialGraphUI();
}


function followHandler(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submit = event.submitter;
  const formData = new FormData(form, submit);

  const followeeName = formData.get("followee_name");
  const username = formData.get("user_name");

  let followType = formData.get("follow_type");
  if (!followType && submit) {
    followType = submit.value;
  }

  if (!username) {
    console.error("No username found");
    return;
  }
  if (!followeeName) {
    alert("Please enter a username");
    return;
  }

  // C++ Logic ONLY - it will update Yjs 'social_graph' which we observe
  if (followType === "Unfollow") {
    di.socialGraphHandler.UnfollowWithUsername(username, followeeName);
  } else {
    di.socialGraphHandler.FollowWithUsername(username, followeeName);
  }
}

document.querySelectorAll(".follow-form").forEach((f) => {
  f.addEventListener("submit", followHandler);
});


