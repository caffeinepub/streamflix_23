import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WatchlistItem {
    id: bigint;
    itemType: ItemType;
}
export enum ItemType {
    tv = "tv",
    movie = "movie"
}
export interface backendInterface {
    getWatchlist(): Promise<Array<WatchlistItem>>;
    toggleItem(id: bigint, itemType: ItemType): Promise<void>;
}
