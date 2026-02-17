#include "SocialGraphHandler.hpp"
#include <algorithm>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <iostream>

using namespace emscripten;
using nlohmann::json;


EM_ASYNC_JS(void, recreate_friends_documents, (const char* cur_user_name, const char* cur_user_id), {

  const myUsername = UTF8ToString(cur_user_name);
  const myUserId = UTF8ToString(cur_user_id);

  const db = await new Promise((resolve, reject) => {
    const openRequest = indexedDB.open("store", 2);
    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror  = () => reject(openRequest.error);
  });

  const friends = await new Promise((resolve, reject) => {
    const tx = db.transaction("friends", "readonly");
    const store = tx.objectStore("friends");
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror   = () => reject(req.error);
  });

  if (!friends || !friends.length) {
    console.log("No friends found in IndexedDB");
    return;
  }

  console.log("Recreating Yjs documents for friends:", friends);

  for (const friend of friends) {
    const friendId = String(friend.friend_id);
    const friendUsername = friend.friend_username;

    if (Module?.connections?.[friendId]) {
      continue;
    }

    // Permet d'avoir un roomId unique pour chaque paire d'utilisateurs
    console.log("Creating room for friendId", friendId, "and current userId", myUserId, "in social graph handler");
    const roomId = [myUserId, friendId].sort().join("-");

    try {
      await Module.createYdocAndRoom(
        roomId,
        myUsername,
        myUserId,
        friendId,
        Module,
      );

      console.log("Restored room:", roomId, "with", friendUsername);
    } catch (err) {
      console.error("Failed to recreate room for friend", friendId, err);
    }
  }
});

