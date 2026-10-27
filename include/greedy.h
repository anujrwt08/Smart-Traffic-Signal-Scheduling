
#ifndef GREEDY_H
#define GREEDY_H

#define DIRECTION_COUNT 4
#define MIN_GREEN 10
#define MAX_GREEN 60
#define SECONDS_PER_VEHICLE 2
#define STARVATION_LIMIT 60

int calculate_priority(int queue, int waiting);
int choose_direction(const int queues[], const int waiting[]);
int calculate_green_time(int queue);
int calculate_vehicles_served(int queue, int green_time);

#endif
