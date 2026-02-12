#include "Post.hpp"
#include "PostType.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

int64_t Post::getPostId() const {
    return this->post_id;
}

json Post::toJson() const {
    json j;
    j["post_id"] = post_id;
    j["creator"] = creator.toJson();
    j["text"] = text;
    j["timestamp"] = timestamp;
    j["send_timestamp_ms"] = send_timestamp_ms;
    j["post_type"] = post_type; 
    return j;
}

Post Post::fromJson(const json& j) {
    Post* post = new Post();
    post->setPostId(j["post_id"]);

    Creator creator = Creator::fromJson(j["creator"]);
    post->setCreator(creator);
    post->setText(j["text"]);
    post->setTimestamp(j["timestamp"].get<int>());
    
    // Handle send_timestamp_ms (optional for backward compatibility)
    if (j.contains("send_timestamp_ms")) {
        post->setSendTimestampMs(j["send_timestamp_ms"].get<int64_t>());
    } else {
        post->setSendTimestampMs(0);
    }
    
    post->setPostType(PostType::POST);

    return *post;
}

void Post::setPostId(int64_t _post_id) {
    this->post_id = _post_id;
}

void Post::setCreator(const class Creator& _creator) {
    this->creator = _creator;
}

class Creator Post::getCreator() const {
    return this->creator;
}

void Post::setText(const std::string& _text) {
    this->text = _text;
}

std::string Post::getText() const {
    return this->text;
}

void Post::setTimestamp(int64_t _timestamp) {
    this->timestamp = _timestamp;
}

int64_t Post::getTimestamp() const {
    return this->timestamp;
}

void Post::setPostType(PostType::type _post_type) {
    this->post_type = _post_type;
}

PostType::type Post::getPostType() const {
    return this->post_type;
}

void Post::setSendTimestampMs(int64_t _send_timestamp_ms) {
    this->send_timestamp_ms = _send_timestamp_ms;
}

int64_t Post::getSendTimestampMs() const {
    return this->send_timestamp_ms;
}

EMSCRIPTEN_BINDINGS(post_module) {
    class_<Post>("Post")
        .constructor<>()
        .property("post_id", &Post::getPostId, &Post::setPostId)
        .property("creator", &Post::getCreator, &Post::setCreator)
        .property("text", &Post::getText, &Post::setText)
        .property("timestamp", &Post::getTimestamp, &Post::setTimestamp)
        .property("send_timestamp_ms", &Post::getSendTimestampMs, &Post::setSendTimestampMs)
        .property("post_type", &Post::getPostType, &Post::setPostType)
    ;

    register_vector<UserMention>("UserMentionList");

    register_vector<Post>("PostList");
    register_vector<std::int64_t>("IntList");
    register_vector<std::string>("StringList");
    register_map<std::string, std::string>("StringStringMap");
}
