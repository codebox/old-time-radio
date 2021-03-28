function buildView() {
    "use strict";
    const FEW_CHANNELS_LIMIT = 4,
        eventTarget = new EventTarget(),
        channelButtons = {},

        CLASS_LOADING = 'channelLoading',
        CLASS_PLAYING = 'channelPlaying',
        CLASS_ERROR = 'channelError',

        elMenuOpenButton = document.getElementById('menuOpenButton'),
        elMenuCloseButton = document.getElementById('menuCloseButton'),
        elMenuBox = document.getElementById('menu'),
        elVolumeUp = document.getElementById('volumeUp'),
        elVolumeDown = document.getElementById('volumeDown'),
        elMessage = document.getElementById('message'),
        volumeLeds = Array.from(Array(10).keys()).map(i => document.getElementById(`vol${i+1}`)),

        elButtonContainer = document.getElementById('buttons');

    function trigger(eventName, eventData) {
        console.log('EVENT view' + eventName);
        const event = new Event(eventName);
        event.data = eventData;
        eventTarget.dispatchEvent(event);
    }

    function forEachChannelButton(fn) {
        Object.keys(channelButtons).forEach(channelId => {
            fn(channelId, channelButtons[channelId]);
        });
    }

    function buildChannelButton(channel) {
        const channelId = channel.id,
            channelName = channel.name,
            elButtonBox = document.createElement('div');
        elButtonBox.classList.add('buttonBox');

        const elButtonIndicator = document.createElement('div'),
            elButton = document.createElement('div'),
            elButtonLabel = document.createElement('div');

        elButtonIndicator.classList.add('buttonIndicator');

        elButton.classList.add('button');
        elButtonLabel.classList.add('buttonLabel');
        elButtonLabel.innerText = channelName;

        elButton.onclick = () => {
            trigger(EVENT_CHANNEL_BUTTON_CLICK, channelId);
        };
        elButtonBox.appendChild(elButtonIndicator);
        elButtonBox.appendChild(elButton);
        elButtonBox.appendChild(elButtonLabel);

        elButtonContainer.appendChild(elButtonBox);
        channelButtons[channelId] = elButtonBox;
    }

    const messagePrinter = (() => {
        const PRINT_INTERVAL = 40;
        let interval;

        function stopPrinting() {
            clearInterval(interval);
            interval = 0;
        }

        return {
            print(msg) {
                if (interval) {
                    stopPrinting();
                }
                const msgLen = msg.length;
                let i = 1;
                interval = setInterval(() => {
                    elMessage.innerText = (msg.substr(0,i) + (i < msgLen ? '█' : '')).padEnd(msgLen, ' ');
                    const messageComplete = i === msgLen;
                    if (messageComplete) {
                        stopPrinting();
                        trigger(EVENT_MESSAGE_PRINTING_COMPLETE);
                    } else {
                        i += 1;
                    }

                }, PRINT_INTERVAL);
            }
        };
    })();

    const sleepTimerView = (() => {
        const elSleepTimerTime = document.getElementById('sleepTimerTime'),
            elSleepTimerRunningDisplay = document.getElementById('sleepTimerRunningDisplay'),
            elSleepTimerButtons = document.getElementById('sleepTimerButtons'),
            elCancelSleepTimerButton = document.getElementById('cancelSleepTimerButton'),

            HIDDEN_CSS_CLASS = 'hidden',
            BUTTONS = [
                [90, '90 Minutes'],
                [60, '60 Minutes'],
                [45, '45 minutes'],
                [30, '30 minutes'],
                [15, '15 minutes']
            ];

        function formatTimePart(value) {
            return (value < 10 ? '0' : '') + value;
        }

        return {
            init() {
                elSleepTimerButtons.innerHTML = '';
                BUTTONS.forEach(details => {
                    const [minutes, text] = details;
                    const button = document.createElement('li');
                    button.classList.add('showButton');
                    button.innerHTML = text;

                    button.onclick = () => {
                        trigger(EVENT_SET_SLEEP_TIMER_CLICK, minutes);
                    };

                    elSleepTimerButtons.appendChild(button);
                });
                elCancelSleepTimerButton.onclick = () => {
                    trigger(EVENT_CANCEL_SLEEP_TIMER_CLICK);
                };
            },
            render(totalSeconds) {
                const hours = Math.floor(totalSeconds / 3600),
                    minutes = Math.floor((totalSeconds % 3600) / 60),
                    seconds = totalSeconds % 60;
                elSleepTimerTime.innerHTML = `${formatTimePart(hours)}:${formatTimePart(minutes)}:${formatTimePart(seconds)}`;
            },
            setRunState(isRunning) {
                elSleepTimerRunningDisplay.classList.toggle(HIDDEN_CSS_CLASS, !isRunning);
            }
        };
    })();

    const viewSchedule = (() => {
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
                li.onclick = () => {
                    trigger(EVENT_SCHEDULE_BUTTON_CLICK, channel.id);
                };
                elChannelLinks.appendChild(li);
                channelToElement[channel.id] = li;
            },
            setSelectedChannel(selectedChannelId) {
                Object.keys(channelToElement).forEach(channelId => {
                    const el = channelToElement[channelId];
                    el.classList.toggle(CSS_CLASS_SELECTED, selectedChannelId === channelId);
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
    })();

    function triggerWake() {
        trigger(EVENT_WAKE_UP);
    }

    elMenuOpenButton.onclick = () => {
        trigger(EVENT_MENU_OPEN_CLICK);
    };
    elMenuCloseButton.onclick = () => {
        trigger(EVENT_MENU_CLOSE_CLICK);
    };

    elVolumeUp.onclick = () => {
        trigger(EVENT_VOLUME_UP_CLICK);
    };
    elVolumeDown.onclick = () => {
        trigger(EVENT_VOLUME_DOWN_CLICK);
    };

    sleepTimerView.init();

    return {
        on(eventName, handler) {
            eventTarget.addEventListener(eventName, handler);
        },

        setChannels(channels) {
            channels.forEach(channel => {
                buildChannelButton(channel);
                viewSchedule.addChannel(channel);
            });

            if (channels.length <= FEW_CHANNELS_LIMIT) {
                elButtonContainer.classList.add('fewerChannels');
            }

            elButtonContainer.scroll({left: 1000});
            elButtonContainer.scroll({behavior:'smooth', left: 0});
        },

        setNoChannelSelected() {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_PLAYING, CLASS_ERROR);
            });
        },

        setChannelLoading(channelId) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_PLAYING, CLASS_ERROR);
                el.classList.toggle(CLASS_LOADING, id === channelId);
            });
        },

        setChannelLoaded(channelId) {
            forEachChannelButton((id, el) => {
                el.classList.remove(CLASS_LOADING, CLASS_ERROR);
                el.classList.toggle(CLASS_PLAYING, id === channelId);
            });
        },

        openMenu() {
            elMenuBox.classList.add('visible');
            elMenuOpenButton.style.display = 'none';
            elMenuCloseButton.style.display = 'inline';
        },
        closeMenu() {
            elMenuBox.classList.remove('visible');
            elMenuOpenButton.style.display = 'inline';
            elMenuCloseButton.style.display = 'none';
        },

        updateVolume(volume, minVolume, maxVolume) {
            volumeLeds.forEach((el, i) => el.classList.toggle('on', (i + 1) <= volume));
            elVolumeDown.classList.toggle('disabled', volume === minVolume);
            elVolumeUp.classList.toggle('disabled', volume === maxVolume);
        },

        showMessage(message) {
            messagePrinter.print(message);
        },

        startSleepTimer() {
            sleepTimerView.setRunState(true);
        },
        updateSleepTimer(seconds) {
            sleepTimerView.render(seconds);
        },
        clearSleepTimer() {
            sleepTimerView.setRunState(false);
        },
        sleep() {
            this.closeMenu();
            sleepTimerView.setRunState(false);
            document.body.classList.add('sleeping');
            document.body.addEventListener('mousemove', triggerWake);
            document.body.addEventListener('touchstart', triggerWake);
            document.body.addEventListener('keydown', triggerWake);
        },
        wakeUp() {
            document.body.classList.remove('sleeping');
            document.body.removeEventListener('mousemove', triggerWake);
            document.body.removeEventListener('touchstart', triggerWake);
            document.body.removeEventListener('keydown', triggerWake);
        },
        updateScheduleChannelSelection(channelId) {
            viewSchedule.setSelectedChannel(channelId);
        },
        displaySchedule(schedule) {
            viewSchedule.displaySchedule(schedule);
        },
        hideSchedule() {
            viewSchedule.hideSchedule();
        }


    };
}