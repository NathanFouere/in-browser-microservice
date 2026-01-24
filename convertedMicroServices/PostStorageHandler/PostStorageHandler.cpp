#include "PostStorageHandler.hpp"
#include <cstddef>
#include <cstdint>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <nlohmann/json.hpp>

using namespace emscripten;
using nlohmann::json;

EM_JS(void, edit_post_in_indexed_db, (const char *post_json_cstr), {
  const updatedPost = JSON.parse(UTF8ToString(post_json_cstr));
  for (const userId in Module.connections) {
    const entry = Module.connections[userId];
    if (!entry || !entry.doc) continue;

    const postsArray = entry.doc.getArray("posts");

    for (let i = 0; i < postsArray.length; i++) {
      if (postsArray.get(i).post_id === Number(updatedPost.post_id)) {
        postsArray.delete(i);
        postsArray.insert(i, [updatedPost]);
        break;
      }
    }
  }
});


EM_JS(void, delete_post_in_indexed_db, (int64_t post_id), {
  for (const userId in Module.connections) {
    const entry = Module.connections[userId];
    if (!entry || !entry.doc) continue;

    const postsArray = entry.doc.getArray("posts");

    for (let i = 0; i < postsArray.length; i++) {
      if (postsArray.get(i).post_id === Number(post_id)) {
        postsArray.delete(i);
        break;
      }
    }
  }
});


EM_JS(char *, get_posts_from_indexed_db, (), {
  const aggregatedPosts = [];

  for (const userId in Module.connections) {
    const entry = Module.connections[userId];
    if (!entry || !entry.doc) continue;

    const postsArray = entry.doc.getArray("posts");

    for (const post of postsArray.toArray()) {
      aggregatedPosts.push(post);
    }
  }

  console.log("posts in index" + aggregatedPosts.length + " " + JSON.stringify(aggregatedPosts));
  return stringToNewUTF8(JSON.stringify(aggregatedPosts));
});



EM_JS(void, save_post_in_indexed_db, (const char *post_json_cstr), {
  const post = JSON.parse(UTF8ToString(post_json_cstr));
  if (!Module.connections) {
      return;
  }

  for (const userId in Module.connections) {
    const connection = Module.connections[userId];
    if (!connection || !connection.doc) continue;

    const postsArray = connection.doc.getArray("posts");
    postsArray.push([post]);
    console.log(`Post saved for user ${userId}`);
  }
});


PostStorageHandler::PostStorageHandler() {
  auto postsFromIndexedDb = get_posts_from_indexed_db();
  if (postsFromIndexedDb != nullptr) {
    json postsJson = json::parse(postsFromIndexedDb);
    for (json postJson : postsJson) {
      this->posts.push_back(Post::fromJson(postJson));
    }
  }
}

std::vector<Post> PostStorageHandler::GetPostsBetweenIdx(int start_idx,
                                                         int stop_idx) const {
  std::vector<Post> postToReturn;
  for (std::size_t i = start_idx; i < stop_idx; i++) {
    if (i >= this->posts.size()) {
      return postToReturn;
    }
    postToReturn.push_back(this->posts.at(i));
  }

  return postToReturn;
}

std::vector<Post> PostStorageHandler::GetAllPosts() {
    auto postsFromIndexedDb = get_posts_from_indexed_db();
    if (postsFromIndexedDb != nullptr) {
      json postsJson = json::parse(postsFromIndexedDb);
      for (json postJson : postsJson) {
        this->posts.push_back(Post::fromJson(postJson));
      }
    }
    return this->posts;
}


void PostStorageHandler::EditPostText(int64_t post_id, std::string newText) {
  for (std::size_t i = 0; i < posts.size(); i++) {
    if (this->posts[i].post_id == post_id) {
      this->posts[i].setText(newText);
      edit_post_in_indexed_db(this->posts[i].toJson().dump().c_str());
      return;
    }
  }
}

void PostStorageHandler::DeletePost(int64_t post_id) {
  for (std::size_t i = 0; i < posts.size(); i++) {
    if (this->posts[i].post_id == post_id) {
      std::cout << "delete_post_in_indexed_db" << "   "
                << this->posts[i].post_id << std::endl;

      delete_post_in_indexed_db(this->posts[i].post_id);
      this->posts.erase(this->posts.begin() + i);
      return;
    }
  }
}

Post *PostStorageHandler::GetPostById(int64_t post_id) {
  for (Post &post : this->posts) {
    if (post.post_id == post_id) {
      return &post;
    }
  }
  return nullptr;
}

void PostStorageHandler::StorePost(const Post &post) {
  this->posts.push_back(post);
  save_post_in_indexed_db(post.toJson().dump().c_str());
}

Post *PostStorageHandler::ReadPost(int64_t post_id) {
  for (Post &post : this->posts) {
    if (post.post_id == post_id) {
      return &post;
    }
  }
  return nullptr;
}

EMSCRIPTEN_BINDINGS(post_storage_Module) {
  class_<PostStorageHandler>("PostStorageHandler")
      .constructor<>()
      .function("StorePost", &PostStorageHandler::StorePost)
      .function("DeletePost", &PostStorageHandler::DeletePost)
      .function("EditPostText", &PostStorageHandler::EditPostText);
}
