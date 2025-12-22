import { buildClock } from './clock.mjs';
import { EVENT_SCHEDULE_BUTTON_CLICK } from './events.mjs';
import type { ScheduleView, EventSource, Channel, ChannelId, ApiChannelScheduleResponse } from './types.mjs';

export function buildScheduleView(eventSource: EventSource): ScheduleView {
    const elChannelLinks = document.getElementById('channelScheduleLinks')!;
    const elScheduleList = document.getElementById('scheduleList')!;
    const channelToElement: Record<string, HTMLButtonElement> = {};
    const CSS_CLASS_SELECTED = 'selected';
    const clock = buildClock();

    return {
        addChannel(channel: Channel) {
            const button = document.createElement('button');
            button.innerHTML = channel.name;
            button.classList.add('menuButton');
            button.setAttribute('data-umami-event', `schedule-${channel.name.toLowerCase().replaceAll(' ', '-')}`);
            button.setAttribute('role', 'radio');
            button.setAttribute('aria-controls', elScheduleList.id);
            button.onclick = () => {
                eventSource.trigger(EVENT_SCHEDULE_BUTTON_CLICK, channel.id);
            };
            elChannelLinks.appendChild(button);
            channelToElement[channel.id as string] = button;
        },
        setSelectedChannel(selectedChannelId: ChannelId | null) {
            Object.keys(channelToElement).forEach(channelId => {
                const el = channelToElement[channelId];
                el.classList.toggle(CSS_CLASS_SELECTED, selectedChannelId === channelId);
                el.ariaChecked = String(selectedChannelId === channelId);
            });
        },
        displaySchedule(schedule: ApiChannelScheduleResponse) {
            const playingNow = schedule.list.shift()!;
            const timeNow = clock.nowSeconds();
            let nextShowStartOffsetFromNow = playingNow.duration - schedule.initialOffset;

            const scheduleList: { time: string; name: string; shortSummary?: string; commercial?: boolean }[] = [
                { time: 'NOW &gt;', name: `${playingNow.show} - ${playingNow.title}`, shortSummary: playingNow.summarySmall as string }
            ];
            scheduleList.push(...schedule.list.filter(item => !item.isCommercial).map(item => {
                const ts = nextShowStartOffsetFromNow + timeNow,
                    date = new Date(ts * 1000),
                    hh = date.getHours().toString().padStart(2, '0'),
                    mm = date.getMinutes().toString().padStart(2, '0');
                const result = {
                    time: `${hh}:${mm}`,
                    name: `${item.show} - ${item.title}`,
                    commercial: item.isCommercial,
                    shortSummary: item.summarySmall as string
                };
                nextShowStartOffsetFromNow += item.duration;
                return result;
            }));

            elScheduleList.innerHTML = '';
            scheduleList.forEach(scheduleItem => {
                const el = document.createElement('li');
                const htmlParts: string[] = [];

                htmlParts.push(`<div class="scheduleItemTime">${scheduleItem.time}</div>`);
                htmlParts.push(`<div class="scheduleItemDetails">`);
                htmlParts.push(`<div class="scheduleItemName">${scheduleItem.name}</div>`);
                if (scheduleItem.shortSummary) {
                    htmlParts.push(`<div class="scheduleItemShortSummary">${scheduleItem.shortSummary}</div>`);
                }
                htmlParts.push('</div>');
                el.innerHTML = htmlParts.join('');
                elScheduleList.appendChild(el);
            });
        },
        hideSchedule() {
            elScheduleList.innerHTML = '';
        }
    };
}
