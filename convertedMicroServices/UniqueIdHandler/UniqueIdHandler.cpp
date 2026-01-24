#include "UniqueIdHandler.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

UniqueIdHandler::UniqueIdHandler(const std::string &machine_id) {
    _machine_id = machine_id;
}

int64_t UniqueIdHandler::ComposeUniqueId() {
    int64_t timestamp =
        duration_cast<milliseconds>(system_clock::now().time_since_epoch())
            .count() -
        CUSTOM_EPOCH;
    int idx = GetCounter(timestamp);

    std::stringstream sstream;
    sstream << std::hex << timestamp;
    std::string timestamp_hex(sstream.str());

    if (timestamp_hex.size() > 10) {
      timestamp_hex.erase(0, timestamp_hex.size() - 10);
    } else if (timestamp_hex.size() < 10) {
      timestamp_hex = std::string(10 - timestamp_hex.size(), '0') + timestamp_hex;
    }

    // Empty the sstream buffer.
    sstream.clear();
    sstream.str(std::string());

    sstream << std::hex << idx;
    std::string counter_hex(sstream.str());

    if (counter_hex.size() > 3) {
      counter_hex.erase(0, counter_hex.size() - 3);
    } else if (counter_hex.size() < 3) {
      counter_hex = std::string(3 - counter_hex.size(), '0') + counter_hex;
    }

    std::string post_id_str = _machine_id + timestamp_hex + counter_hex;
    int64_t post_id = stoull(post_id_str, nullptr, 16) & 0x7FFFFFFFFFFFFFFF;

    return post_id;
}

EMSCRIPTEN_BINDINGS(unique_id_module) {
  class_<UniqueIdHandler>("UniqueIdHandler")
    .constructor<const std::string&>()
    .function("ComposeUniqueId", &UniqueIdHandler::ComposeUniqueId);
}
