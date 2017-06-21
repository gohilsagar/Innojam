import CacheAdapter from './CacheAdapter';
import { ResultCallback } from './CacheAdapter';
export default class MemcachedAdapter extends CacheAdapter {
    memcachedClient: any;
    expire: number;
    constructor(memcachedClient: any, expire: number);
    get(key: string, callback: ResultCallback): void;
    set(key: string, value: string, callback: ResultCallback): void;
    touch(key: string, callback: ResultCallback): void;
}
