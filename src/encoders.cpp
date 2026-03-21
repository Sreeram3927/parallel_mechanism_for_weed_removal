#include <AS5600.h>
#include <Wire.h>

// ─── Pin Definitions ─────────────────────────────────────
#define PWM_A       9
#define PWM_B       10
#define PWM_C       11

#define GPO_PIN     8

// ─── Objects ─────────────────────────────────────────────
AS5600 encoderA;
AS5600 encoderB;
AS5600 encoderC;

// Use only when all encoders are burned for PWN output
void setupEncoders() {
  pinMode(PWM_A, INPUT);
  pinMode(PWM_B, INPUT);
  pinMode(PWM_C, INPUT);
  
  pinMode(GPO_PIN, OUTPUT);
  digitalWrite(GPO_PIN, HIGH);

  delay(300);
  Serial.println("Encoders ready. Send A, B or C to read angle\n");
}