#pragma once
#include <string>

struct PostType {
  enum type {
    POST = 0,
    REPOST = 1,
    REPLY = 2,
    DM = 3
  };
};