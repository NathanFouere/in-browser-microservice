import { dbSyncTypeMsg } from "./consts";
export default class PeerJsReceiverService {
  constructor(postStorageHandler) {
    this.postStorageHandler = postStorageHandler;
  }

  handleMessage(data) {
    console.log("PeerJsReceiverService received data : ", data);
    console.log("Data type is : ", data.type);
    switch (data.type) {
      case dbSyncTypeMsg:
        this.receiveRemoteDb(data.content);
        break;
      default:
        console.error("type : ", data.type, " not handled");
    }
  }

  receiveRemoteDb(content) {
    this.postStorageHandler.StoreRemotePosts(content);
    window.location.reload();
  }
}
