#ifndef __GRADIENT_H__
#define __GRADIENT_H__

#include <MsTimer2.h>
#include <FastLED.h>

extern CRGB gradientHead;
extern CRGB gradientTail;
extern bool gradientFlag;

template <uint8_t FRAME_NUM, uint8_t BEGIN_ADDR>
struct Gradient {
    static constexpr uint8_t periodAddr = BEGIN_ADDR;
    static constexpr uint8_t colorAddr = periodAddr + 1;
    static constexpr uint8_t addrLen = 3 * 4 + 1;
    static constexpr uint8_t endAddr = BEGIN_ADDR + addrLen;

    void (*callback)();

    uint8_t period = 0;
    uint16_t pointNum = 0;
    uint16_t thisFrame = 0;

    double head_r_step = 0;
    double head_g_step = 0;
    double head_b_step = 0;

    double tail_r_step = 0;
    double tail_g_step = 0;
    double tail_b_step = 0;

    double headR, headG, headB, tailR, tailG, tailB;

    CRGB head_begin_color;
    CRGB head_end_color;
    CRGB tail_begin_color;
    CRGB tail_end_color;

    Gradient(void (*userCallback)()) : callback(userCallback) {}

    void calcParams() {
        pointNum = period * FRAME_NUM/2;

        headR = head_begin_color.red;
        headG = head_begin_color.green;
        headB = head_begin_color.blue;

        tailR = tail_begin_color.red;
        tailG = tail_begin_color.green;
        tailB = tail_begin_color.blue;

        int16_t r_distance;
        int16_t g_distance;
        int16_t b_distance;
        double divisor = pointNum - 1;

        r_distance = head_end_color.r - head_begin_color.r;
        g_distance = head_end_color.g - head_begin_color.g;
        b_distance = head_end_color.b - head_begin_color.b;

        head_r_step = r_distance / divisor;
        head_g_step = g_distance / divisor;
        head_b_step = b_distance / divisor;

        r_distance = tail_end_color.r - tail_begin_color.r;
        g_distance = tail_end_color.g - tail_begin_color.g;
        b_distance = tail_end_color.b - tail_begin_color.b;

        tail_r_step = r_distance / divisor;
        tail_g_step = g_distance / divisor;
        tail_b_step = b_distance / divisor;
    }
    void init() {
        thisFrame = 0;
        period = EEPROM.read(periodAddr);
        if (period != 0) {
            for (int i = 0; i != 3; ++i) {
                head_begin_color[i] = EEPROM.read(colorAddr + 0 * 3 + i);
            }
            for (int i = 0; i != 3; ++i) {
                head_end_color[i] = EEPROM.read(colorAddr + 1 * 3 + i);
            }
            for (int i = 0; i != 3; ++i) {
                tail_begin_color[i] = EEPROM.read(colorAddr + 2 * 3 + i);
            }
            for (int i = 0; i != 3; ++i) {
                tail_end_color[i] = EEPROM.read(colorAddr + 3 * 3 + i);
            }
            calcParams();
            MsTimer2::set(1000/FRAME_NUM+0.5, callback);
            MsTimer2::start();
        }
    }
    void set(CRGB _head_begin_color,
             CRGB _head_end_color,
             CRGB _tail_begin_color,
             CRGB _tail_end_color,
             uint8_t _period) {
        MsTimer2::stop();
        thisFrame = 0;
        head_begin_color = _head_begin_color;
        head_end_color = _head_end_color;
        tail_begin_color = _tail_begin_color;
        tail_end_color = _tail_end_color;
        period = _period;
        EEPROM.write(periodAddr, period);
        for (int i = 0; i != 3; ++i) {
            EEPROM.write(colorAddr + 0 * 3 + i, head_begin_color[i]);
        }
        for (int i = 0; i != 3; ++i) {
            EEPROM.write(colorAddr + 1 * 3 + i, head_end_color[i]);
        }
        for (int i = 0; i != 3; ++i) {
            EEPROM.write(colorAddr + 2 * 3 + i, tail_begin_color[i]);
        }
        for (int i = 0; i != 3; ++i) {
            EEPROM.write(colorAddr + 3 * 3 + i, tail_end_color[i]);
        }
        calcParams();
        MsTimer2::set(1000/FRAME_NUM+0.5, callback);
        MsTimer2::start();
    }
    bool stop() {
        if (period == 0) {
            return false;
        }
        MsTimer2::stop();
        period = 0;
        EEPROM.write(periodAddr, period);
        return true;
    }
    CRGB* dealGradient() {

        if (thisFrame > pointNum) {
            headR -= head_r_step;
            headG -= head_g_step;
            headB -= head_b_step;

            tailR -= tail_r_step;
            tailG -= tail_g_step;
            tailB -= tail_b_step;
        } else if (thisFrame < pointNum && thisFrame) {
            headR += head_r_step;
            headG += head_g_step;
            headB += head_b_step;

            tailR += tail_r_step;
            tailG += tail_g_step;
            tailB += tail_b_step;
        }

        if(!gradientFlag) {

            gradientHead.red = headR + 0.5;
            gradientHead.green = headG + 0.5;
            gradientHead.blue = headB + 0.5;

            gradientTail.red = tailR + 0.5;
            gradientTail.green = tailG + 0.5;
            gradientTail.blue = tailB + 0.5;

            gradientFlag = true;
        }

        thisFrame = (thisFrame + 1) % (pointNum * 2);
    }
};

#endif  // __GRADIENT_H__