EM_ASYNC_JS(void, create_friends_structure_in_indexed_db, (), {
  const db = await new Promise((resolve, reject) => {
    const openRequest = indexedDB.open("store", 2);

    openRequest.onupgradeneeded = () => {
      const db = openRequest.result;

      if (!db.objectStoreNames.contains("friends")) {
        const store = db.createObjectStore("friends", { keyPath: "friend_id" });
        store.createIndex("friend_id", "friend_id", { unique: true });
        store.createIndex("friend_username", "friend_username", { unique: false });
      }
    };

    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror  = () => reject(openRequest.error);
  });

  await new Promise((resolve, reject) => {
    const tx = db.transaction("friends", "readonly");
    const store = tx.objectStore("friends");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
});

EM_ASYNC_JS(void, save_user_graph_in_indexed_db, (const char *ug_json_cstr), {
  const ug_json_utf_8 = UTF8ToString(ug_json_cstr);
  const updatedUg = JSON.parse(ug_json_utf_8);
  const ugArray = Module.sharedDoc.getArray("social_graph");

  let idx = null;
  for (let i = 0; i < ugArray.length; i++) {
    if (ugArray.get(i).user_id == Number(updatedUg.user_id)) {
      idx = i;
      break;
    }
  }

  if (null != idx) {
    ugArray.delete(idx);
    ugArray.insert(idx, [updatedUg]);
  } else {
    ugArray.push([updatedUg]);
  }
});


    EM_ASYNC_JS(void, save_unfollow,
      (const char* user_id), {
      const userId = UTF8ToString(user_id);

      console.log("unfollow user of id", userId);

      const db = await new Promise((resolve, reject) => {
        const openRequest = indexedDB.open("store", 2);
        openRequest.onsuccess = () => resolve(openRequest.result);
        openRequest.onerror  = () => reject(openRequest.error);
      });

      await new Promise((resolve, reject) => {
        const tx = db.transaction("friends", "readwrite");
        const store = tx.objectStore("friends");

        const request = store.delete(userId);

        request.onsuccess = () => resolve();
        request.onerror   = () => reject(request.error);
      });
});

    EM_ASYNC_JS(void, save_follow_in_indexed_without_sending_friend_request,
      (const char* cur_user_name,
       const char* cur_user_id,
       const char* follow_id_str,
       const char* follow_username), {
      const curUserId = UTF8ToString(cur_user_id);
      const curUserName = UTF8ToString(cur_user_name);
      const friendId = UTF8ToString(follow_id_str);
      const friendUsername = UTF8ToString(follow_username);

      const db = await new Promise((resolve, reject) => {
        const openRequest = indexedDB.open("store", 2);
        openRequest.onsuccess = () => resolve(openRequest.result);
        openRequest.onerror  = () => reject(openRequest.error);
      });

      await new Promise((resolve, reject) => {
        const tx = db.transaction("friends", "readwrite");
        const store = tx.objectStore("friends");

        const request = store.put({
          friend_id: friendId,
          friend_username: friendUsername
        });

        request.onsuccess = () => resolve();
        request.onerror   = () => reject(request.error);
      });
});

EM_ASYNC_JS(void, save_follow_in_indexed_cb,
  (const char* cur_user_name,
   const char* cur_user_id,
   const char* follow_id_str,
   const char* follow_username), {

  const curUserId = UTF8ToString(cur_user_id);
  const curUserName = UTF8ToString(cur_user_name);
  const friendId = UTF8ToString(follow_id_str);
  const friendUsername = UTF8ToString(follow_username);

  const db = await new Promise((resolve, reject) => {
    const openRequest = indexedDB.open("store", 2);
    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror  = () => reject(openRequest.error);
  });

  await new Promise((resolve, reject) => {
    const tx = db.transaction("friends", "readwrite");
    const store = tx.objectStore("friends");

    const request = store.put({
      friend_id: friendId,
      friend_username: friendUsername
    });

    request.onsuccess = () => resolve();
    request.onerror   = () => reject(request.error);
  });

  Module.sendFriendRequest(
    curUserName,
    String(curUserId),
    String(friendId),
    friendUsername
  );
});

EM_ASYNC_JS(bool, get_is_following,
  (const char* follow_id_str), {

  const followId = UTF8ToString(follow_id_str);

  const db = await new Promise((resolve, reject) => {
    const openRequest = indexedDB.open("store", 2);
    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror  = () => reject(openRequest.error);
  });

  const friendRecord = await new Promise((resolve, reject) => {
    const tx = db.transaction("friends", "readonly");
    const store = tx.objectStore("friends");
    const req = store.get(followId);

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });

  return friendRecord != null && friendRecord != undefined;
});

SocialGraphHandler::SocialGraphHandler(SessionStorageUserService& sessionStorageUserService): sessionStorageUserService(sessionStorageUserService)  {
  create_friends_structure_in_indexed_db();
  auto loggedUser = this->sessionStorageUserService.getNullableLoggedUser();
    if (loggedUser == nullptr) {
        return;
    }
  recreate_friends_documents(loggedUser->getUsername().c_str(), std::to_string(loggedUser->getUserId()).c_str());
}

UserGraph *SocialGraphHandler::GetUserGraph(int64_t user_id) {
  for (auto &ug : this->social_graph) {
    if (ug.user_id == user_id)
      return &ug;
  }
  return nullptr;
}

void SocialGraphHandler::InsertUser(int64_t user_id, std::string username) {
  if (GetUserGraph(user_id) == nullptr) {
    UserGraph ug;
    ug.user_id = user_id;
    ug.username = username;

    // Add self-follow relationship
    ug.followers.push_back(user_id);
    ug.followees.push_back(user_id);

    this->social_graph.push_back(ug);
    save_user_graph_in_indexed_db(ug.toJson().dump().c_str());
  }
}

std::vector<int64_t> SocialGraphHandler::GetFollowers(const int64_t user_id) {
  UserGraph *ug = GetUserGraph(user_id);
  if (ug)
    return ug->followers;
  return {};
}

std::vector<int64_t> SocialGraphHandler::GetFollowees(const int64_t user_id) {
  UserGraph *ug = GetUserGraph(user_id);
  if (ug)
    return ug->followees;
  return {};
}

bool SocialGraphHandler::GetIsFollowing(const std::string user_id) {
    return get_is_following(user_id.c_str());
}

std::vector<int64_t> SocialGraphHandler::GetFriends(const int64_t user_id) {
  UserGraph *ug = GetUserGraph(user_id);
  if (ug)
    return ug->friends;
  return {};
}

void SocialGraphHandler::SaveFollow(const std::string user_id, const std::string username) {
    auto loggedUser = this->sessionStorageUserService.getLoggedUser();

    save_follow_in_indexed_cb(loggedUser.getUsername().c_str(), std::to_string(loggedUser.getUserId()).c_str(), user_id.c_str(), username.c_str());
}


void SocialGraphHandler::SaveFollowWithoutSendingFriendRequest(const std::string user_id, const std::string username) {
    auto loggedUser = this->sessionStorageUserService.getLoggedUser();
    save_follow_in_indexed_without_sending_friend_request(loggedUser.getUsername().c_str(), std::to_string(loggedUser.getUserId()).c_str(), user_id.c_str(), username.c_str());
}

void SocialGraphHandler::Unfollow(const std::string user_id) {
    save_unfollow(user_id.c_str());
}

EMSCRIPTEN_BINDINGS(social_graph_module) {
  class_<SocialGraphHandler>("SocialGraphHandler")
      .constructor<SessionStorageUserService &>()
      .function("InsertUser", &SocialGraphHandler::InsertUser)
      .function("GetFollowers", &SocialGraphHandler::GetFollowers)
      .function("GetFollowees", &SocialGraphHandler::GetFollowees)
      .function("GetFriends", &SocialGraphHandler::GetFriends)
      .function("SaveFollow", &SocialGraphHandler::SaveFollow)
      .function("Unfollow", &SocialGraphHandler::Unfollow)
      .function("GetIsFollowing", &SocialGraphHandler::GetIsFollowing)
      .function("SaveFollowWithoutSendingFriendRequest", &SocialGraphHandler::SaveFollowWithoutSendingFriendRequest);
}
