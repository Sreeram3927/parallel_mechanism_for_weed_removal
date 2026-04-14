#include "jetson_comm.h"
#include "process_commands.h"
#include "protocol.h"
#include "kinematics.h"

// Define states for our serial parser
enum ParseState {
  WAIT_HEADER,
  WAIT_TYPE,
  WAIT_PAYLOAD
};

ParseState parserState = WAIT_HEADER;
uint8_t rxBuffer[32];   // Buffer to hold incoming packet bytes
uint8_t bufferIndex = 0;
uint8_t expectedLength = 0;
uint8_t currentType = 0;

void processSerial(MotorUnit &armA, MotorUnit &armB, MotorUnit &armC) {
  // Process all available bytes in the serial buffer
  while (Serial.available() > 0) {
    uint8_t b = Serial.read();

    switch (parserState) {
      
      case WAIT_HEADER:
        if (b == 0x5A) {
          rxBuffer[0] = b;
          parserState = WAIT_TYPE;
        }
        break;

      case WAIT_TYPE:
        rxBuffer[1] = b;
        currentType = b;
        
        // Determine how many total bytes we need based on the command type
        if (currentType == CMD_STOP || currentType == CMD_MOVE_ABSOLUTE || currentType == CMD_JOG_RELATIVE) {
          expectedLength = sizeof(JointCommandPacket);
          bufferIndex = 2;
          parserState = WAIT_PAYLOAD;
        } 
        else if (currentType == 0x03) { // 0x03 is your CoordinateCommandPacket
          expectedLength = sizeof(CoordinateCommandPacket);
          bufferIndex = 2;
          parserState = WAIT_PAYLOAD;
        } 
        else {
          // Unknown command type, reset parser
          ESP_LOGW("Serial", "Unknown packet type: 0x%02X", currentType);
          parserState = WAIT_HEADER;
        }
        break;

      case WAIT_PAYLOAD:
        rxBuffer[bufferIndex++] = b;
        
        // Check if we have received the full packet
        if (bufferIndex >= expectedLength) {
          // Packet complete! Dispatch it.
          dispatchCommand(rxBuffer, currentType, expectedLength, armA, armB, armC);
          
          // Reset for the next packet
          parserState = WAIT_HEADER; 
        }
        break;
    }
  }
}

void dispatchCommand(uint8_t* buffer, uint8_t type, uint8_t length, MotorUnit &armA, MotorUnit &armB, MotorUnit &armC) {
  
  if (type == CMD_STOP || type == CMD_MOVE_ABSOLUTE || type == CMD_JOG_RELATIVE) {
    
    // Cast buffer to JointCommandPacket
    JointCommandPacket cmd;
    memcpy(&cmd, buffer, sizeof(JointCommandPacket));
    
    // (Optional but recommended) Validate Checksum here
    // uint16_t calcChecksum = ...
    // if (cmd.checksum != calcChecksum) return;

    executeJointCommand(cmd, armA, armB, armC);
    
  } 
  else if (type == CMD_MOVE_COORDINATE) {
    
    // Cast buffer to CoordinateCommandPacket
    CoordinateCommandPacket cmd;
    memcpy(&cmd, buffer, sizeof(CoordinateCommandPacket));

    // (Optional but recommended) Validate Checksum here

    executeCoordinateCommand(cmd, armA, armB, armC);
    
  }
}