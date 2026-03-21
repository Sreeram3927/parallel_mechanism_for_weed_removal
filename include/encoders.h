# pragma once

#include <Arduino.h>
#include <AS5600.h>
#include <Wire.h>

class MyEncoders {
    public:
        MyEncoders();

        void setup();
        float readAngleA();
        float readAngleB();
        float readAngleC();
        float readAll();

    private:
        AS5600 encoderA;
        AS5600 encoderB;
        AS5600 encoderC;
};

extern MyEncoders myEncoders;