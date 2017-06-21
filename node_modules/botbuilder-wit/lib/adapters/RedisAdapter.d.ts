import CacheAdapter from './CacheAdapter';
import { ResultCallback } from './CacheAdapter';
export default class RedisAdapter extends CacheAdapter {
    redisClient: any;
    expire: number;
    constructor(redisClient: any, expire: number);
    get(key: string, callback: ResultCallback): void;
    set(key: string, value: string, callback: ResultCallback): void;
    touch(key: string, callback: ResultCallback): void;
}
