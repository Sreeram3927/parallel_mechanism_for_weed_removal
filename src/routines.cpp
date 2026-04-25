#include <Arduino.h>
#include <motor_unit.h>
#include <routines.h>

void goToHomePosition(MotorUnit &armA, MotorUnit &armB, MotorUnit &armC) {
  armA.moveAbsolute(0);
  armB.moveAbsolute(0);
  armC.moveAbsolute(0);
}

// Rest position gives camera more visibility of ground
void goToRestPosition(MotorUnit &armA, MotorUnit &armB, MotorUnit &armC) {
//   armA.moveAbsolute(90);
//   armB.moveAbsolute(90);
//   armC.moveAbsolute(90);
}

void traceCircle(MotorUnit &armA, MotorUnit &armB, MotorUnit &armC, float radius, float height) {
//   const int numPoints = 100;
//   for (int i = 0; i < numPoints; i++) {
//     float angle = (i / (float)numPoints) * 360.0f;
//     float x = radius * cos(radians(angle));
//     float y = radius * sin(radians(angle));
//     float z = height;

//     // Here you would convert (x, y, z) to joint angles using inverse kinematics
//     // For simplicity, let's just move armA in a circle and keep armB and armC fixed
//     armA.moveAbsolute(angle);
//     delay(50); // Small delay to allow the motor to move
//   }
}