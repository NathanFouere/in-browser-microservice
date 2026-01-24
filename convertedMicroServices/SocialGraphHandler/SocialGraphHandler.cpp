#include "SocialGraphHandler.hpp"
#include <algorithm>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <iostream>

using namespace emscripten;
using nlohmann::json;

EM_ASYNC_JS(char *, get_social_graph_from_indexed_db, (), {
  const val = Module.sharedDoc.getArray("social_graph");
  return stringToNewUTF8(JSON.stringify(val));
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

EM_ASYNC_JS(void, create_follow_structure_in_indexed_db, (), {
  const db = await new Promise((resolve, reject) => {
    const openRequest = indexedDB.open("store", 1);

    openRequest.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains("follow")) {
        db.createObjectStore("follow", {
          keyPath: "userId"
        });
      }
    };

    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror  = () => reject(openRequest.error);
  });
});

EM_ASYNC_JS(void, save_follow_in_indexed_cb, (const char* follow_id_str), {
  const userIdStr = UTF8ToString(follow_id_str);

  const db = await new Promise((resolve, reject) => {
    const openRequest = indexedDB.open("store", 1);
    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror  = () => reject(openRequest.error);
  });

  await new Promise((resolve, reject) => {
    const tx = db.transaction("follow", "readwrite");
    const store = tx.objectStore("follow");

    store.put({ userId: userIdStr });

    tx.oncomplete = resolve;
    tx.onerror = reject;
  });

  // ici on s'ajoute au doc partagé

  Module.createYdocAndRoom("tdodo", follow_id_str);
});

SocialGraphHandler::SocialGraphHandler() {
  create_follow_structure_in_indexed_db();
  auto jsonStr = get_social_graph_from_indexed_db();
  if (jsonStr != nullptr) {
    json j = json::parse(jsonStr);
    for (const auto &item : j) {
      this->social_graph.push_back(UserGraph::fromJson(item));
    }
  }
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

std::vector<int64_t> SocialGraphHandler::GetFriends(const int64_t user_id) {
  UserGraph *ug = GetUserGraph(user_id);
  if (ug)
    return ug->friends;
  return {};
}
void SocialGraphHandler::SaveFollow(const std::string user_id) {
    save_follow_in_indexed_cb(user_id.c_str());
}

void SocialGraphHandler::Follow(int64_t user_id, int64_t followee_id) {
  UserGraph *u = GetUserGraph(user_id);
  UserGraph *f = GetUserGraph(followee_id);

  if (!u || !f)
    return;

  // Add to followees of user_id
  if (std::find(u->followees.begin(), u->followees.end(), followee_id) ==
      u->followees.end()) {
    u->followees.push_back(followee_id);
  }

  // Add to followers of followee_id
  if (std::find(f->followers.begin(), f->followers.end(), user_id) ==
      f->followers.end()) {
    f->followers.push_back(user_id);
  }

  // Check mutual friendship
  // If followee_id follows user_id (is in u's followers)
  bool isMutual = std::find(u->followers.begin(), u->followers.end(),
                            followee_id) != u->followers.end();

  if (isMutual) {
    // Add friends
    if (std::find(u->friends.begin(), u->friends.end(), followee_id) ==
        u->friends.end()) {
      u->friends.push_back(followee_id);
    }

    if (std::find(f->friends.begin(), f->friends.end(), user_id) ==
        f->friends.end()) {
      f->friends.push_back(user_id);
    }
  }

  std::cout << "User " << user_id << " followed " << followee_id
            << (isMutual ? " (mutual friendship established)" : "") << std::endl;
  save_user_graph_in_indexed_db(u->toJson().dump().c_str());
  save_user_graph_in_indexed_db(f->toJson().dump().c_str());
}

void SocialGraphHandler::Unfollow(int64_t user_id, int64_t followee_id) {
  UserGraph *u = GetUserGraph(user_id);
  UserGraph *f = GetUserGraph(followee_id);

  if (!u || !f)
    return;

  // Remove from followees
  u->followees.erase(
      std::remove(u->followees.begin(), u->followees.end(), followee_id),
      u->followees.end());

  // Remove from followers
  f->followers.erase(
      std::remove(f->followers.begin(), f->followers.end(), user_id),
      f->followers.end());

  // Remove from friends (friendship broken)
  u->friends.erase(
      std::remove(u->friends.begin(), u->friends.end(), followee_id),
      u->friends.end());
  f->friends.erase(std::remove(f->friends.begin(), f->friends.end(), user_id),
                   f->friends.end());

  save_user_graph_in_indexed_db(u->toJson().dump().c_str());
  save_user_graph_in_indexed_db(f->toJson().dump().c_str());
}

void SocialGraphHandler::FollowWithUsername(const std::string &user_name,
                                            const std::string &followee_name) {
  int64_t id1 = -1, id2 = -1;
  for (auto &ug : this->social_graph) {
    if (ug.username == user_name)
      id1 = ug.user_id;
    if (ug.username == followee_name)
      id2 = ug.user_id;
  }

  if (id1 != -1 && id2 != -1)
    Follow(id1, id2);
}

void SocialGraphHandler::UnfollowWithUsername(
    const std::string &user_name, const std::string &followee_name) {
  int64_t id1 = -1, id2 = -1;
  for (auto &ug : this->social_graph) {
    if (ug.username == user_name)
      id1 = ug.user_id;
    if (ug.username == followee_name)
      id2 = ug.user_id;
  }

  if (id1 != -1 && id2 != -1)
    Unfollow(id1, id2);
}

EMSCRIPTEN_BINDINGS(social_graph_module) {
  class_<SocialGraphHandler>("SocialGraphHandler")
      .constructor<>()
      .function("InsertUser", &SocialGraphHandler::InsertUser)
      .function("GetFollowers", &SocialGraphHandler::GetFollowers)
      .function("GetFollowees", &SocialGraphHandler::GetFollowees)
      .function("GetFriends", &SocialGraphHandler::GetFriends)
      .function("SaveFollow", &SocialGraphHandler::SaveFollow)
      .function("Follow", &SocialGraphHandler::Follow)
      .function("Unfollow", &SocialGraphHandler::Unfollow)
      .function("FollowWithUsername", &SocialGraphHandler::FollowWithUsername)
      .function("UnfollowWithUsername",
                &SocialGraphHandler::UnfollowWithUsername);
}
