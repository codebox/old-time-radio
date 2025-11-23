/**
 * Document representing an episode from the OTR data API.
 * Used throughout the application for episode data with convenient getter methods.
 * Provides access to episode metadata including show name, episode title, date, summaries, and URLs.
 */
export class OtrDocument {
    id;
    text;
    metadata;
    constructor(data) {
        this.id = data.id;
        this.text = data.text;
        this.metadata = data.metadata;
    }
    get url() {
        return this.metadata.url;
    }
    get show() {
        return this.metadata.show;
    }
    get number() {
        return Number(this.metadata.number);
    }
    padTime(num) {
        return num.toString().padStart(2, '0');
    }
    get length() {
        const totalSeconds = Number(this.metadata.length), hours = Math.floor(totalSeconds / 3600), minutes = Math.floor((totalSeconds % 3600) / 60), seconds = Math.floor(totalSeconds % 60);
        if (hours) {
            return `${hours}:${this.padTime(minutes)}:${this.padTime(seconds)}`;
        }
        else {
            return `${minutes}:${this.padTime(seconds)}`;
        }
    }
    get episode() {
        return this.metadata.episode;
    }
    get date() {
        return this.metadata.date;
    }
    get summarySmall() {
        return this.metadata.summary_small;
    }
    get summaryMedium() {
        return this.metadata.summary_medium;
    }
    get episodePageUrl() {
        return `/episode/${this.id}`;
    }
}
//# sourceMappingURL=types.mjs.map