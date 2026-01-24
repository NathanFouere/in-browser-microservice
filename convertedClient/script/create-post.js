import di from "../di.js";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

function clickEventHandler() {
  if (document.getElementById("media").value != "") {
    // TODO
  } else {
    uploadPost();
  }
}

function uploadPost(media_json) {
  if (document.getElementById("post-content").value !== "") {
    var body = document.getElementById("post-content").value;
    const loggedUser = di.sessionStorageUserService.getLoggedUser();
    di.composePostHandler.ComposePost(
      loggedUser.username,
      loggedUser.userid,
      body,
      di.module.PostType.POST,
    );
  }
}

document
  .getElementById("create-post")
  .addEventListener("click", clickEventHandler);

var hide = document.getElementById("hide-post");
var show = document.getElementById("show-post");

$("#compose").hide(); // cache par défaut la création de post

hide.addEventListener("click", function () {
  $("#compose").hide();
});

show.addEventListener("click", function () {
  $("#compose").toggle();
});
