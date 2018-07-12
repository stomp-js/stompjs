/**
 * Supported STOMP versions
 */
var Versions = /** @class */ (function () {
    function Versions() {
    }
    /**
     * @internal
     */
    Versions.versions = function () {
        return [Versions.V1_0, Versions.V1_1, Versions.V1_2];
    };
    /**
     * @internal
     */
    Versions.supportedVersions = function () {
        return Versions.versions().join(',');
    };
    /**
     * @internal
     */
    Versions.protocolVersions = function () {
        return Versions.versions().map(function (x) { return "v" + x.replace('.', '') + ".stomp"; });
    };
    /**
     * 1.0
     */
    Versions.V1_0 = '1.0';
    /**
     * 1.1
     */
    Versions.V1_1 = '1.1';
    /**
     * 1.2
     */
    Versions.V1_2 = '1.2';
    return Versions;
}());
export { Versions };
//# sourceMappingURL=versions.js.map