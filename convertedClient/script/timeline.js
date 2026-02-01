import di from "../di.js";

let postTemplate = null;
const isOnIndexPage = window.location.pathname.endsWith("index.html");

export default function showTimeline(type) {
  if (isOnIndexPage) return;
  const loggedUser = di.sessionStorageUserService.getLoggedUser();

  if (type == "main") {
    const cardBlock = document.getElementById("card-block");
    if (!cardBlock) return;

    // Use cached template
    if (!postTemplate) return;

    const onlyFriendsToggle = document.getElementById("only-friends-toggle");
    const onlyFriends = onlyFriendsToggle ? onlyFriendsToggle.checked : false;

    // Fetch posts (synchronous for now based on current impl)
    const postsVector = di.homeTimelineHandler.ReadHomeTimeline(
      loggedUser.userid,
      0,
      10,
      onlyFriends,
    );

    const posts = [];
    for (let i = 0; i < postsVector.size(); i++) {
      posts.push(postsVector.get(i));
    }

    // Sort by timestamp based on toggle button
    const sortBtn = document.getElementById("sort-toggle-btn");
    const sortAsc = sortBtn
      ? sortBtn.getAttribute("data-sort") === "asc"
      : false;

    posts.sort((a, b) => {
      const valA = Number(a.timestamp);
      const valB = Number(b.timestamp);
      if (valA > valB) return sortAsc ? 1 : -1;
      if (valA < valB) return sortAsc ? -1 : 1;
      return 0;
    });

    // Clear current posts
    cardBlock.innerHTML = "";

    for (const p of posts) {
      const date = new Date(Number(p.timestamp) * 1000);

      const clone = postTemplate.cloneNode(true);
      clone.style.display = "block";

      // Fill data
      clone.querySelector(".post-text").innerText = p.text;
      clone.querySelector(".post-time").innerText = date.toString();

      const creatorEl = clone.querySelector(".post-creator");
      if (creatorEl) creatorEl.innerText = p.creator.username;

      // Hook buttons
      const deleteBtn = clone.querySelector(".delete-post-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          $("#deletePostModal").data("post-id", p.post_id).modal("show");
        });
      }

      const editBtn = clone.querySelector(".edit-post-btn");
      if (editBtn) {
        editBtn.addEventListener("click", () => {
          $("#editPostModal").data("post-id", p.post_id);
          const editPostTextarea = document.getElementById("editPostTextarea");
          editPostTextarea.value = p.text;
          $("#editPostModal").modal("show");
        });
      }

      cardBlock.appendChild(clone);
    }
  }
}

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

  const toggle = document.getElementById("only-friends-toggle");
  if (toggle) {
    toggle.addEventListener("change", () => {
      showTimeline("main");
    });
  }

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
  const sortBtn = document.getElementById("sort-toggle-btn");
  if (sortBtn) {
    sortBtn.addEventListener("click", () => {
      const currentSort = sortBtn.getAttribute("data-sort");
      const newSort = currentSort === "desc" ? "asc" : "desc";
      sortBtn.setAttribute("data-sort", newSort);

      // Update UI
      const icon = sortBtn.querySelector("i");
      const label = document.getElementById("sort-label");

      if (newSort === "asc") {
        icon.className = "fas fa-arrow-up";
        label.innerText = "Oldest first";
      } else {
        icon.className = "fas fa-arrow-down";
        label.innerText = "Newest first";
      }

      showTimeline("main");
    });
  }

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
