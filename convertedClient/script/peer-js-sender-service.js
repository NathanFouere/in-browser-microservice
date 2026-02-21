import { dbSyncTypeMsg } from "./consts";
export default class PeerJsSenderService {
  constructor(synchronizeDbService, peerjsService) {
    this.synchronizeDbService = synchronizeDbService;
    this.peerjsService = peerjsService;
  }

  sendMessage(type) {
    console.log("PeerJsSenderService sends type ", type);
    switch (type) {
      case dbSyncTypeMsg:
        this.sendPostDb();
        // TODO => ici devrait faire un tri sur ce qu'on souhaite réellement fermer
        this.peerjsService.activePeerJsConnections = {};
        this.peerjsService.closeConnection();
        break;
      default:
        console.error("type : ", data.type, " not handled");
    }
  }

  sendPostDb() {
    this.synchronizeDbService.sendPostDb();
  }
}
