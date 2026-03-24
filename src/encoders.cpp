#include <encoders.h>

// Safe output pins for ESP32 (Avoiding Flash, Strapping, and default I2C pins)
#define PWM_A       16 
#define PWM_B       17 
#define PWM_C       18 

#define GPO_PIN     19

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