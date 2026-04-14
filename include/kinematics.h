#ifndef DELTA_KINEMATICS_H
#define DELTA_KINEMATICS_H

#include <Arduino.h>

class DeltaKinematics {
  private:
    static constexpr float SQRT3 = 1.73205081f; 

    // Make your private helper functions static too
    static float getTheta_1(float x, float y, float z);
    static float getTheta_2(float x, float y, float z);
    static float getTheta_3(float x, float y, float z);

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
    static void inverseKinematics(float x, float y, float z, float &angleA, float &angleB, float &angleC);
    
};

#endif