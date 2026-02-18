export default class SynchronizeDbService {
  constructor(peerjsService) {
    this.peerjsService = peerjsService;
  }

  sendDb(db) {
    this.peerjsService.sendMessage({
      type: "db-sync",
      content: db,
    });
    this.peerjsService.closeConnection();
  }
}
