/**
 * Supported STOMP versions
 *
 * Part of `@stomp/stompjs`.
 */
export declare class Versions {
    versions: string[];
    /**
     * Indicates protocol version 1.0
     */
    static V1_0: string;
    /**
     * Indicates protocol version 1.1
     */
    static V1_1: string;
    /**
     * Indicates protocol version 1.2
     */
    static V1_2: string;
    /**
     * @internal
     */
    static default: Versions;
    /**
     * Takes an array of string of versions, typical elements '1.0', '1.1', or '1.2'
     *
     * You will an instance if this class if you want to override supported versions to be declared during
     * STOMP handshake.
     */
    constructor(versions: string[]);
    /**
     * Used as part of CONNECT STOMP Frame
     */
    supportedVersions(): string;
    /**
     * Used while creating a WebSocket
     */
    protocolVersions(): string[];
}
