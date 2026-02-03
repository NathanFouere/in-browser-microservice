import di from "../di.js";

let postTemplate = null;
let currentOffset = 0;
const LIMIT = 10;
let currentType = "main";

  if (type == "main") {
    const cardBlock = document.getElementById("card-block");
    if (!cardBlock) return;
// Remote Posts Observer State
let newRemotePostsCount = 0;

export function setupRemoteObserver() {
    const ydoc = di.ydoc;
    const postsArray = ydoc.getArray("posts");

    postsArray.observe((event, transaction) => {
        // 1. Filter: Only care about Remote changes
        if (transaction.local) {
             // If local change (we posted), we might want to refresh immediately (already handled by create-post reload or similar)
             // For now, we assume local posts are handled elsewhere or auto-refresh
             return;
        }

        const tReceived = performance.now();

        // 2. Logic: Increment Counter
        newRemotePostsCount++;
        
        // 3. UI Update
        const alertBox = document.getElementById('new-posts-alert');
        const countSpan = document.getElementById('new-posts-count');
        
        if (alertBox && countSpan) {
            countSpan.innerText = newRemotePostsCount;
            alertBox.style.display = 'block';
            
            // 4. Benchmark: Latency Measurement (Reception -> Notification Visible)
            requestAnimationFrame(() => {
                const tDisplayed = performance.now();
                console.log(`[Latency] Remote Post -> Notification: ${(tDisplayed - tReceived).toFixed(2)} ms (Count: ${newRemotePostsCount})`);
            });
        }
    });

    // Setup Click Listener for Refresh
    const alertBox = document.getElementById('new-posts-alert');
    if (alertBox) {
        alertBox.addEventListener('click', () => {
            console.log("Refreshing timeline with new posts...");
            newRemotePostsCount = 0;
            alertBox.style.display = 'none';
            showTimeline("main");
        });
    }
}

// Initialize Observer on load
setupRemoteObserver();

export default function showTimeline(type, isLoadMore = false) {
  const loggedUser = di.sessionStorageUserService.getLoggedUser();
  
  if (!isLoadMore) {
      currentOffset = 0;
      currentType = type;
  }

  const cardBlock = document.getElementById("card-block");
  if (!cardBlock) return;
  if (!postTemplate) return;

  // Cleanup existing Load More button if resetting
  if (!isLoadMore) {
      const existingBtn = document.getElementById('load-more-btn');
      if (existingBtn) existingBtn.remove();
  }

  let postsVector;
  let isUserTimeline = false;

  console.log(`[Timeline] showTimeline called. Type: ${type}, IsLoadMore: ${isLoadMore}, Offset: ${currentOffset}`);

  if (type == "main") {

    // Sort logic
    const sortBtn = document.getElementById('sort-toggle-btn');
    const sortAsc = sortBtn ? sortBtn.getAttribute('data-sort') === 'asc' : false;
    const sortOrder = sortAsc ? "asc" : "desc";

    // Fetch posts with offset, limit AND sort order
    try {
        const endIndex = currentOffset + LIMIT;
        //Only friends is always true because of sharding
        postsVector = di.homeTimelineHandler.ReadHomeTimeline(loggedUser.userid, currentOffset, endIndex, sortOrder);
        console.log(`[Timeline] ReadHomeTimeline(${currentOffset}, ${endIndex}, ${sortOrder}) returned ${postsVector.size()} posts.`);
    } catch (e) {
        console.error("[Timeline] Error calling ReadHomeTimeline:", e);
        return;
    }
  
  } else if (type == "user-timeline") {
      isUserTimeline = true;
      try {
          const endIndex = currentOffset + LIMIT;
           // Assuming UserTimelineHandler might NOT need update yet, or was not requested.
           // Focusing on HomeTimeline as requested. If needed, we can update UserTimeline later.
           // Keeping existing call for UserTimeline
          postsVector = di.userTimelineHandler.ReadUserTimeline(loggedUser.userid, currentOffset, endIndex);
          console.log(`[Timeline] ReadUserTimeline(${currentOffset}, ${endIndex}) returned ${postsVector.size()} posts.`);
      } catch (e) {
          console.error("[Timeline] Error calling ReadUserTimeline:", e);
          return;
      }
  } else {
      console.warn(`[Timeline] Unknown type: ${type}`);
      return;
  }

  const posts = [];
  for (let i = 0; i < postsVector.size(); i++) {
    posts.push(postsVector.get(i));
  }
  
  if (!isLoadMore) {
      const renderLabel = `Timeline Render (${posts.length} posts)`;
      console.time(renderLabel);
      cardBlock.replaceChildren(); 
      console.timeEnd(renderLabel);
  }

  // Append new posts
  for (const p of posts) {
    const date = new Date(Number(p.timestamp) * 1000);

    const clone = postTemplate.cloneNode(true);
    clone.style.display = "block";

    // Fill data
    clone.querySelector(".post-text").innerText = p.text;
    clone.querySelector(".post-time").innerText = date.toString();

    const creatorEl = clone.querySelector(".post-creator");
    if (creatorEl) {
        if (!p.creator || !p.creator.username) {
            console.warn("[Timeline] Missing creator/username for post:", p.post_id, p);
            creatorEl.innerText = "Unknown User";
        } else {
            creatorEl.innerText = p.creator.username;
        }
    }

    // Hook buttons
    const deleteBtn = clone.querySelector(".delete-post-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        $('#deletePostModal').data('post-id', p.post_id).modal('show');
      });
    }

    const editBtn = clone.querySelector(".edit-post-btn");
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        $('#editPostModal').data('post-id', p.post_id);
        const editPostTextarea = document.getElementById('editPostTextarea');
        editPostTextarea.value = p.text;
        $('#editPostModal').modal('show');
      });
    }

    cardBlock.appendChild(clone);
  }

  // Force reflow
  cardBlock.scrollTop; 

  // Handle Load More Button
  let loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) loadMoreBtn.remove();

  if (posts.length >= LIMIT) {
      loadMoreBtn = document.createElement('button');
      loadMoreBtn.id = 'load-more-btn';
      loadMoreBtn.className = 'btn btn-secondary btn-block mt-3 mb-3';
      loadMoreBtn.innerText = 'Load More';
      loadMoreBtn.onclick = () => {
          currentOffset += LIMIT;
          showTimeline(currentType, true);
      };
      cardBlock.appendChild(loadMoreBtn);
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

  $('#confirmDeletePostBtn').on('click', () => {
    const postId = $('#deletePostModal').data('post-id');
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
