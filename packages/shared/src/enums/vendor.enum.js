"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorAuthType = exports.VendorStatus = void 0;
var VendorStatus;
(function (VendorStatus) {
    VendorStatus["ACTIVE"] = "active";
    VendorStatus["PENDING"] = "pending";
    VendorStatus["BLOCKED"] = "blocked";
    VendorStatus["SUSPENDED"] = "suspended";
})(VendorStatus || (exports.VendorStatus = VendorStatus = {}));
var VendorAuthType;
(function (VendorAuthType) {
    VendorAuthType["API_KEY"] = "api_key";
    VendorAuthType["OAUTH2"] = "oauth2";
    VendorAuthType["CERTIFICATE"] = "certificate";
    VendorAuthType["TOKEN"] = "token";
})(VendorAuthType || (exports.VendorAuthType = VendorAuthType = {}));
//# sourceMappingURL=vendor.enum.js.map