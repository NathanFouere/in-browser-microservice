import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import {
  signalingServerIp,
  sharedDocName,
  sharedRoomName,
  personnalDocName,
} from "./consts";

const sharedDoc = new Y.Doc();
// clients connected to the same room-name share document updates

const provider = new WebrtcProvider(sharedRoomName, sharedDoc, {
  signaling: ["ws://" + signalingServerIp + ":4444"],
});

const persistence = new IndexeddbPersistence(sharedDocName, sharedDoc);

const personnalDoc = new Y.Doc();

const personnalPersistence = new IndexeddbPersistence(
  personnalDocName,
  personnalDoc,
);

export { sharedDoc, persistence, provider, personnalDoc, personnalPersistence };
