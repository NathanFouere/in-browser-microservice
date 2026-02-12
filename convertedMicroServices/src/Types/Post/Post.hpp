#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <map>
#include "../Creator/Creator.hpp"
#include "../UserMention/UserMention.hpp"
#include "PostType.hpp"
#include <nlohmann/json.hpp>

using nlohmann::json;

// Use PostType::type defined in PostType.hpp

class Post {
  public:
    Post() noexcept
      : post_id(0), creator(), text(), timestamp(0), send_timestamp_ms(0), post_type(PostType::POST) {}
    static Post fromJson(const json& j);
    json toJson() const;

    int64_t getPostId() const;
    void setPostId(int64_t v);

    Creator getCreator() const;
    void setCreator(const Creator &c);

    int64_t getReqId() const;
    void setReqId(int64_t v);

    std::string getText() const;
    void setText(const std::string &t);

    std::vector<UserMention> getUserMentions() const;
    void setUserMentions(const std::vector<UserMention> &ums);

    int64_t getTimestamp() const;
    void setTimestamp(int64_t t);

    int64_t getSendTimestampMs() const;
    void setSendTimestampMs(int64_t t);

    PostType::type getPostType() const;
    void setPostType(PostType::type pt);

    int64_t post_id;
    Creator creator;
    std::string text;
    int64_t timestamp;
    int64_t send_timestamp_ms;
    PostType::type post_type;
};
