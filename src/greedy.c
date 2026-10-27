
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <limits.h>
#include "greedy.h"

int calculate_priority(int queue, int waiting) {
    return queue * 2 + waiting;
}

int choose_direction(const int queues[], const int waiting[]) {
    int selected = -1;
    int highest_wait = -1;
    int highest_priority = -1;

    /* Fairness: serve a waiting direction first if it reached 60 seconds. */
    for (int i = 0; i < DIRECTION_COUNT; i++) {
        if (queues[i] > 0 && waiting[i] >= STARVATION_LIMIT) {
            if (waiting[i] > highest_wait) {
                highest_wait = waiting[i];
                selected = i;
            }
        }
    }

    if (selected != -1) {
        return selected;
    }

    /* Greedy selection: choose the highest priority. */
    for (int i = 0; i < DIRECTION_COUNT; i++) {
        if (queues[i] <= 0) {
            continue;
        }

        int priority = calculate_priority(queues[i], waiting[i]);

        if (priority > highest_priority) {
            highest_priority = priority;
            selected = i;
        }
    }

    return selected;
}

int calculate_green_time(int queue) {
    int green_time = MIN_GREEN + queue * 2;

    if (green_time > MAX_GREEN) {
        green_time = MAX_GREEN;
    }

    return green_time;
}

int calculate_vehicles_served(int queue, int green_time) {
    int served = green_time / SECONDS_PER_VEHICLE;

    if (served > queue) {
        served = queue;
    }

    return served;
}

static int read_nonnegative_integer(const char *text, int *value) {
    char *end = NULL;
    long parsed;

    errno = 0;
    parsed = strtol(text, &end, 10);

    if (errno != 0 || end == text || *end != '\0' ||
        parsed < 0 || parsed > 10000000) {
        return 0;
    }

    *value = (int)parsed;
    return 1;
}

int main(int argc, char *argv[]) {
    const char *names[DIRECTION_COUNT] = {
        "North", "South", "East", "West"
    };

    int queues[DIRECTION_COUNT];
    int waiting[DIRECTION_COUNT];
    int selected;
    int priority = 0;
    int green_time = 0;
    int served = 0;

    /*
       Arguments:
       greedy.exe north south east west waitN waitS waitE waitW
    */
    if (argc != 9) {
        fprintf(stderr, "Expected 8 numbers: 4 queues and 4 waiting times.\n");
        return 1;
    }

    for (int i = 0; i < DIRECTION_COUNT; i++) {
        if (!read_nonnegative_integer(argv[i + 1], &queues[i]) ||
            !read_nonnegative_integer(argv[i + 5], &waiting[i])) {
            fprintf(stderr, "All inputs must be non-negative integers.\n");
            return 1;
        }
    }

    selected = choose_direction(queues, waiting);

    if (selected != -1) {
        priority = calculate_priority(
            queues[selected], waiting[selected]
        );

        green_time = calculate_green_time(queues[selected]);
        served = calculate_vehicles_served(
            queues[selected], green_time
        );

        queues[selected] -= served;

        for (int i = 0; i < DIRECTION_COUNT; i++) {
            if (i == selected) {
                waiting[i] = 0;
            } else if (queues[i] > 0) {
                waiting[i] += green_time;
            }
        }
    }

    /*
       Output JSON only, so Python can read the result.
    */
    printf("{\"selectedIndex\":%d,", selected);
    printf("\"direction\":\"%s\",",
           selected == -1 ? "None" : names[selected]);
    printf("\"priority\":%d,", priority);
    printf("\"greenTime\":%d,", green_time);
    printf("\"vehiclesServed\":%d,", served);

    printf("\"queues\":[");
    for (int i = 0; i < DIRECTION_COUNT; i++) {
        printf("%s%d", i == 0 ? "" : ",", queues[i]);
    }

    printf("],\"waiting\":[");
    for (int i = 0; i < DIRECTION_COUNT; i++) {
        printf("%s%d", i == 0 ? "" : ",", waiting[i]);
    }

    printf("]}\n");

    return 0;
}
