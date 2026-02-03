import di from "../di.js";
import { persistence } from "./yjs.js";

window.clearDatabase = async () => {
    if (!confirm("Are you sure you want to DELETE ALL DATA? This cannot be undone.")) return;
    
    console.log("Clearing IndexedDB...");
    try {
        await persistence.clearData();
        console.log("Data cleared. Reloading...");
        window.location.reload();
    } catch (e) {
        console.error("Failed to clear data:", e);
        alert("Failed to clear data: " + e.message);
    }
};

// Benchmark Tool
// Remote latency is measured automatically in timeline.js when Yjs updates are received.
window.runBenchmark = async (numberOfPosts = 10) => {
  console.log(`Starting benchmark for ${numberOfPosts} posts...`);
  const startTime = performance.now();

  const loggedUser = di.sessionStorageUserService.getLoggedUser();
  if (!loggedUser) {
    console.error("User not logged in! Please login to run the benchmark.");
    return;
  }

  for (let i = 0; i < numberOfPosts; i++) {
    try {
        console.log("Creating post #" + (i + 1) + " by " + loggedUser.username);
        di.composePostHandler.ComposePost(
            loggedUser.username,
            loggedUser.userid,
            `Benchmark Post #${i + 1} - ${new Date().toISOString()}`,
            di.module.PostType.POST
        );
    } catch (e) {
        console.error(`[Benchmark] Failed to create post #${i+1}:`, e);
    }
    
    // Optional: yield to UI thread every so often to avoid freezing browser on large datasets
    if (i % 50 === 0) await new Promise(r => setTimeout(r, 0));
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`Benchmark finished in ${duration.toFixed(2)}ms`);
  console.log(`Average time per post: ${(duration / numberOfPosts).toFixed(2)}ms`);
  
  // Reload to see posts if needed (disabled for pure timing measurement, enable manually or call window.location.reload())
  console.log("Reload the page to see the new posts: window.location.reload()");
};

// Tool to just measure rendering of current posts without adding new ones
window.measureRendering = () => {
  console.log("Forcing timeline re-render to measure UI performance...");
  if (window.showTimeline) {
    window.showTimeline("main");
  } else {
    console.error("showTimeline function not found on window object.");
  }
};
