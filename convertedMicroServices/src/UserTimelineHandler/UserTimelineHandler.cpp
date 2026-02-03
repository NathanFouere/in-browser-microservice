#include "UserTimelineHandler.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

UserTimelineHandler::UserTimelineHandler(PostStorageHandler &postStorageHandler)
    : postStorageHandler(postStorageHandler) {}

void UserTimelineHandler::WriteUserTimeline(int64_t post_id, int64_t user_id,
                                            int64_t timestamp) {
  std::cout << "WriteUserTimeline Appelé" << std::endl;
}

std::vector<Post> UserTimelineHandler::ReadUserTimeline(int64_t user_id,
                                                        int start, int stop) {
  std::cout << "ReadUserTimeline Appelé" << std::endl;

  Post *fakePost = new Post();

  std::vector<Post> fakePosts = {*fakePost};

  return fakePosts;
}

EMSCRIPTEN_BINDINGS(user_timeline_module) {
  class_<UserTimelineHandler>("UserTimelineHandler")
      .constructor<PostStorageHandler &>()
      .function("WriteUserTimeline", &UserTimelineHandler::WriteUserTimeline)
      .function("ReadUserTimeline", &UserTimelineHandler::ReadUserTimeline);
}
