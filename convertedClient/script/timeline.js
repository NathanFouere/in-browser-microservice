import di from "../di.js";

let postTemplate = null;
let currentOffset = 0;
const LIMIT = 10;
let currentType = "main";
const isOnIndexPage = window.location.pathname.endsWith("index.html");

export default function showTimeline(type, isLoadMore = false) {
  if (isOnIndexPage) return;
  const loggedUser = di.sessionStorageUserService.getLoggedUser();

  // Reset offset if not loading more
  if (!isLoadMore) {
    currentOffset = 0;
    currentType = type;
  }

  if (type == "main") {
    const cardBlock = document.getElementById("card-block");
    if (!cardBlock) return;

    // Use cached template
    if (!postTemplate) return;

    // Remove existing Load More button if resetting
    if (!isLoadMore) {
      const existingBtn = document.getElementById("load-more-btn");
      if (existingBtn) existingBtn.remove();
    }

    // Sort logic
    const sortBtn = document.getElementById("sort-toggle-btn");
    const sortAsc = sortBtn
      ? sortBtn.getAttribute("data-sort") === "asc"
      : false;
    const sortOrder = sortAsc ? "asc" : "desc";

    // Fetch posts with pagination
    const endIndex = currentOffset + LIMIT;
    const postsVector = di.homeTimelineHandler.ReadHomeTimeline(
      loggedUser.userid,
      currentOffset,
      endIndex,
      false, // only_friends always false (no toggle)
      sortOrder, // Pass sort order to backend
    );

    const posts = [];
    for (let i = 0; i < postsVector.size(); i++) {
      posts.push(postsVector.get(i));
    }

    // Clear current posts only if not loading more
    if (!isLoadMore) {
      cardBlock.innerHTML = "";
    }

    // Append posts
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

    // Handle Load More Button
    let loadMoreBtn = document.getElementById("load-more-btn");
    if (loadMoreBtn) loadMoreBtn.remove();

    // Show Load More button only if we got full LIMIT posts
    if (posts.length >= LIMIT) {
      loadMoreBtn = document.createElement("button");
      loadMoreBtn.id = "load-more-btn";
      loadMoreBtn.className = "btn btn-secondary btn-block mt-3 mb-3";
      loadMoreBtn.innerText = "Load More";
      loadMoreBtn.onclick = () => {
        currentOffset += LIMIT;
        showTimeline(currentType, true);
      };
      cardBlock.appendChild(loadMoreBtn);
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

  // Removed only-friends-toggle listener

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
