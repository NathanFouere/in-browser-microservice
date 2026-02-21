export default class SynchronizeDbService {
  constructor(peerjsService, postStorageHandler) {
    this.peerjsService = peerjsService;
    this.postStorageHandler = postStorageHandler;
  }

  sendPostDb() {
    const postsDb = this.postStorageHandler.GetAllPostsJsonFormat();
    console.log("sendMessage content", postsDb);
    this.peerjsService.sendMessage({
      type: "db-sync",
      content: postsDb,
    });
  }
}
