export declare type ResultCallback = (error: Error, result: any) => void;
declare abstract class CacheAdapter {
    expire: number;
    constructor(expire: number);
    abstract get(key: string, callback: ResultCallback): void;
    abstract set(key: string, value: string, callback: ResultCallback): void;
    abstract touch(key: string, callback: ResultCallback): void;
}
export default CacheAdapter;
