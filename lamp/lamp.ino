#include <PMU.h>
#include <MsTimer3.h>
#include "ble.h"
#include "lamp.h"
#include "gradient.h"

constexpr uint8_t lampAddr = 0;
constexpr uint8_t Addr = 0;
constexpr uint8_t frameNum = 30;

constexpr uint8_t ledPin = 5;
constexpr uint8_t ledNum = 12;
constexpr uint8_t bleStat = 2;
constexpr uint8_t blePwrc = 8;
constexpr uint8_t orginLamp = 9;

inline uint8_t untilRead();
inline CRGB readRGB();
inline void gradientCallback();
void closeAndSleep();
bool readCmd();
void dealGradient();

long seconds = 0;
CRGB gradientHead;
CRGB gradientTail;
bool gradientFlag = false;

BLE<bleStat, blePwrc> ble;
Lamp<orginLamp, ledPin, ledNum, lampAddr> lamp;
constexpr uint8_t gradientAddr = lamp.endAddr+1;
Gradient<frameNum,gradientAddr> gradient(gradientCallback);

void setup() {
    ble.init();
    lamp.init();
    gradient.init();
}

void loop() {
    readCmd();
    if(gradientFlag) {
        lamp.setLed(0, ledNum / 2, gradientTail,false);
        lamp.setLed(ledNum / 2, ledNum,gradientHead);
        gradientFlag = false;
    }
}

bool readCmd() {
    uint8_t begin_led, end_led, brightness, state, period;
    CRGB head_begin_color, head_end_color, tail_begin_color, tail_end_color;
    char str[20];
    String atCmd;
    if (!Serial.available()) {
        return false;
    }
    char cmd = Serial.read();
    switch (cmd) {
        case 'B':
            brightness = untilRead();

            lamp.setBrightness(brightness);

            break;
        case 'C':
            gradient.stop();
            begin_led = untilRead();
            end_led = untilRead();

            lamp.setLed(begin_led, end_led, readRGB());

            break;
        case 'D':
            MsTimer3::stop();
            seconds = 0;
            Serial.print("OK");
            break;
        case 'G':
            sprintf(str, "%d,%d,%ld", (int)lamp.getState(),
                    (int)lamp.getBrightness(), seconds);
            Serial.print(str);
            break;
        case 'O':
            state = untilRead();

            lamp.setState(state);

            break;
        case 'P':
            seconds = Serial.parseInt();
            Serial.print(seconds);
            MsTimer3::set(1000, closeAndSleep);
            MsTimer3::start();
            break;
        case 'R':
            gradient.stop();
            lamp.reset();
            break;
        case 'S':
            gradient.stop();
            lamp.saveLed();
            break;
        case 'T':
            head_begin_color = readRGB();
            head_end_color = readRGB();
            tail_begin_color = readRGB();
            tail_end_color = readRGB();
            period = untilRead();
            gradient.set(head_begin_color,head_end_color,tail_begin_color,tail_end_color,period);
            break;
        case '/':
            atCmd = Serial.readStringUntil(';');
            ble.writeCmd(atCmd);
            break;
        default:
            break;
    }
    delay(5);  //等待串口全部接收完成（5ms足够完成接收72个数据，大于缓冲区大小）
    while (Serial.available()) {
        Serial.read();
    }
    return true;
}

void gradientCallback() {
    gradient.dealGradient();
}

uint8_t untilRead() {
    while (!Serial.available());
    return Serial.read();
}

CRGB readRGB() {
    uint8_t rgb_r,rgb_g,rgb_b;
    rgb_r = untilRead();
    rgb_g = untilRead();
    rgb_b = untilRead();
    return CRGB(rgb_r, rgb_g, rgb_b);
}

void closeAndSleep() { 
    if(seconds == 1) {
        MsTimer3::stop();
        lamp.closeAll();
        seconds = 0;
        delay(100);//等100毫秒再休眠（我也不确定有没有意义，单纯为了保险）
        PMU.sleep(PM_POFFS1);
    } else if(seconds > 1) {
        --seconds;
    }
}