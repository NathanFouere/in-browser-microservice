import di from "../di.js";

window.clearDatabase = async () => {
    if (!confirm("Are you sure you want to DELETE ALL DATA? This cannot be undone.")) return;
    
    console.log("Clearing IndexedDB...");
    try {
        // Clear all Yjs persistence stores (shared-doc, personal-shared-doc, and per-friend docs)
        const connections = di.module.connections;
        for (const key of Object.keys(connections)) {
            const conn = connections[key];
            if (conn.persistence) {
                console.log(`Clearing persistence for connection: ${key}`);
                await conn.persistence.clearData();
            }
        }

        // Clear the "store" IndexedDB (friends list used by SocialGraphHandler)
        await new Promise((resolve, reject) => {
            const req = indexedDB.deleteDatabase("store");
            req.onsuccess = () => { console.log("Deleted 'store' database"); resolve(); };
            req.onerror = () => reject(req.error);
            req.onblocked = () => { console.warn("'store' database delete blocked"); resolve(); };
        });

        // Clear latency metrics IndexedDB
        await new Promise((resolve, reject) => {
            const req = indexedDB.deleteDatabase("latency-metrics");
            req.onsuccess = () => { console.log("Deleted 'latency-metrics' database"); resolve(); };
            req.onerror = () => reject(req.error);
            req.onblocked = () => { console.warn("'latency-metrics' database delete blocked"); resolve(); };
        });

        console.log("All data cleared. Reloading...");
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
  }

  const endTime = performance.now();
  const duration = endTime - startTime;
  console.log(`Benchmark finished in ${duration.toFixed(2)}ms`);
  console.log(`Average time per post: ${(duration / numberOfPosts).toFixed(2)}ms`);
  console.log(`Posts sent. To see latency metrics, ask the RECEIVER to click "Show Stats" or "Export CSV".`);
};

// Show latency statistics in console
window.showLatencyStats = () => {
  if (!window.postLatencyMetrics) {
    console.error("Latency metrics not initialized. Are you on the main page?");
    return;
  }
  return window.showLatencySummary();
};
