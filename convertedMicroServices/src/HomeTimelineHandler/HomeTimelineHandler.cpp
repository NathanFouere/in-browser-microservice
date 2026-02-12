#include "HomeTimelineHandler.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

HomeTimelineHandler::HomeTimelineHandler(PostStorageHandler &postStorageHandler,
                                         SocialGraphHandler &socialGraphHandler)
    : postStorageHandler(postStorageHandler),
      socialGraphHandler(socialGraphHandler) {};

std::vector<Post> HomeTimelineHandler::ReadHomeTimeline(int64_t user_id,
                                                        int start_idx,
                                                        int stop_idx,
                                                        bool only_friends,
                                                        std::string sort_order) {

  std::vector<Post> posts = this->postStorageHandler.GetAllPosts();

  // Sort posts based on sort_order BEFORE pagination
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

  std::cout << "ReadHomeTimeline: Total posts: " << posts.size()
            << ", Sort: " << sort_order << std::endl;

  // No filtering needed: Yjs only syncs posts with friends already
  // Pagination
  std::vector<Post> paged_posts;
  for (size_t i = start_idx; i < posts.size() && i < (size_t)stop_idx; ++i) {
    paged_posts.push_back(posts[i]);
  }
  return paged_posts;
}

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
