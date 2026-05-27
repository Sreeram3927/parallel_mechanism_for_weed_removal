#include <Arduino.h>
#include <motor_unit.h>

void processSerial(MotorUnit &armA, MotorUnit &armB, MotorUnit &armC);
void dispatchCommand(uint8_t* buffer, uint8_t type, uint8_t length, MotorUnit &armA, MotorUnit &armB, MotorUnit &armC);