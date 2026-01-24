#pragma once

#include "../Types/Post/Post.hpp"
#include <cstdint>
#include <vector>
#include "../Types/Creator/Creator.hpp"

class PostStorageHandler {
    public:
        PostStorageHandler();
        void StorePost(const Post &post);
        Post* ReadPost(int64_t post_id);
        std::vector<Post> GetAllPosts();
        std::vector<Post> GetPostsByUserId(int64_t user_id) const;
        void DeletePost(int64_t post_id);
        Post* GetPostById(int64_t post_id);
        std::vector<Post> GetPostsBetweenIdx(int start_idx, int stop_idx) const;
        void EditPostText(int64_t post_id, std::string newText);
    private:
        std::vector<Post> posts;
};
