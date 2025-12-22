export function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function rndRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function rndItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
