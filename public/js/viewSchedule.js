function buildScheduleView(eventSource) {
    "use strict";

    const elChannelLinks = document.getElementById('channelScheduleLinks'),
        elScheduleList = document.getElementById('scheduleList'),
        channelToElement = {},
        CSS_CLASS_SELECTED = 'selected';

    return {
        addChannel(channel) {
            const li = document.createElement('li');
            li.innerHTML = channel.name;
            li.classList.add('showButton');
            li.setAttribute('role', 'radio');
            li.setAttribute('aria-controls', elScheduleList.id);
            li.onclick = () => {
                eventSource.trigger(EVENT_SCHEDULE_BUTTON_CLICK, channel.id);
            };
            elChannelLinks.appendChild(li);
            channelToElement[channel.id] = li;
        },
        setSelectedChannel(selectedChannelId) {
            Object.keys(channelToElement).forEach(channelId => {
                const el = channelToElement[channelId];
                el.classList.toggle(CSS_CLASS_SELECTED, selectedChannelId === channelId);
                el.ariaChecked = selectedChannelId === channelId;
            });
        },
        displaySchedule(schedule) {
            const playingNow = schedule.list.shift(),
                timeNow = Date.now() / 1000;
            let nextShowStartOffsetFromNow = playingNow.length - schedule.initialOffset;

            const scheduleList = [{time: 'NOW &gt;', name: playingNow.name}];
            scheduleList.push(...schedule.list.filter(item => !item.commercial).map(item => {
                const ts = nextShowStartOffsetFromNow + timeNow,
                    date = new Date(ts * 1000),
                    hh = date.getHours().toString().padStart(2,'0'),
                    mm = date.getMinutes().toString().padStart(2,'0');
                const result = {
                    time: `${hh}:${mm}`,
                    name: item.name,
                    commercial: item.commercial
                };
                nextShowStartOffsetFromNow += item.length;
                return result;
            }));

            elScheduleList.innerHTML = '';
            scheduleList.forEach(scheduleItem => {
                const el = document.createElement('li');
                el.innerHTML = `<div class="scheduleItemTime">${scheduleItem.time}</div><div class="scheduleItemName">${scheduleItem.name}</div>`;
                elScheduleList.appendChild(el);
            });
        },
        hideSchedule() {
            elScheduleList.innerHTML = '';
        }
    };
}