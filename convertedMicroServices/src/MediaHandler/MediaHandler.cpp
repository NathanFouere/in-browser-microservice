#include "MediaHandler.hpp"
#include <cstdint>
#include <emscripten/bind.h>
#include <stdexcept>
#include <vector>

using namespace emscripten;

MediaHandler::MediaHandler() {

}

std::vector<Media> MediaHandler::ComposeMedia(
    int64_t req_id,
    const std::vector<std::string> &media_types,
    const std::vector<int64_t> &media_ids,
    const std::map<std::string, std::string> &carrier) {
  if (media_types.size() != media_ids.size()) {
    throw std::invalid_argument("The lengths of media_id list and media_type list are not equal");
  }

  std::vector<Media> mediasToReturn;
  for (int i = 0; i < media_ids.size(); ++i) {
    Media new_media;
    new_media.media_id = media_ids[i];
    new_media.media_type = media_types[i];
    mediasToReturn.emplace_back(new_media);
  }
  return mediasToReturn;
}


EMSCRIPTEN_BINDINGS(media_handler) {
    class_<MediaHandler>("MediaHandler")
      .constructor<>()
      .function("ComposeMedia", &MediaHandler::ComposeMedia);
}
