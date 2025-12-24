import { config } from './config.mjs';
import { EVENT_NEW_MESSAGE } from './events.mjs';
import type { MessageManager, Model, EventSource, PlaylistItem } from './types.mjs';

export function buildMessageManager(model: Model, eventSource: EventSource): MessageManager {
    const TEMP_MESSAGE_DURATION = config.messages.tempMessageDurationMillis;

    let persistentMessage: string,
        temporaryMessage: string | null;

    function triggerNewMessage(text: string, isTemp = false) {
        if (isTemp) {
            if (temporaryMessage) {
                return;
            }
            temporaryMessage = text;
            setTimeout(() => {
                if (temporaryMessage === text) {
                    triggerNewMessage(persistentMessage);
                }
            }, TEMP_MESSAGE_DURATION);

        } else {
            temporaryMessage = null;
            persistentMessage = text;
        }
        eventSource.trigger(EVENT_NEW_MESSAGE, { text, isTemp });
    }

    const cannedMessages = (() => {
        function showNext(): string | undefined {
            const nonCommercials = (model.playlist || []).filter((item: PlaylistItem) => !item.isCommercial);
            if (nonCommercials.length) {
                return `Up next: ${nonCommercials[0].show}`;
            }
            return undefined;
        }
        function getModeSpecificCannedMessages(): string[] {
            if (model.isUserChannelMode()) {
                return config.messages.canned.userChannel;
            } else if (model.isSingleShowMode()) {
                return config.messages.canned.singleShow;
            } else {
                return config.messages.canned.normal;
            }
        }

        let messages: (string | (() => string | undefined))[],
            nextIndex = 0;
        return {
            init() {
                const modeSpecificCannedMessages = getModeSpecificCannedMessages(),
                    allCannedMessages = [...modeSpecificCannedMessages, ...config.messages.canned.all];

                messages = allCannedMessages.map(textMessage => [showNext, textMessage]).flatMap(m => m);
            },
            next(): string | undefined {
                const nextMsg = messages[nextIndex = (nextIndex + 1) % messages.length];
                return (typeof nextMsg === 'function') ? nextMsg() : nextMsg;
            }
        };
    })();

    return {
        on: eventSource.on,
        init() {
            cannedMessages.init();
        },
        showLoadingChannels() {
            triggerNewMessage('Loading Channels...');
        },
        showSelectChannel() {
            if (model.channels && model.channels.length === 1) {
                triggerNewMessage(`Press the '${model.channels[0].name}' button to tune in`);
            } else {
                triggerNewMessage('Select a channel');
            }
        },
        showTuningInToChannel(channelName: string) {
            if (model.isSingleShowMode() || model.isUserChannelMode()) {
                triggerNewMessage(`Tuning in to ${channelName}...`);
            } else {
                triggerNewMessage(`Tuning in to the ${channelName} channel...`);
            }
        },
        showNowPlaying(playlistItem: PlaylistItem) {
            triggerNewMessage(`${playlistItem.show} - ${playlistItem.title} ${playlistItem.date ? `[${playlistItem.date}]` : ''}`);
        },
        showTempMessage() {
            const msgText = cannedMessages.next();
            if (msgText) {
                triggerNewMessage(msgText, true);
            }
        },
        showSleeping() {
            triggerNewMessage('Sleeping');
        },
        showError() {
            triggerNewMessage(`There is a reception problem, please adjust your aerial`);
        }
    };
}
