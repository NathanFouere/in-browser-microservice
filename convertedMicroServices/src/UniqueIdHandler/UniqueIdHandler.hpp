#pragma once
#include <chrono>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <map>

#define CUSTOM_EPOCH 1514764800000

using std::chrono::duration_cast;
using std::chrono::milliseconds;
using std::chrono::system_clock;

static int64_t current_timestamp = -1;
static int counter = 0;

static int GetCounter(int64_t timestamp) {
  if (current_timestamp > timestamp) {
    std::cout << "WARNING: Timestamps are not incremental!" << std::endl;
    // En JavaScript mono-thread, on log juste l'avertissement sans crasher
  }
  if (current_timestamp == timestamp) {
    return counter++;
  } else {
    current_timestamp = timestamp;
    counter = 0;
    return counter++;
  }
}

class UniqueIdHandler {
    public:
        UniqueIdHandler(const std::string &machine_id);
        int ComposeUniqueId();

    private:
        std::string _machine_id;
};
