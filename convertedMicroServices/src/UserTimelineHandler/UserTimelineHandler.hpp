#pragma once

#include "../PostStorageHandler/PostStorageHandler.hpp"
#include "../Types/Post/Post.hpp"
#include <cstdint>
#include <vector>

class UserTimelineHandler {
    public: 
        UserTimelineHandler(PostStorageHandler& postStorageHandler);
        void WriteUserTimeline(int64_t post_id, int64_t user_id, int64_t timestamp);
        std::vector<Post> ReadUserTimeline(int64_t user_id, int start, int stop);
    private: 
        PostStorageHandler& postStorageHandler;
};