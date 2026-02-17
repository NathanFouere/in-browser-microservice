#pragma once

#include <cstdint>
#include <string>
#include <vector>

#include <nlohmann/json.hpp>
#include "../SessionStorageUserService/SessionStorageUserService.hpp"

using nlohmann::json;

struct UserGraph {
  int64_t user_id;
  std::string username;
  std::vector<int64_t> followers;
  std::vector<int64_t> followees;
  std::vector<int64_t> friends;

  static UserGraph fromJson(const json &j) {
    UserGraph ug;
    ug.user_id = j.at("user_id").get<int64_t>();
    if (j.contains("username"))
      ug.username = j.at("username").get<std::string>();
    if (j.contains("followers"))
      ug.followers = j.at("followers").get<std::vector<int64_t>>();
    if (j.contains("followees"))
      ug.followees = j.at("followees").get<std::vector<int64_t>>();
    if (j.contains("friends"))
      ug.friends = j.at("friends").get<std::vector<int64_t>>();
    return ug;
  }

  json toJson() const {
    return json{{"user_id", user_id},
                {"username", username},
                {"followers", followers},
                {"followees", followees},
                {"friends", friends}};
  }
};

class SocialGraphHandler {
public:
  SocialGraphHandler(SessionStorageUserService& sessionStorageUserService);
  void InsertUser(int64_t, std::string);
  void CreateSelfFollow(int64_t user_id);
  std::vector<int64_t> GetFollowers(const int64_t user_id);
  std::vector<int64_t> GetFollowees(const int64_t user_id);
  std::vector<int64_t> GetFriends(const int64_t user_id);
  void SaveFollow(const std::string user_id, const std::string username);
  void SaveFollowWithoutSendingFriendRequest(const std::string user_id, const std::string username);
  void Unfollow(const std::string user_id);
  bool GetIsFollowing(const std::string user_id);

private:
  std::vector<UserGraph> social_graph;
  SessionStorageUserService& sessionStorageUserService;
  UserGraph *GetUserGraph(int64_t user_id);
};
