#include <encoders.h>

#define PWM_A       9
#define PWM_B       10
#define PWM_C       11

#define GPO_PIN     8

MyEncoders myEncoders;

MyEncoders::MyEncoders() : encoderA(), encoderB(), encoderC() {}

void MyEncoders::setup() {
  Serial.println("Setting up encoders...");

  pinMode(PWM_A, INPUT);
  pinMode(PWM_B, INPUT);
  pinMode(PWM_C, INPUT);

  pinMode(GPO_PIN, OUTPUT);
  digitalWrite(GPO_PIN, HIGH);

  Serial.println("Encoders setup complete.\n");
}