#pragma once

#include <chrono>
#include <iostream>
#include <map>
#include <string>
#include <vector>
#include "../Types/Media/Media.hpp"

class MediaHandler {
  public:
    MediaHandler();

    std::vector<Media> ComposeMedia(
                      int64_t,
                      const std::vector<std::string> &,
                      const std::vector<int64_t> &,
                      const std::map<std::string, std::string> &
    );
};
