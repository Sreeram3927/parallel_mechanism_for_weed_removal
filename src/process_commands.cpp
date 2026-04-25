#include "process_commands.h"
#include "protocol.h"
#include "kinematics.h"

// ==========================================
// INPUT HANDLING (Reading from Jetson)
// ==========================================

void executeJointCommand(JointCommandPacket &cmd, MotorUnit &armA, MotorUnit &armB, MotorUnit &armC) {
  
  // Check Header
  if (cmd.header != 0x5A) return; // Ignore invalid packets

  // (Optional) Verify your uint16_t checksum here

  // Execute based on Type
  switch (cmd.type) {
    
    case CMD_STOP:
      armA.stop();
      armB.stop();
      armC.stop();
      ESP_LOGI("General", "EMERGENCY STOP!!");
      break;

    case CMD_MOVE_ABSOLUTE:
      if (cmd.motorId == 'A') armA.moveAbsolute(cmd.valA);
      else if (cmd.motorId == 'B') armB.moveAbsolute(cmd.valA);
      else if (cmd.motorId == 'C') armC.moveAbsolute(cmd.valA);
      else if (cmd.motorId == 'T') {
        armA.moveAbsolute(cmd.valA);
        armB.moveAbsolute(cmd.valB);
        armC.moveAbsolute(cmd.valC);
      }
      break;

    case CMD_JOG_RELATIVE:
      if (cmd.motorId == 'A') armA.moveRelative(cmd.valA);
      else if (cmd.motorId == 'B') armB.moveRelative(cmd.valB);
      else if (cmd.motorId == 'C') armC.moveRelative(cmd.valC);
      else if (cmd.motorId == 'T') {
        armA.moveRelative(cmd.valA);
        armB.moveRelative(cmd.valB);
        armC.moveRelative(cmd.valC);
      }
      break;
      
    default:
      ESP_LOGW("General", "Unknown command type: %d", cmd.type);
      break;
  }
}

void executeCoordinateCommand(CoordinateCommandPacket &cmd, MotorUnit &armA, MotorUnit &armB, MotorUnit &armC) {
  
  // Check Header
  if (cmd.header != 0x5A) return; // Ignore invalid packets

  // (Optional) Verify your uint16_t checksum here

  float angleA, angleB, angleC;
  DeltaKinematics::inverseKinematics(cmd.x, cmd.y, cmd.z, angleA, angleB, angleC);
  
  armA.moveAbsolute(angleA);
  armB.moveAbsolute(angleB);
  armC.moveAbsolute(angleC);
  ESP_LOGI("General", "Moving to Coordinate (%.2f, %.2f, %.2f) => Angles (%.2f, %.2f, %.2f)", cmd.x, cmd.y, cmd.z, angleA, angleB, angleC);

  
}

// ==========================================
// OUTPUT HANDLING (Sending to Jetson)
// ==========================================

void sendTelemetryToJetson(MotorUnit &armA, MotorUnit &armB, MotorUnit &armC) {
  RobotState packet;
    
  // Fill the struct with current data
  packet.angleA = armA.getAngle();
  packet.angleB = armB.getAngle();
  packet.angleC = armC.getAngle();
  
  // Simple Checksum: Sum of the bytes (helps Jetson verify valid data)
  packet.checksum = (uint16_t)(packet.angleA + packet.angleB + packet.angleC);

  // START OF FRAME: Send two unique non-ASCII bytes
  Serial.write(0xAA); 
  Serial.write(0x55); 
  
  // DATA: Send the raw struct
  Serial.write((uint8_t*)&packet, sizeof(packet));
  
  // END OF FRAME: Optional but helpful
  Serial.write(0x0D);
}