import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import di from "../di.js";

import { signalingServerIp } from "./consts";

// ==========================================
// GLOBAL LATENCY METRICS SYSTEM
// ==========================================

const METRICS_DB_NAME = "latency-metrics";
const METRICS_STORE_NAME = "post_latency";

function openMetricsDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(METRICS_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(METRICS_STORE_NAME)) {
        db.createObjectStore(METRICS_STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

window.postLatencyMetrics = {
  latencies: [],
  startTime: Date.now(),
  logCounter: 0,
  _dbPromise: null,
  _initPromise: null,
  _batchOffsets: new Map(),

  async init() {
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      if (!this._dbPromise) this._dbPromise = openMetricsDb();
      const db = await this._dbPromise;
      const all = await new Promise((resolve, reject) => {
        const tx = db.transaction(METRICS_STORE_NAME, "readonly");
        const store = tx.objectStore(METRICS_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      this.latencies = all;
      this._rebuildBatchOffsets();
      await this._normalizeBatchOffsets();
    })();

    return this._initPromise;
  },

  async _recalculateBatch(eventTime) {
    if (!this._dbPromise) this._dbPromise = openMetricsDb();
    const db = await this._dbPromise;

    const offset = this._batchOffsets.get(eventTime) ?? 0;
    if (this.latencies.length === 0) return;

    for (const m of this.latencies) {
      if (m.eventTime !== eventTime) continue;
      const adjusted = m.clockSkewMs - offset;
      if (m.batchOffsetMs === offset && m.adjustedLatencyMs === adjusted) continue;

      m.batchOffsetMs = offset;
      m.adjustedLatencyMs = adjusted;

      if (m.id === undefined || m.id === null) continue;
      await new Promise((resolve, reject) => {
        const tx = db.transaction(METRICS_STORE_NAME, "readwrite");
        const store = tx.objectStore(METRICS_STORE_NAME);
        const request = store.put(m);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  },

  _rebuildBatchOffsets() {
    this._batchOffsets = new Map();
    for (const m of this.latencies) {
      if (typeof m.eventTime !== "number" || typeof m.clockSkewMs !== "number") {
        continue;
      }
      const current = this._batchOffsets.get(m.eventTime);
      if (current === undefined || m.clockSkewMs < current) {
        this._batchOffsets.set(m.eventTime, m.clockSkewMs);
      }
    }
  },

  async _normalizeBatchOffsets() {
    if (!this._dbPromise) this._dbPromise = openMetricsDb();
    const db = await this._dbPromise;

    for (const m of this.latencies) {
      if (typeof m.eventTime !== "number" || typeof m.clockSkewMs !== "number") {
        continue;
      }
      const offset = this._batchOffsets.get(m.eventTime) ?? 0;
      const adjusted = m.clockSkewMs - offset;
      const { isValid, quality } = this._evaluateQuality(adjusted);

      const needsUpdate =
        m.batchOffsetMs !== offset ||
        m.adjustedLatencyMs !== adjusted ||
        m.isValid !== isValid ||
        m.quality !== quality ||
        typeof m.eventTimestamp !== "string";

      if (!needsUpdate) continue;

      m.batchOffsetMs = offset;
      m.adjustedLatencyMs = adjusted;
      m.isValid = isValid;
      m.quality = quality;
      m.eventTimestamp = new Date(m.eventTime).toISOString();

      if (m.id === undefined || m.id === null) continue;

      await new Promise((resolve, reject) => {
        const tx = db.transaction(METRICS_STORE_NAME, "readwrite");
        const store = tx.objectStore(METRICS_STORE_NAME);
        const request = store.put(m);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  },

  _evaluateQuality(latencyMs) {
    const isValid = latencyMs >= 0 && latencyMs <= 30000;

    let quality;
    if (!isValid) {
      quality = "Invalid";
    } else if (latencyMs < 100) {
      quality = "Excellent";
    } else if (latencyMs < 500) {
      quality = "Good";
    } else if (latencyMs < 2000) {
      quality = "Fair";
    } else {
      quality = "Poor";
    }

    return { isValid, quality };
  },

  async persistMeasurement(measurement) {
    if (!this._dbPromise) this._dbPromise = openMetricsDb();
    const db = await this._dbPromise;

    const id = await new Promise((resolve, reject) => {
      const tx = db.transaction(METRICS_STORE_NAME, "readwrite");
      const store = tx.objectStore(METRICS_STORE_NAME);
      const request = store.add(measurement);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    measurement.id = id;
  },

  addMeasurement(postId, senderUsername, postText, sendTime, receiveTime, latency, eventTime) {
    const clockSkewMs = latency;

    const truncatedText = postText.length > 50
      ? postText.substring(0, 47) + "..."
      : postText;

    const currentOffset = this._batchOffsets.get(eventTime);
    const batchOffsetMs = currentOffset === undefined
      ? clockSkewMs
      : Math.min(currentOffset, clockSkewMs);
    this._batchOffsets.set(eventTime, batchOffsetMs);

    const adjustedLatencyMs = clockSkewMs - batchOffsetMs;
    const { isValid, quality } = this._evaluateQuality(adjustedLatencyMs);

    const measurement = {
      postId,
      senderUsername,
      postText: truncatedText,
      sendTime,
      receiveTime,
      latency: clockSkewMs,
      clockSkewMs,
      isValid,
      quality,
      eventTime,
      eventTimestamp: new Date(eventTime).toISOString(),
      batchOffsetMs,
      adjustedLatencyMs,
      timestamp: new Date(receiveTime).toISOString(),
    };

    this.latencies.push(measurement);
    this.persistMeasurement(measurement)
      .then(async () => {
        if (batchOffsetMs === clockSkewMs) return;
        // If a new lower offset was found, update existing rows in this batch
        await this._recalculateBatch(eventTime);
      })
      .catch((e) => {
        console.error("Failed to persist latency measurement:", e);
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
        `[Latency] Post ${postId}: skew=${clockSkewMs}ms adjusted=${adjustedLatencyMs}ms (INVALID)`,
      );
    }
  },

  getAverage() {
    const valid = this.latencies.filter((m) => m.isValid);
    if (valid.length === 0) return 0;
    return valid.reduce((acc, m) => acc + (m.adjustedLatencyMs ?? m.latency), 0) / valid.length;
  },

  getPercentile(p) {
    const valid = this.latencies.filter((m) => m.isValid);
    if (valid.length === 0) return 0;
    const sorted = [...valid].sort(
      (a, b) => (a.adjustedLatencyMs ?? a.latency) - (b.adjustedLatencyMs ?? b.latency),
    );
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return (sorted[Math.max(0, index)]?.adjustedLatencyMs ??
      sorted[Math.max(0, index)]?.latency) || 0;
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

  async exportCSV() {
    await this.init();
    const rows = this.latencies;

    if (rows.length === 0) {
      alert("No latency data to export.");
      return;
    }

    let csv =
      "Post ID,Sender Username,Post Text,Send Time (ms),Receive Time (ms)," +
      "Latency (ms),Clock Skew (ms),Batch Offset (ms),Adjusted Latency (ms)," +
      "Valid,Network Quality,Event Time (ms),Event Timestamp (ISO),Timestamp (ISO)\n";

    rows.forEach((m) => {
      const escapedText = m.postText.replace(/"/g, '""');
      csv +=
        `${m.postId},"${m.senderUsername}","${escapedText}",` +
        `${m.sendTime},${m.receiveTime},${m.latency},` +
        `${m.clockSkewMs},${m.batchOffsetMs},${m.adjustedLatencyMs},` +
        `${m.isValid ? "Yes" : "No"},${m.quality},` +
        `${m.eventTime},"${m.eventTimestamp}","${m.timestamp}"\n`;
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
      `Exported ${rows.length} latency measurements to CSV`,
    );
  },

  async reset() {
    await this.init();
    const count = this.latencies.length;

    if (this._dbPromise) {
      const db = await this._dbPromise;
      await new Promise((resolve, reject) => {
        const tx = db.transaction(METRICS_STORE_NAME, "readwrite");
        const store = tx.objectStore(METRICS_STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    this.latencies = [];
    this.startTime = Date.now();
    this.logCounter = 0;
    this._batchOffsets = new Map();
    console.log(`Latency metrics reset (cleared ${count} measurements).`);
  },
};

window.exportLatencyCSV = () => window.postLatencyMetrics.exportCSV();
window.resetLatencyMetrics = () => window.postLatencyMetrics.reset();
window.showLatencySummary = async () => {
  await window.postLatencyMetrics.init();
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

      const eventTime = Date.now();

      // Extract added posts and measure latency
      event.changes.added.forEach((item) => {
        item.content.getContent().forEach((post) => {
          if (post.send_timestamp_ms) {
            const receiveTime = Date.now();
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
              eventTime,
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
