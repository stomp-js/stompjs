/**
 * Supported STOMP versions
 */
export declare class Versions {
    /**
     * 1.0
     */
    static V1_0: string;
    /**
     * 1.1
     */
    static V1_1: string;
    /**
     * 1.2
     */
    static V1_2: string;
    /**
     * @internal
     */
    static versions(): string[];
    /**
     * @internal
     */
    static supportedVersions(): string;
    /**
     * @internal
     */
    static protocolVersions(): string[];
}
