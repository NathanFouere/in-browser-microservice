#pragma once

#include <cstdint>
#include <iostream>
#include <string>
#include <vector>
#include <time.h>
#include "../Types/Post/Post.hpp"
#include "../UserTimelineHandler/UserTimelineHandler.hpp"
#include "../UserHandler/UserHandler.hpp"
#include "../UniqueIdHandler/UniqueIdHandler.hpp"
#include "../MediaHandler/MediaHandler.hpp"
#include "../TextHandler/TextHandler.hpp"
#include "../HomeTimelineHandler/HomeTimelineHandler.hpp"
#include "../Types/Post/Post.hpp"
#include "../PostStorageHandler/PostStorageHandler.hpp"
#include <vector>

class ComposePostHandler {
    public:
        ComposePostHandler(
            UserTimelineHandler& userTimelineHandler,
            UserHandler& userHandler,
            UniqueIdHandler& uniqueIdHandler,
            MediaHandler& mediaHandler,
            TextHandler& textHandler,
            HomeTimelineHandler& homeTimelineHandler,
            PostStorageHandler& PostStorageHandler
        );

        Post ComposePost(
            const std::string &username,
            int64_t user_id,
            const std::string &text,
            PostType::type post_type
        );
    private:
        UserTimelineHandler& userTimelineHandler;
        UserHandler& userHandler;
        UniqueIdHandler& uniqueIdHandler;
        MediaHandler& mediaHandler;
        TextHandler& textHandler;
        HomeTimelineHandler& homeTimelineHandler;
        PostStorageHandler& postStorageHandler;
};
