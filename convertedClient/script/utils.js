import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import di from "../di.js";

import { signalingServerIp } from "./consts";

// ==========================================
// GLOBAL LATENCY METRICS SYSTEM
// ==========================================

window.postLatencyMetrics = {
  latencies: [],
  startTime: Date.now(),
  logCounter: 0,

  addMeasurement(postId, senderUsername, postText, sendTime, receiveTime, latency) {
    const isValid = latency >= 0 && latency <= 30000;

    let quality;
    if (!isValid) {
      quality = "Invalid";
    } else if (latency < 100) {
      quality = "Excellent";
    } else if (latency < 500) {
      quality = "Good";
    } else if (latency < 2000) {
      quality = "Fair";
    } else {
      quality = "Poor";
    }

    const truncatedText = postText.length > 50
      ? postText.substring(0, 47) + "..."
      : postText;

    this.latencies.push({
      postId,
      senderUsername,
      postText: truncatedText,
      sendTime,
      receiveTime,
      latency,
      isValid,
      quality,
      timestamp: new Date(receiveTime).toISOString(),
    });

    this.logCounter++;
    if (this.logCounter % 10 === 0) {
      const summary = this.getSummary();
      if (summary.valid > 0) {
        console.log(
          `[Latency] ${this.logCounter} posts received | ` +
          `Avg: ${summary.avg.toFixed(0)}ms | ` +
          `Min: ${summary.min}ms | Max: ${summary.max}ms | ` +
          `P95: ${summary.p95}ms`,
        );
      }
    }

    if (!isValid) {
      console.warn(
        `[Latency] Post ${postId}: ${latency}ms (INVALID - likely clock drift)`,
      );
    }
  },

  getAverage() {
    const valid = this.latencies.filter((m) => m.isValid);
    if (valid.length === 0) return 0;
    return valid.reduce((acc, m) => acc + m.latency, 0) / valid.length;
  },

  getPercentile(p) {
    const valid = this.latencies.filter((m) => m.isValid);
    if (valid.length === 0) return 0;
    const sorted = [...valid].sort((a, b) => a.latency - b.latency);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)]?.latency || 0;
  },

  getSummary() {
    const valid = this.latencies.filter((m) => m.isValid);

    if (valid.length === 0) {
      return {
        total: this.latencies.length,
        valid: 0,
        invalid: this.latencies.length,
        message: "No valid latency data collected yet.",
      };
    }

    const sorted = [...valid].sort((a, b) => a.latency - b.latency);

    return {
      total: this.latencies.length,
      valid: valid.length,
      invalid: this.latencies.length - valid.length,
      min: sorted[0].latency,
      max: sorted[sorted.length - 1].latency,
      avg: this.getAverage(),
      p50: this.getPercentile(50),
      p95: this.getPercentile(95),
      p99: this.getPercentile(99),
    };
  },

  exportCSV() {
    if (this.latencies.length === 0) {
      alert("No latency data to export.");
      return;
    }

    let csv =
      "Post ID,Sender Username,Post Text,Send Time (ms),Receive Time (ms)," +
      "Latency (ms),Valid,Network Quality,Timestamp (ISO)\n";

    this.latencies.forEach((m) => {
      const escapedText = m.postText.replace(/"/g, '""');
      csv +=
        `${m.postId},"${m.senderUsername}","${escapedText}",` +
        `${m.sendTime},${m.receiveTime},${m.latency},` +
        `${m.isValid ? "Yes" : "No"},${m.quality},"${m.timestamp}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `post-latency-metrics-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(
      `Exported ${this.latencies.length} latency measurements to CSV`,
    );
  },

  reset() {
    const count = this.latencies.length;
    this.latencies = [];
    this.startTime = Date.now();
    this.logCounter = 0;
    console.log(`Latency metrics reset (cleared ${count} measurements).`);
  },
};

window.exportLatencyCSV = () => window.postLatencyMetrics.exportCSV();
window.resetLatencyMetrics = () => window.postLatencyMetrics.reset();
window.showLatencySummary = () => {
  const summary = window.postLatencyMetrics.getSummary();

  if (summary.message) {
    console.log(summary.message);
    return summary;
  }

  console.log("\n--- LATENCY STATISTICS ---");
  console.log(`Total Posts Received:  ${summary.total}`);
  console.log(`Valid Measurements:    ${summary.valid}`);
  console.log(`Invalid Measurements:  ${summary.invalid}`);
  console.log(`--------------------------`);
  console.log(`Min Latency:           ${summary.min}ms`);
  console.log(`Average Latency:       ${summary.avg.toFixed(2)}ms`);
  console.log(`Median (P50):          ${summary.p50}ms`);
  console.log(`P95:                   ${summary.p95}ms`);
  console.log(`P99:                   ${summary.p99}ms`);
  console.log(`Max Latency:           ${summary.max}ms`);
  console.log("--------------------------\n");

  return summary;
};
async function sendFriendRequest(
  cur_user_name,
  cur_user_id,
  follow_id,
  follow_username,
) {
  const newDoc = new Y.Doc();

  // Permet d'avoir un roomId unique pour chaque paire d'utilisateurs
  console.log(
    "Creating room for friendId",
    follow_id,
    "and current userId",
    cur_user_id,
    "in utils",
  );
  const roomId = [cur_user_id, follow_id].sort().join("-");

  // créer la persistence et attend sa syncrhonisation
  const persistence = new IndexeddbPersistence(roomId, newDoc);

  await persistence.whenSynced.then(() => {
    console.log(`IndexedDB synced for room ${roomId}`);
  });

  const provider = new WebrtcProvider(roomId, newDoc, {
    signaling: [signalingServerIp],
  });

  provider.awareness.setLocalStateField("user", {
    username: cur_user_name.toString(),
    userId: cur_user_id.toString(),
    clientId: newDoc.clientID,
  });

  di.module.connections[follow_id] = {
    doc: newDoc,
    provider: provider,
    persistence: persistence,
  };

  propagatePosts(newDoc, di.personnalDoc);

  di.module.mainProvider.awareness.setLocalStateField("friend_request", {
    targeted_user_id: follow_id,
    targeted_user_name: follow_username.toString(),
    source_username: cur_user_name.toString(),
    source_user_id: cur_user_id.toString(),
    roomId: roomId,
  });
}

function propagatePosts(newDoc, personnalDoc) {
  const postsArray = newDoc.getArray("posts");
  const personnalDocPostsArray = personnalDoc.getArray("posts");

  postsArray.push(personnalDocPostsArray.toArray());
  console.log("Propagated posts to personnalDoc");
  console.log(personnalDocPostsArray.toArray());
  console.log(postsArray.toArray());
}

async function createYdocAndRoom(
  roomId,
  cur_username,
  cur_user_id,
  userId,
  module,
) {
  const newDoc = new Y.Doc();
  const persistence = new IndexeddbPersistence(roomId, newDoc);

  await persistence.whenSynced.then(() => {
    console.log(`IndexedDB synced for room ${roomId}`);
  });

  const provider = new WebrtcProvider(roomId, newDoc, {
    signaling: [signalingServerIp],
  });

  provider.awareness.setLocalStateField("user", {
    username: cur_username,
    userId: cur_user_id.toString(),
    clientId: newDoc.clientID,
  });

  const postsArray = newDoc.getArray("posts");
  postsArray.observe((event) => {
    if (event.transaction.origin !== null) {
      console.log("Ajout d'un post distant");

      const receiveTime = Date.now();

      // Extract added posts and measure latency
      event.changes.added.forEach((item) => {
        item.content.getContent().forEach((post) => {
          if (post.send_timestamp_ms) {
            const senderUsername = post.creator?.username || "Unknown";
            const latency = receiveTime - post.send_timestamp_ms;
            const postText = post.text || "";

            window.postLatencyMetrics.addMeasurement(
              post.post_id,
              senderUsername,
              postText,
              post.send_timestamp_ms,
              receiveTime,
              latency,
            );
          }
        });
      });

      newDoc.transact(() => {});
      
      // Refresh timeline to display newly received posts
      // Refresh timeline via global (avoids circular import with timeline.js)
      if (window.showTimeline) window.showTimeline("main");
    }
  });
  module.connections[userId] = {
    doc: newDoc,
    provider: provider,
    persistence: persistence,
  };

  console.log("Created new Y.Doc and room for userId:", userId);
}

export { sendFriendRequest, createYdocAndRoom };
