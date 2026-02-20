import di from "../di.js";

import { showTimeline } from "./utils.js";
let postTemplate = null;
const isOnIndexPage = window.location.pathname.endsWith("index.html");

// Global exposure
window.showTimeline = showTimeline;

function initTimeline() {
  if (isOnIndexPage) return;
  if (
    !sessionStorage.getItem("user") ||
    !di.sessionStorageUserService.getLoggedUser()
  ) {
    console.log("User not logged in, redirecting to login page.");
    window.location.href = "../index.html";
    return;
  }

  const allCards = document.getElementsByClassName("post-card");
  if (allCards.length > 0) {
    postTemplate = allCards[0].cloneNode(true);
    allCards[0].remove();
  } else {
    console.error("timeline.js: No post-card template found!");
  }

  showTimeline("main");

  $("#confirmDeletePostBtn").on("click", () => {
    const postId = $("#deletePostModal").data("post-id");
    if (postId) {
      di.postStorageHandler.DeletePost(postId);
      $("#deletePostModal").modal("hide");
      showTimeline("main");
      //setTimeout(() => { showTimeline("main"); }, 500);
    }
  });

  $("#confirmEditPostBtn").on("click", () => {
    const postId = $("#editPostModal").data("post-id");
    if (postId) {
      const editPostTextarea = document.getElementById("editPostTextarea");
      di.postStorageHandler.EditPostText(postId, editPostTextarea.value);
      $("#editPostModal").modal("hide");
      showTimeline("main");
      //setTimeout(() => { showTimeline("main"); }, 500);
    }
  });

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTimeline);
} else {
  initTimeline();
}

export function logout() {
  try {
    if (di.sessionStorageUserService) {
      di.sessionStorageUserService.removeLoggedUser();
    }
  } catch (e) {
    console.error("Error during logout:", e);
    // Fallback if binding fails
    sessionStorage.removeItem("user");
  }
  window.location.href = "../index.html";
}
window.logout = logout;
