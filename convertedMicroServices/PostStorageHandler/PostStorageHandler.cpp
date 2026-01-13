#include "PostStorageHandler.hpp"
#include <cstddef>
#include <cstdint>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <nlohmann/json.hpp>

using namespace emscripten;
using nlohmann::json;

EM_JS(void, edit_post_in_indexed_db, (const char *post_json_cstr), {
  const post_json_utf_8 = UTF8ToString(post_json_cstr);
  const updatedPost = JSON.parse(post_json_utf_8);
  console.log(updatedPost);

  const postsArray = Module.ydoc.getArray("posts");
  let idxOfPost = null;
  for (let i = 0; i < postsArray.length; i++) {
    if (postsArray.get(i).post_id ==
        Number(updatedPost.post_id)) { // oblider de faire la conversion à cause
                                       // de big int
      idxOfPost = i;
      break;
    }
  }

  // cf .
  // https://discuss.yjs.dev/t/changing-a-value-of-an-element-in-yarray/1248

  if (null != idxOfPost) {
    postsArray.delete(idxOfPost);
    postsArray.insert(idxOfPost, [updatedPost]);
  }
});

EM_JS(void, delete_post_in_indexed_db, (int64_t post_id), {
  const postsArray = Module.ydoc.getArray("posts");
  let idxOfPost = null;
  for (let i = 0; i < postsArray.length; i++) {
    if (postsArray.get(i).post_id ==
        Number(post_id)) { // oblider de faire la conversion à cause de big int
      idxOfPost = i;
      break;
    }
  }

  if (null != idxOfPost) {
    postsArray.delete(idxOfPost)
  }
});

EM_JS(char *, get_posts_from_indexed_db, (), {
  const postsArray = Module.ydoc.getArray("posts");

  const allPosts = postsArray;

  return stringToNewUTF8(JSON.stringify(allPosts));
});

EM_JS(void, save_post_in_indexed_db, (const char *post_json_cstr), {
  console.log("debut save post in indexeddb");
  const postsArray = Module.ydoc.getArray("posts");
  const post_json_utf_8 = UTF8ToString(post_json_cstr);
  const post = JSON.parse(post_json_utf_8);
  postsArray.push([post]);
});

PostStorageHandler::PostStorageHandler() {
  auto postsFromIndexedDb = get_posts_from_indexed_db();
  if (postsFromIndexedDb != nullptr) {
    json postsJson = json::parse(postsFromIndexedDb);
    for (json postJson : postsJson) {
      this->posts.push_back(Post::fromJson(postJson));
    }
    std::cout << "PostStorageHandler: Loaded " << this->posts.size()
              << " posts from DB." << std::endl;
  } else {
    std::cout << "PostStorageHandler: DB returned nullptr (empty)."
              << std::endl;
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

std::vector<Post> PostStorageHandler::GetAllPosts() const {
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

EMSCRIPTEN_BINDINGS(post_storage_module) {
  class_<PostStorageHandler>("PostStorageHandler")
      .constructor<>()
      .function("StorePost", &PostStorageHandler::StorePost)
      .function("DeletePost", &PostStorageHandler::DeletePost)
      .function("EditPostText", &PostStorageHandler::EditPostText);
}
