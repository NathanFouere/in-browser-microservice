#pragma once

#include "../PostStorageHandler/PostStorageHandler.hpp"
#include "../SocialGraphHandler/SocialGraphHandler.hpp"
#include "../Types/Post/Post.hpp"
#include <cstdint>
#include <vector>

class HomeTimelineHandler {
public:
  HomeTimelineHandler(PostStorageHandler &postStorageHandler,
                      SocialGraphHandler &socialGraphHandler);
  std::vector<Post> ReadHomeTimeline(int64_t user_id, int start_idx,
                                     int stop_idx,
                                     std::string sort_order);
  void WriteHomeTimeline(int64_t post_id, int64_t user_id, int64_t timestamp,
                         const std::vector<int64_t> &user_mentions_id);

private:
  PostStorageHandler &postStorageHandler;
  SocialGraphHandler &socialGraphHandler;
};
