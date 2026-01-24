#include "HomeTimelineHandler.hpp"
#include <emscripten/bind.h>
#include <unordered_set>

using namespace emscripten;

HomeTimelineHandler::HomeTimelineHandler(PostStorageHandler &postStorageHandler,
                                         SocialGraphHandler &socialGraphHandler)
    : postStorageHandler(postStorageHandler),
      socialGraphHandler(socialGraphHandler) {};

std::vector<Post> HomeTimelineHandler::ReadHomeTimeline(int64_t user_id,
                                                        int start_idx,
                                                        int stop_idx,
                                                        bool only_friends) {

  std::vector<Post> posts = this->postStorageHandler.GetAllPosts();


  if (only_friends) {
    std::vector<int64_t> followees =
        this->socialGraphHandler.GetFollowees(user_id);
    std::vector<int64_t> friends = this->socialGraphHandler.GetFriends(user_id);

    std::unordered_set<int64_t> allowed_ids;
    allowed_ids.insert(followees.begin(), followees.end());
    allowed_ids.insert(friends.begin(), friends.end());
    allowed_ids.insert(user_id);


    std::vector<Post> filtered_posts;
    filtered_posts.reserve(posts.size());

    for (const auto &post : posts) {
      if (allowed_ids.find(post.creator.user_id) != allowed_ids.end()) {
        filtered_posts.push_back(post);
      }
    }


    std::vector<Post> paged_posts;
    for (size_t i = start_idx;
         i < filtered_posts.size() && i < (size_t)stop_idx; ++i) {
      paged_posts.push_back(filtered_posts[i]);
    }
    return paged_posts;
  }

  std::vector<Post> paged_posts;
  for (size_t i = start_idx; i < posts.size() && i < (size_t)stop_idx; ++i) {
    paged_posts.push_back(posts[i]);
  }
  return paged_posts;
};

void HomeTimelineHandler::WriteHomeTimeline(
    int64_t post_id, int64_t user_id, int64_t timestamp,
    const std::vector<int64_t> &user_mentions_id) {
  std::cout << "WriteHomeTimeline appelé" << std::endl;
};

EMSCRIPTEN_BINDINGS(home_timeline_module) {
  class_<HomeTimelineHandler>("HomeTimelineHandler")
      .constructor<PostStorageHandler &, SocialGraphHandler &>()
      .function("ReadHomeTimeline", &HomeTimelineHandler::ReadHomeTimeline)
      .function("WriteHomeTimeline", &HomeTimelineHandler::WriteHomeTimeline);
}
