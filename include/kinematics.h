#ifndef DELTA_KINEMATICS_H
#define DELTA_KINEMATICS_H

#include <Arduino.h>

class DeltaKinematics {
  private:
    static constexpr float SQRT3 = 1.73205081f; 

    // Make your private helper functions static too
    static float getTheta_1(float x, float y, float z) {
      float u1 = 2 * 150 * (y + a);
      float v1 = 2 * ACTIVE_LINK * z;  
      float w1 = pow(x, 2) + pow(y, 2) + pow(z, 2) + pow(a, 2) + pow(ACTIVE_LINK, 2)+ (2 * y * a) - pow(PASSIVE_LINK, 2);
      float t1 = (-v1 - sqrt(pow(u1, 2) + pow(v1, 2) - pow(w1, 2))) / (w1 - u1);
      float theta1 = (2 * degrees(atan(t1)));
      return theta1;
    };

    static float getTheta_2(float x, float y, float z) {
      float u2 = -150 * (sqrt(3) * (x + b) + y + c);
      float v2 = 2 * ACTIVE_LINK * z;
      float w2 = pow(x, 2) + pow(y, 2) + pow(z, 2) + pow(b, 2) + pow(c, 2) + pow(ACTIVE_LINK, 2) + (2 * x * b) + (2 * y * c) - pow(PASSIVE_LINK, 2);
      float t2 = (-v2 - sqrt(pow(u2, 2) + pow(v2, 2) - pow(w2, 2))) / (w2 - u2);
      float theta2 = (2 * degrees(atan(t2)));
      return theta2;
    };

    static float getTheta_3(float x, float y, float z) {
      float u3 = 150 * (sqrt(3) * (x - b) - y - c);
      float v3 = 2 * ACTIVE_LINK * z;
      float w3 = pow(x, 2) + pow(y, 2) + pow(z, 2) + pow(b, 2) + pow(c, 2) + pow(ACTIVE_LINK, 2) - (2 * x * b) + (2 * y * c) - pow(PASSIVE_LINK, 2);
      float t3 = (-v3 - sqrt(pow(u3, 2) + pow(v3, 2) - pow(w3, 2))) / (w3 - u3);
      float theta3 = (2 * degrees(atan(t3)));
      return theta3;
    };

  public:
    // Initialize your fixed robot dimensions right here
    static constexpr float ACTIVE_LINK = 150.0f;
    static constexpr float PASSIVE_LINK = 315.0f;
    static constexpr float BASE_RADIUS = 100.78f;
    static constexpr float END_EFFECTOR_RADIUS = 65.0f;
    static constexpr float OFFSET = 0.0f;

    static constexpr float a = BASE_RADIUS - END_EFFECTOR_RADIUS;
    static constexpr float b = (112.58f / 2) - ((SQRT3 / 2) * BASE_RADIUS);
    static constexpr float c = 32.5f - ((1 / 2) * BASE_RADIUS);

    // Make your public functions static
    static void inverseKinematics(float x, float y, float z, float &angleA, float &angleB, float &angleC) {
      angleA = getTheta_1(x, y, z);
      angleB = getTheta_2(x, y, z);
      angleC = getTheta_3(x, y, z);
    };
    
};

#endif