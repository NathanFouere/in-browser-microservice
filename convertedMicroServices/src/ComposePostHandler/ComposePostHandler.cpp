#include "ComposePostHandler.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

ComposePostHandler::ComposePostHandler(
    UserTimelineHandler& userTimelineHandler,
    UserHandler& userHandler,
    UniqueIdHandler& uniqueIdHandler,
    MediaHandler& mediaHandler,
    TextHandler& textHandler,
    HomeTimelineHandler& homeTimelineHandler,
    PostStorageHandler& postStorageHandler
) : userTimelineHandler(userTimelineHandler),
    userHandler(userHandler),
    uniqueIdHandler(uniqueIdHandler),
    mediaHandler(mediaHandler),
    textHandler(textHandler),
    homeTimelineHandler(homeTimelineHandler),
    postStorageHandler(postStorageHandler)
{}

Post ComposePostHandler::ComposePost(
    const std::string &username,
    int64_t user_id,
    const std::string &text,
    PostType::type post_type
) {
    Post* post = new Post();
    post->setPostId(this->uniqueIdHandler.ComposeUniqueId());
    Creator* creator = new Creator();
    creator->setUserId(user_id);
    creator->setUsername(username);
    post->setCreator(*creator);
    post->setText(text);
    post->setPostType(post_type);
    time_t timestamp;
    time(&timestamp);
    post->setTimestamp(timestamp);
    
    this->postStorageHandler.StorePost(*post);
    return *post;
}

EMSCRIPTEN_BINDINGS(compose_post_handler) {
    class_<ComposePostHandler>("ComposePostHandler")
        .constructor<
            UserTimelineHandler&,
            UserHandler&,
            UniqueIdHandler&,
            MediaHandler&,
            TextHandler&,
            HomeTimelineHandler&,
            PostStorageHandler&
        >()
        .function("ComposePost", &ComposePostHandler::ComposePost)
    ;
}
