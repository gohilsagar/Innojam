import { Wit } from 'node-wit';
import CacheAdapter from './adapters/CacheAdapter';
export interface IIntent {
    intent: string;
    score: number;
}
export interface IEntity {
    entity: string;
    rawEntity: Object;
    type: string;
    startIndex?: number;
    endIndex?: number;
    score?: number;
}
export interface IRecognizeContext {
    message: {
        text: string;
    };
}
export interface IIntentRecognizerResult {
    score: number;
    intent: string;
    intents?: IIntent[];
    entities?: IEntity[];
}
export interface IOptions {
    cache?: any;
    expire?: number;
}
export declare enum CacheClients {
    Unknown = 0,
    Redis = 1,
    Memcached = 2,
}
export declare class WitRecognizer {
    witClient: Wit;
    cacheAdapter: CacheAdapter;
    constructor(accessToken: string, options?: IOptions);
    recognize(context: IRecognizeContext, done: (err: Error, result: IIntentRecognizerResult) => void): void;
    getClientType(client: any): CacheClients;
    witDecorator(message: Function): (utterance: string) => any;
}
