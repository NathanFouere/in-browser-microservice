#include "SocialGraphHandler.hpp"
#include <algorithm>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <iostream>

using namespace emscripten;
using nlohmann::json;

EM_JS(char *, get_social_graph_from_yjs, (), {
  const val = Module.ydoc.getArray("social_graph");
  return stringToNewUTF8(JSON.stringify(val.toArray()));
});

EM_JS(void, save_user_graph_to_yjs, (const char *ug_json_cstr), {
  const ug_json_utf_8 = UTF8ToString(ug_json_cstr);
  const updatedUg = JSON.parse(ug_json_utf_8);
  const ugArray = Module.ydoc.getArray("social_graph");

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

SocialGraphHandler::SocialGraphHandler() { ReloadGraph(); }

void SocialGraphHandler::ReloadGraph() {
  this->social_graph.clear();
  auto jsonStr = get_social_graph_from_yjs();
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

UserGraph *SocialGraphHandler::GetUserGraphByName(const std::string &username) {
  for (auto &ug : this->social_graph) {
    if (ug.username == username)
      return &ug;
  }
  return nullptr;
}

std::string SocialGraphHandler::GetUsernameFromId(int64_t user_id) {
  UserGraph *ug = GetUserGraph(user_id);
  if (ug)
    return ug->username;
  return "ID:" + std::to_string(user_id);
}

void SocialGraphHandler::InsertUser(int64_t user_id, std::string username) {
  if (GetUserGraph(user_id) == nullptr) {
    UserGraph ug;
    ug.user_id = user_id;
    ug.username = username;
    this->social_graph.push_back(ug);
    save_user_graph_to_yjs(ug.toJson().dump().c_str());
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

std::vector<std::string>
SocialGraphHandler::GetFollowerNames(const std::string &username) {
  UserGraph *ug = GetUserGraphByName(username);
  std::vector<std::string> names;
  if (ug) {
    for (int64_t id : ug->followers) {
      names.push_back(GetUsernameFromId(id));
    }
  }
  return names;
}

std::vector<std::string>
SocialGraphHandler::GetFolloweeNames(const std::string &username) {
  UserGraph *ug = GetUserGraphByName(username);
  std::vector<std::string> names;
  if (ug) {
    for (int64_t id : ug->followees) {
      names.push_back(GetUsernameFromId(id));
    }
  }
  return names;
}

std::vector<std::string>
SocialGraphHandler::GetFriendNames(const std::string &username) {
  UserGraph *ug = GetUserGraphByName(username);
  std::vector<std::string> names;
  if (ug) {
    for (int64_t id : ug->friends) {
      names.push_back(GetUsernameFromId(id));
    }
  }
  return names;
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

  save_user_graph_to_yjs(u->toJson().dump().c_str());
  save_user_graph_to_yjs(f->toJson().dump().c_str());
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

  save_user_graph_to_yjs(u->toJson().dump().c_str());
  save_user_graph_to_yjs(f->toJson().dump().c_str());
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

void SocialGraphHandler::HandleFollowAction(const std::string &me_username,
                                            const std::string &target_input,
                                            bool is_unfollow) {
  ReloadGraph(); // Ensure data is fresh

  UserGraph *me = GetUserGraphByName(me_username);
  if (!me)
    return;

  // Check if target_input is an ID
  bool is_id = !target_input.empty() &&
               std::all_of(target_input.begin(), target_input.end(), ::isdigit);

  if (is_id) {
    int64_t target_id = std::stoll(target_input);
    if (is_unfollow)
      Unfollow(me->user_id, target_id);
    else
      Follow(me->user_id, target_id);
  } else {
    if (is_unfollow)
      UnfollowWithUsername(me_username, target_input);
    else
      FollowWithUsername(me_username, target_input);
  }
}

EMSCRIPTEN_BINDINGS(social_graph_module) {
  // register_vector<int64_t>("Int64Vector");
  // register_vector<std::string>("StringVector");

  class_<SocialGraphHandler>("SocialGraphHandler")
      .constructor<>()
      .function("ReloadGraph", &SocialGraphHandler::ReloadGraph)
      .function("InsertUser", &SocialGraphHandler::InsertUser)
      .function("GetFollowers", &SocialGraphHandler::GetFollowers)
      .function("GetFollowees", &SocialGraphHandler::GetFollowees)
      .function("GetFriends", &SocialGraphHandler::GetFriends)
      .function("GetFollowerNames", &SocialGraphHandler::GetFollowerNames)
      .function("GetFolloweeNames", &SocialGraphHandler::GetFolloweeNames)
      .function("GetFriendNames", &SocialGraphHandler::GetFriendNames)
      .function("Follow", &SocialGraphHandler::Follow)
      .function("Unfollow", &SocialGraphHandler::Unfollow)
      .function("FollowWithUsername", &SocialGraphHandler::FollowWithUsername)
      .function("UnfollowWithUsername",
                &SocialGraphHandler::UnfollowWithUsername)
      .function("HandleFollowAction", &SocialGraphHandler::HandleFollowAction);
}
