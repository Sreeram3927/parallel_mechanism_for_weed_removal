#ifndef ROUTINES_H  
#define ROUTINES_H  

#include <Arduino.h>
#include <motor_unit.h>

void goToHomePosition(MotorUnit &armA, MotorUnit &armB, MotorUnit &armC);
void goToRestPosition(MotorUnit &armA, MotorUnit &armB, MotorUnit &armC);

void traceCircle(MotorUnit &armA, MotorUnit &armB, MotorUnit &armC, float radius, float height);

#endif