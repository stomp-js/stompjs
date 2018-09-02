import { RawFrameType } from './types';
export declare class Parser {
    onFrame: (rawFrame: RawFrameType) => void;
    onIncomingPing: () => void;
    private readonly _encoder;
    private readonly _decoder;
    private _results;
    private _token;
    private _headerKey;
    private _bodyBytesRemaining;
    private _onByte;
    constructor(onFrame: (rawFrame: RawFrameType) => void, onIncomingPing: () => void);
    parseChunk(segment: string | ArrayBuffer): void;
    private _collectFrame;
    private _collectCommand;
    private _collectHeaders;
    private _reinjectByte;
    private _collectHeaderKey;
    private _collectHeaderValue;
    private _setupCollectBody;
    private _collectBodyNullTerminated;
    private _collectBodyFixedSize;
    private _retrievedBody;
    private _consumeByte;
    private _consumeTokenAsUTF8;
    private _consumeTokenAsRaw;
    private _initState;
}
