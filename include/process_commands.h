#ifndef PROCESS_COMMANDS_H
#define PROCESS_COMMANDS_H

#include <Arduino.h>
#include <motor_unit.h>
#include <protocol.h>

// --- Input Functions (Jetson -> ESP32) ---
// We use references (&) to update the variables living in main.cpp
void parseCommand(String cmd, MotorUnit &armA, MotorUnit &armB, MotorUnit &armC);
void executeJointCommand(JointCommandPacket &cmd, MotorUnit &armA, MotorUnit &armB, MotorUnit &armC);
void executeCoordinateCommand(CoordinateCommandPacket &cmd, MotorUnit &armA, MotorUnit &armB, MotorUnit &armC);

// --- Output Functions (ESP32 -> Jetson) ---
void sendTelemetryToJetson(MotorUnit &armA, MotorUnit &armB, MotorUnit &armC);

#endif