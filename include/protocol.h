#pragma once
#include <Arduino.h>

// ==========================================
// DEFINITIONS
// ==========================================

enum CommandType : uint8_t {
  CMD_STOP = 0x00,           // Emergency stop
  CMD_MOVE_ABSOLUTE = 0x01,  // Go to specific angle
  CMD_JOG_RELATIVE = 0x02,    // Add/subtract from current angle
  CMD_MOVE_COORDINATE = 0x03  // Move to (x,y,z) coordinate
};

// ==========================================
// TELEMETRY (ESP32 -> Jetson)
// ==========================================

struct __attribute__((packed)) RobotState {
  uint8_t header = 0xA5;    // Unique Start Marker
  uint8_t type = 0x01;      // Type 1 = Telemetry Data
  float angleA;             
  float angleB;             
  float angleC;             
  uint16_t checksum;        
};

// ==========================================
// COMMANDS (Jetson -> ESP32)
// ==========================================

struct __attribute__((packed)) JointCommandPacket {
  uint8_t header = 0x5A;    // Unique Start Marker
  uint8_t type;             // Uses CommandType (0=Stop, 1=Absolute, 2=Jog)
  char motorId;             // 'A', 'B', 'C', or 'T' (Total/All)
  
  // We need 3 floats so the Jetson can command all 3 axes simultaneously 
  // If moving only one motor (e.g., motorId = 'A'), just put the value in valA and leave B/C as 0.
  float valA;
  float valB;
  float valC;
  
  uint16_t checksum;        
};

struct __attribute__((packed)) CoordinateCommandPacket {
  uint8_t header = 0x5A;    // Unique Start Marker
  uint8_t type = CMD_MOVE_COORDINATE;      // Type 3 = Move to Coordinate
  
  float x;
  float y;
  float z;
  
  uint16_t checksum;        
};