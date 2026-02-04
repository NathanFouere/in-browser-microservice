#include "HomeTimelineHandler.hpp"
#include <emscripten/bind.h>
#include <unordered_set>

using namespace emscripten;

HomeTimelineHandler::HomeTimelineHandler(PostStorageHandler &postStorageHandler,
                                         SocialGraphHandler &socialGraphHandler)
    : postStorageHandler(postStorageHandler),
      socialGraphHandler(socialGraphHandler) {};

std::vector<Post>
HomeTimelineHandler::ReadHomeTimeline(int64_t user_id, int start_idx,
                                      int stop_idx, std::string sort_order) {

  std::vector<Post> posts = this->postStorageHandler.GetAllPosts();

  // Sort posts based on sort_order
  if (sort_order == "desc") { // Newest first
    std::sort(posts.begin(), posts.end(), [](const Post &a, const Post &b) {
      if (a.timestamp != b.timestamp) {
        return a.timestamp > b.timestamp;
      }
      return a.post_id > b.post_id; // Tie-breaker: higher ID (newer) first
    });
  } else if (sort_order == "asc") { // Oldest first
    std::sort(posts.begin(), posts.end(), [](const Post &a, const Post &b) {
      if (a.timestamp != b.timestamp) {
        return a.timestamp < b.timestamp;
      }
      return a.post_id < b.post_id; // Tie-breaker: lower ID (older) first
    });
  }

  std::cout << "ReadHomeTimeline called. "
            << " Sort_order: " << sort_order << std::endl;
  std::cout << "ReadHomeTimeline: Total posts fetched from storage: "
            << posts.size() << std::endl;

  std::vector<int64_t> followees =
      this->socialGraphHandler.GetFollowees(user_id);
  std::vector<int64_t> friends = this->socialGraphHandler.GetFriends(user_id);

  std::unordered_set<int64_t> allowed_ids;
  allowed_ids.insert(followees.begin(), followees.end());
  allowed_ids.insert(friends.begin(), friends.end());
  allowed_ids.insert(user_id);

  std::cout << "ReadHomeTimeline: Filtering. Allowed IDs count: "
            << allowed_ids.size() << std::endl;

  std::vector<Post> filtered_posts;
  filtered_posts.reserve(posts.size());

  for (const auto &post : posts) {
    if (allowed_ids.find(post.creator.user_id) != allowed_ids.end()) {
      filtered_posts.push_back(post);
    }
  }

  std::cout << "ReadHomeTimeline: Posts after filtering: "
            << filtered_posts.size() << std::endl;

  std::vector<Post> paged_posts;
  for (size_t i = start_idx; i < filtered_posts.size() && i < (size_t)stop_idx;
       ++i) {
    paged_posts.push_back(filtered_posts[i]);
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